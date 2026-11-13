import sys
sys.path.insert(0, 'backend')
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.student import Student
from app.models.user import User

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("TESTING EASY STUDENT REGISTRATION & DASHBOARD FLOW")
    print("=" * 60)

    # 1. Test check-usn with 4MN25CS410
    print("\n[TEST 1] POST /api/auth/student/check-usn (Valid USN)")
    res = client.post("/api/auth/student/check-usn", json={"usn": "4MN25CS410"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["usn"] == "4MN25CS410"
    assert data["name"] == "KARTHIKA D K"
    assert data["gmail"] == "karthikdk1169@gmail.com"
    assert data["semester"] == 5
    assert data["section"] == "B"
    print(f"✓ USN found: Name='{data['name']}', Gmail='{data['gmail']}', Sec={data['section']}")

    # 2. Test check-usn with non-existent USN (Exact required message)
    print("\n[TEST 2] POST /api/auth/student/check-usn (Non-existent USN)")
    res_fake = client.post("/api/auth/student/check-usn", json={"usn": "4MN99CS999"})
    assert res_fake.status_code == 404
    assert "Student record not found. Please contact your Admin." in res_fake.json()["detail"]
    print("✓ Non-existent USN correctly rejected with: 'Student record not found. Please contact your Admin.'")

    # Pick another student to test full easy registration: e.g. 4MN24CS002 (ABHILASH KUMAR K)
    db = SessionLocal()
    stud = db.query(Student).filter(Student.usn == '4MN24CS002').first()
    assert stud is not None
    stud.registration_status = "Unregistered"
    stud.email_verification_status = "Unverified"
    stud.otp_code = None
    db.commit()
    db.close()

    # 3. Test check-usn for 4MN24CS002
    print("\n[TEST 3] POST /api/auth/student/check-usn for 4MN24CS002")
    res2 = client.post("/api/auth/student/check-usn", json={"usn": "4MN24CS002"})
    assert res2.status_code == 200
    assert res2.json()["name"] == "ABHILASH KUMAR K"
    assert res2.json()["gmail"] == "abhilashkumar27k@gmail.com"
    print("✓ Automatically retrieved Name and Gmail as read-only information")

    # 4. Test easy register with USN and password
    print("\n[TEST 4] POST /api/auth/student/register (USN, Password, Confirm Password)")
    reg_res = client.post("/api/auth/student/register", json={
        "usn": "4MN24CS002",
        "password": "EasyPassword@123",
        "confirm_password": "EasyPassword@123"
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    assert "verification code has been sent" in reg_res.json()["message"]
    print("✓ OTP generated and sent to registered Gmail")

    # Retrieve OTP from DB
    db = SessionLocal()
    stud = db.query(Student).filter(Student.usn == '4MN24CS002').first()
    otp_code = stud.otp_code
    assert otp_code is not None and len(otp_code) == 6
    db.close()

    # 5. Test verify-otp
    print("\n[TEST 5] POST /api/auth/student/verify-otp (USN & OTP)")
    otp_res = client.post("/api/auth/student/verify-otp", json={
        "usn": "4MN24CS002",
        "otp": otp_code
    })
    assert otp_res.status_code == 200, f"OTP verification failed: {otp_res.text}"
    otp_data = otp_res.json()
    assert "access_token" in otp_data
    token = otp_data["access_token"]
    print("✓ OTP verified and account activated successfully!")

    # 6. Test student login using USN and password
    print("\n[TEST 6] POST /api/auth/student/login (USN & Password)")
    login_res = client.post("/api/auth/student/login", json={
        "usn": "4MN24CS002",
        "password": "EasyPassword@123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    student_token = login_res.json()["access_token"]
    print("✓ Student logged in with USN and password")

    # 7. Test get student profile (Dashboard Data)
    print("\n[TEST 7] GET /api/auth/student/profile (Student Dashboard Data)")
    headers = {"Authorization": f"Bearer {student_token}"}
    profile_res = client.get("/api/auth/student/profile", headers=headers)
    assert profile_res.status_code == 200, f"Profile failed: {profile_res.text}"
    prof = profile_res.json()
    assert prof["usn"] == "4MN24CS002"
    assert prof["name"] == "ABHILASH KUMAR K"
    assert prof["gmail"] == "abhilashkumar27k@gmail.com"
    assert prof["semester"] == 5
    assert prof["section"] == "A"
    assert "attendance" in prof
    assert "ia_marks" in prof
    print(f"✓ Profile loaded: IA Marks count={len(prof['ia_marks'])}, Attendance={prof['attendance'].get('percentage')}%")

    # 8. Test Admin password reset
    print("\n[TEST 8] POST /api/admin/student-registration/students/{usn}/reset-password")
    admin_login = client.post("/api/auth/login", json={
        "username_or_email": "admin@campus.edu",
        "password": "password123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    reset_res = client.post("/api/admin/student-registration/students/4MN24CS002/reset-password", json={
        "new_password": "NewAdminResetPassword@2026"
    }, headers=admin_headers)
    assert reset_res.status_code == 200
    print("✓ Admin successfully reset student password")

    # 9. Verify student logs in with new reset password
    print("\n[TEST 9] Student login with new reset password")
    new_login_res = client.post("/api/auth/student/login", json={
        "usn": "4MN24CS002",
        "password": "NewAdminResetPassword@2026"
    })
    assert new_login_res.status_code == 200
    print("✓ Student successfully logged in with new reset password!")

    print("\n" + "=" * 60)
    print("ALL EASY REGISTRATION & DASHBOARD TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
