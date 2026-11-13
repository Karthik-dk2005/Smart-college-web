import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.student import Student
from app.utils.security import get_password_hash

client = TestClient(app)

def test_login_and_registration_suite():
    db = SessionLocal()

    print("\n" + "="*60)
    print("VERIFYING SIMPLE LOGIN, REGISTRATION & RECOVERY PAGES")
    print("="*60)

    # 1. Check USN (Existing)
    print("\n[TEST 1] POST /api/auth/student/check-usn (Existing Student)")
    res = client.post("/api/auth/student/check-usn", json={"usn": "4MN25CS410"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["name"] == "KARTHIKA D K"
    assert data["gmail"] == "karthikdk1169@gmail.com"
    assert data["section"] == "B"
    print(f"✓ USN found: Name='{data['name']}', Gmail='{data['gmail']}', Sec={data['section']}")

    # 2. Check USN (Non-existent -> 404 exact message)
    print("\n[TEST 2] POST /api/auth/student/check-usn (Non-existent USN)")
    res = client.post("/api/auth/student/check-usn", json={"usn": "4MN99CS999"})
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    detail = res.json().get("detail", "")
    assert detail == "Student record not found. Please contact your Admin.", f"Unexpected: {detail}"
    print(f"✓ Rejected with exact message: '{detail}'")

    # 3. Test Student Registration (USN + Password + Confirm Password)
    print("\n[TEST 3] POST /api/auth/student/register")
    # Reset test student to Unregistered first
    stud = db.query(Student).filter(Student.usn == "4MN24CS002").first()
    assert stud is not None, "Student 4MN24CS002 must exist"
    stud.registration_status = "Unregistered"
    stud.otp_code = None
    stud.password_hash = None
    db.commit()

    res = client.post("/api/auth/student/register", json={
        "usn": "4MN24CS002",
        "password": "Password@2026",
        "confirm_password": "Password@2026"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    print("✓ OTP generated and sent to registered Gmail")

    # 4. Verify OTP
    db.refresh(stud)
    otp = stud.otp_code
    assert otp is not None and len(otp) == 6

    print("\n[TEST 4] POST /api/auth/student/verify-otp")
    res = client.post("/api/auth/student/verify-otp", json={
        "usn": "4MN24CS002",
        "otp": otp
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["user"]["role"] == "student"
    print("✓ OTP verified and student account activated successfully!")

    # 5. Role-Based Login for all 4 roles:
    print("\n[TEST 5] Role-Based Login Verification (Admin, HOD, Teacher, Student)")
    # 5.1 Admin
    res = client.post("/api/auth/login", json={
        "username_or_email": "admin@campus.edu",
        "password": "password123"
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    assert res.json()["role"] == "admin"
    print("✓ Admin login verified: Role = 'admin'")

    # 5.2 HOD
    res = client.post("/api/auth/login", json={
        "username_or_email": "hod.cse@campus.edu",
        "password": "password123"
    })
    assert res.status_code == 200, f"HOD login failed: {res.text}"
    assert res.json()["role"] == "hod"
    print("✓ HOD login verified: Role = 'hod'")

    # 5.3 Teacher
    res = client.post("/api/auth/login", json={
        "username_or_email": "ananya.iyer@faculty.campus.edu",
        "password": "password123"
    })
    assert res.status_code == 200, f"Teacher login failed: {res.text}"
    assert res.json()["role"] in ("teacher", "faculty")
    print("✓ Teacher login verified: Role = 'teacher'")

    # 5.4 Student (using USN!)
    res = client.post("/api/auth/login", json={
        "username_or_email": "4MN24CS002",
        "password": "Password@2026"
    })
    assert res.status_code == 200, f"Student login failed: {res.text}"
    assert res.json()["role"] == "student"
    assert res.json()["usn"] == "4MN24CS002"
    print("✓ Student login with USN verified: Role = 'student'")

    # 6. Forgot Password Flow
    print("\n[TEST 6] Forgot Password Recovery Flow")
    # 6.1 Request OTP with USN
    res = client.post("/api/auth/student/forgot-password", json={"usn": "4MN24CS002"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    print("✓ Recovery OTP sent to registered Gmail")

    # 6.2 Get OTP from DB and verify
    db.refresh(stud)
    recovery_otp = stud.otp_code
    assert recovery_otp is not None and len(recovery_otp) == 6

    res = client.post("/api/auth/student/verify-recovery-otp", json={
        "usn": "4MN24CS002",
        "otp": recovery_otp
    })
    assert res.status_code == 200, f"Recovery OTP verification failed: {res.text}"
    print("✓ Recovery OTP verified successfully")

    # 6.3 Reset Password
    res = client.post("/api/auth/student/reset-password", json={
        "usn": "4MN24CS002",
        "otp": recovery_otp,
        "new_password": "NewSecretPassword@999",
        "confirm_password": "NewSecretPassword@999"
    })
    assert res.status_code == 200, f"Password reset failed: {res.text}"
    print("✓ Password reset completed")

    # 6.4 Login with new password
    res = client.post("/api/auth/login", json={
        "username_or_email": "4MN24CS002",
        "password": "NewSecretPassword@999"
    })
    assert res.status_code == 200, f"Login with new password failed: {res.text}"
    print("✓ Student login with new updated password succeeded!")

    # 6.5 Old password rejected
    res = client.post("/api/auth/login", json={
        "username_or_email": "4MN24CS002",
        "password": "Password@2026"
    })
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("✓ Login with old password correctly rejected (401)")

    db.close()
    print("\n" + "="*60)
    print("ALL SIMPLE LOGIN, REGISTRATION & RECOVERY TESTS PASSED 100%!")
    print("="*60)

if __name__ == "__main__":
    test_login_and_registration_suite()
