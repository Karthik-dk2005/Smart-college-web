import sys
import os

sys.path.insert(0, 'backend')
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.student import Student
from app.models.user import User

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("TESTING STUDENT REGISTRATION & GMAIL/USN WORKFLOW")
    print("=" * 60)

    # Pick a student to test registration: e.g. 4MN25CS410 (KARTHIKA D K)
    # Check initial state in DB
    db = SessionLocal()
    student = db.query(Student).filter(Student.usn == '4MN25CS410').first()
    assert student is not None, "Student 4MN25CS410 must exist in DB"
    print(f"Target Student: {student.usn} | {student.name} | Gmail: {student.gmail}")
    
    # Reset status for testing registration flow
    student.registration_status = "Unregistered"
    student.email_verification_status = "Unverified"
    student.otp_code = None
    db.commit()
    db.close()

    # 1. Test verify-usn with valid USN
    print("\n[TEST 1] GET /api/auth/student/verify-usn/4MN25CS410")
    res = client.get("/api/auth/student/verify-usn/4MN25CS410")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["usn"] == "4MN25CS410"
    assert data["name"] == "KARTHIKA D K"
    assert data["has_gmail"] is True
    assert data["can_register"] is True
    assert "*" in data["masked_gmail"]
    print(f"✓ USN verified successfully: Name='{data['name']}', Masked Gmail='{data['masked_gmail']}'")

    # 2. Test verify-usn with non-existent USN
    print("\n[TEST 2] GET /api/auth/student/verify-usn/4MN99CS999 (Non-existent)")
    res = client.get("/api/auth/student/verify-usn/4MN99CS999")
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    print("✓ Non-existent USN correctly rejected with 404")

    # 3. Test registration initiation with unapproved / wrong Gmail
    print("\n[TEST 3] POST /api/auth/student/register with mismatched Gmail")
    res = client.post("/api/auth/student/register", json={
        "usn": "4MN25CS410",
        "gmail": "wrongemail@gmail.com"
    })
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    print("✓ Mismatched Gmail rejected correctly with 400")

    # 4. Test registration initiation with correct Gmail
    print("\n[TEST 4] POST /api/auth/student/register with official Gmail")
    res = client.post("/api/auth/student/register", json={
        "usn": "4MN25CS410",
        "gmail": "karthikdk1169@gmail.com"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert "verification code has been sent" in res.json()["message"]
    # Verify OTP is NOT exposed in response (Requirement 6)
    assert "otp" not in res.json(), "Security violation: OTP must not be exposed in frontend response"
    print("✓ OTP generated and sent without exposing OTP in response")

    # Fetch OTP securely from DB for verification testing
    db = SessionLocal()
    student = db.query(Student).filter(Student.usn == '4MN25CS410').first()
    generated_otp = student.otp_code
    assert generated_otp is not None and len(generated_otp) == 6
    db.close()

    # 5. Test verify-email with invalid OTP
    print("\n[TEST 5] POST /api/auth/student/verify-email with wrong OTP")
    res = client.post("/api/auth/student/verify-email", json={
        "usn": "4MN25CS410",
        "otp": "000000",
        "password": "SecurePassword@123",
        "confirm_password": "SecurePassword@123"
    })
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    print("✓ Invalid OTP rejected correctly with 400")

    # 6. Test verify-email with phone number as password (Requirement 6 policy)
    print("\n[TEST 6] POST /api/auth/student/verify-email with phone number as password")
    res = client.post("/api/auth/student/verify-email", json={
        "usn": "4MN25CS410",
        "otp": generated_otp,
        "password": "7204510380",
        "confirm_password": "7204510380"
    })
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    print("✓ Phone number password rejected correctly with 400")

    # 7. Test verify-email with valid OTP and strong password
    print("\n[TEST 7] POST /api/auth/student/verify-email with valid OTP & password")
    res = client.post("/api/auth/student/verify-email", json={
        "usn": "4MN25CS410",
        "otp": generated_otp,
        "password": "StudentPass@2026",
        "confirm_password": "StudentPass@2026"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    print("✓ Registration completed and account activated successfully!")

    # 8. Test student login using USN
    print("\n[TEST 8] POST /api/auth/student/login using USN")
    res = client.post("/api/auth/student/login", json={
        "identifier": "4MN25CS410",
        "password": "StudentPass@2026"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["user"]["usn"] == "4MN25CS410"
    assert data["user"]["name"] == "KARTHIKA D K"
    assert data["user"]["gmail"] == "karthikdk1169@gmail.com"
    assert data["user"]["semester"] == 5
    assert data["user"]["section"] == "B"
    print("✓ Student logged in with USN: Profile details returned correctly")

    # 9. Test student login using registered Gmail
    print("\n[TEST 9] POST /api/auth/student/login using registered Gmail")
    res = client.post("/api/auth/student/login", json={
        "identifier": "karthikdk1169@gmail.com",
        "password": "StudentPass@2026"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["user"]["usn"] == "4MN25CS410"
    print("✓ Student logged in with Gmail: Profile details verified")

    # 10. Test Admin Student Registration endpoints
    print("\n[TEST 10] Testing Admin Student Registration Management endpoints")
    admin_login = client.post("/api/auth/login", json={
        "username_or_email": "admin@campus.edu",
        "password": "password123"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Stats
    stats_res = client.get("/api/admin/student-registration/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print(f"✓ Admin Stats: Total={stats['total_students']}, Verified Gmail={stats['verified_gmail']}, Flagged={stats['flagged_for_admin']}, Unmatched={stats['unmatched_records']}")

    # Students list with search
    search_res = client.get("/api/admin/student-registration/students?search=KARTHIKA", headers=admin_headers)
    assert search_res.status_code == 200
    assert len(search_res.json()["students"]) >= 1
    print("✓ Admin search by name verified")

    search_usn = client.get("/api/admin/student-registration/students?search=4MN25CS410", headers=admin_headers)
    assert search_usn.status_code == 200
    assert len(search_usn.json()["students"]) == 1
    print("✓ Admin search by USN verified")

    search_gmail = client.get("/api/admin/student-registration/students?search=karthikdk1169", headers=admin_headers)
    assert search_gmail.status_code == 200
    assert len(search_gmail.json()["students"]) == 1
    print("✓ Admin search by Gmail verified")

    # Unmatched records
    unmatched_res = client.get("/api/admin/student-registration/unmatched", headers=admin_headers)
    assert unmatched_res.status_code == 200
    unmatched = unmatched_res.json()
    print(f"✓ Admin unmatched records verified: {len(unmatched)} records reported to Admin")

    # CSV Export
    export_res = client.get("/api/admin/student-registration/export", headers=admin_headers)
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers.get("content-type", "")
    assert "4MN25CS410" in export_res.text
    print("✓ Admin registration CSV export verified")

    # Edit student Gmail
    update_res = client.put("/api/admin/student-registration/students/4MN23CS116/gmail", json={
        "gmail": "varun.bharadwaj@gmail.com"
    }, headers=admin_headers)
    assert update_res.status_code == 200, f"Update gmail failed: {update_res.text}"
    print("✓ Admin updated missing Gmail for VARUN BHARADWAJ M (4MN23CS116) successfully")

    print("\n" + "=" * 60)
    print("ALL 10 STUDENT REGISTRATION WORKFLOW TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
