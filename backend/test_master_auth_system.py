import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, create_dev_tables
from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.email_otp import EmailOTP

client = TestClient(app)

def test_full_master_auth_flow():
    print("=== STARTING COMPREHENSIVE MASTER AUTH SYSTEM TEST ===")
    create_dev_tables()
    db = SessionLocal()

    try:
        # 1. Test Send OTP
        test_email = "student.test.auth@gmail.com"
        print("\n--- 1. Testing Send OTP ---")
        db.query(EmailOTP).filter(EmailOTP.email == test_email).delete()
        db.commit()

        send_resp = client.post("/api/auth/send-otp", json={
            "email": test_email,
            "purpose": "Registration"
        })
        print("Send OTP Status:", send_resp.status_code, send_resp.json())
        assert send_resp.status_code == 200, f"Expected 200, got {send_resp.status_code}"

        # Fetch the generated OTP from DB
        otp_rec = db.query(EmailOTP).filter(EmailOTP.email == test_email).order_by(EmailOTP.id.desc()).first()
        assert otp_rec is not None, "OTP record not found in database"
        test_otp = otp_rec.otp_code
        print(f"Retrieved OTP from DB: {test_otp}")

        # 2. Test Verify OTP
        print("\n--- 2. Testing Verify OTP ---")
        verify_resp = client.post("/api/auth/verify-otp", json={
            "email": test_email,
            "otp": test_otp
        })
        print("Verify OTP Status:", verify_resp.status_code, verify_resp.json())
        assert verify_resp.status_code == 200, f"Expected 200, got {verify_resp.status_code}"

        # 3. Test Student Registration with USN
        print("\n--- 3. Testing Student Registration ---")
        student = db.query(Student).filter(Student.usn == "4MN24CS002").first()
        if not student:
            student = db.query(Student).first()
        assert student is not None, "No students found in database"
        test_usn = student.usn
        print(f"Testing with student USN: {test_usn} ({student.name})")
        
        # Reset registration status for clean test
        student.registration_status = "Unregistered"
        student.user_id = None
        student.password_hash = None
        # Remove any existing user with this USN
        old_user = db.query(User).filter(User.usn_or_employee_id == test_usn).first()
        if old_user:
            db.delete(old_user)
        db.commit()

        # Send fresh OTP for student registration
        stud_email = f"student_{test_usn.lower()}@gmail.com"
        # delete previous otps for this email to avoid rate limit in test
        db.query(EmailOTP).filter(EmailOTP.email == stud_email).delete()
        db.commit()

        client.post("/api/auth/send-otp", json={"email": stud_email, "purpose": "Registration"})
        stud_otp_rec = db.query(EmailOTP).filter(EmailOTP.email == stud_email).order_by(EmailOTP.id.desc()).first()
        stud_otp = stud_otp_rec.otp_code

        reg_resp = client.post("/api/auth/register/student", json={
            "usn": test_usn,
            "name": student.name,
            "gmail": stud_email,
            "password": "Password@123",
            "confirm_password": "Password@123",
            "otp": stud_otp
        })
        print("Student Register Status:", reg_resp.status_code)
        assert reg_resp.status_code == 200, f"Expected 200, got {reg_resp.status_code}: {reg_resp.text}"
        data = reg_resp.json()
        assert data["role"] == "student"
        assert data["account_status"] == "Approved"
        assert "access_token" in data
        print("Student registration successful, token obtained!")

        # 4. Test Student Login
        print("\n--- 4. Testing Student Login ---")
        login_resp = client.post("/api/auth/login", json={
            "username_or_email": test_usn,
            "password": "Password@123"
        })
        print("Student Login Status:", login_resp.status_code)
        assert login_resp.status_code == 200, f"Expected 200, got {login_resp.status_code}: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data["role"] == "student"
        student_token = login_data["access_token"]
        print("Student login successful!")

        # 5. Test Teacher Registration (Requires Admin Approval)
        print("\n--- 5. Testing Teacher Registration ---")
        teacher_emp_id = "FAC-CSE-002"
        teacher_rec = db.query(Teacher).filter(Teacher.employee_id == teacher_emp_id).first()
        assert teacher_rec is not None, f"Teacher {teacher_emp_id} not found"

        # Clean old user if exists
        old_teach_user = db.query(User).filter(User.usn_or_employee_id == teacher_emp_id).first()
        if old_teach_user:
            db.delete(old_teach_user)
            db.commit()

        teach_email = "test.teacher.fac002@gmail.com"
        db.query(EmailOTP).filter(EmailOTP.email == teach_email).delete()
        db.commit()

        client.post("/api/auth/send-otp", json={"email": teach_email, "purpose": "Teacher Registration"})
        teach_otp_rec = db.query(EmailOTP).filter(EmailOTP.email == teach_email).order_by(EmailOTP.id.desc()).first()
        teach_otp = teach_otp_rec.otp_code

        teach_reg_resp = client.post("/api/auth/register/teacher", json={
            "employee_id": teacher_emp_id,
            "name": teacher_rec.name,
            "department_id": teacher_rec.department_id or 1,
            "gmail": teach_email,
            "password": "TeacherPassword@123",
            "confirm_password": "TeacherPassword@123",
            "otp": teach_otp
        })
        print("Teacher Register Status:", teach_reg_resp.status_code, teach_reg_resp.json())
        assert teach_reg_resp.status_code == 201, f"Expected 201, got {teach_reg_resp.status_code}"
        assert teach_reg_resp.json()["account_status"] == "Pending"
        teach_user_id = teach_reg_resp.json()["user_id"]

        # 6. Verify Teacher CANNOT log in while Pending
        print("\n--- 6. Verifying Pending Teacher Login is Blocked ---")
        block_resp = client.post("/api/auth/login", json={
            "username_or_email": teacher_emp_id,
            "password": "TeacherPassword@123"
        })
        print("Pending Teacher Login Status:", block_resp.status_code, block_resp.json())
        assert block_resp.status_code == 403, f"Expected 403 Forbidden for pending user, got {block_resp.status_code}"

        # 7. Admin Login & Approval Dashboard
        print("\n--- 7. Testing Admin Approval Workflow ---")
        admin_login_resp = client.post("/api/auth/login", json={
            "username_or_email": "admin@campus.edu",
            "password": "password123"
        })
        print("Admin Login Status:", admin_login_resp.status_code)
        assert admin_login_resp.status_code == 200, f"Admin login failed: {admin_login_resp.text}"
        admin_token = admin_login_resp.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Check requests
        req_resp = client.get("/api/admin/registration-requests?status=Pending", headers=admin_headers)
        print("Admin Registration Requests Status:", req_resp.status_code)
        assert req_resp.status_code == 200
        req_data = req_resp.json()
        assert req_data["pending_count"] >= 1

        # Approve Teacher
        approve_resp = client.put(f"/api/admin/approve-registration/{teach_user_id}", headers=admin_headers)
        print("Approve Teacher Status:", approve_resp.status_code, approve_resp.json())
        assert approve_resp.status_code == 200
        assert approve_resp.json()["account_status"] == "Approved"

        # Now Teacher can log in!
        print("\n--- 8. Verifying Teacher Login after Admin Approval ---")
        teach_ok_login = client.post("/api/auth/login", json={
            "username_or_email": teacher_emp_id,
            "password": "TeacherPassword@123"
        })
        print("Approved Teacher Login Status:", teach_ok_login.status_code)
        assert teach_ok_login.status_code == 200, f"Expected 200 for approved teacher: {teach_ok_login.text}"
        assert teach_ok_login.json()["role"] == "teacher"
        teach_token = teach_ok_login.json()["access_token"]

        # 9. Test /api/auth/profile for Student and Teacher
        print("\n--- 9. Testing /api/auth/profile & /api/auth/me ---")
        stud_prof_resp = client.get("/api/auth/profile", headers={"Authorization": f"Bearer {student_token}"})
        assert stud_prof_resp.status_code == 200
        assert stud_prof_resp.json()["user"]["role"] == "student"
        print("Student profile endpoint verified!")

        teach_prof_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {teach_token}"})
        assert teach_prof_resp.status_code == 200
        assert teach_prof_resp.json()["user"]["role"] == "teacher"
        print("Teacher /me endpoint verified!")

        # 10. Test Forgot Password & Reset Password with OTP
        print("\n--- 10. Testing Forgot Password & Reset Password with OTP ---")
        # Clear recent OTPs for student email
        db.query(EmailOTP).filter(EmailOTP.email == stud_email).delete()
        db.commit()

        forgot_resp = client.post("/api/auth/forgot-password", json={
            "identifier": test_usn
        })
        print("Forgot Password Status:", forgot_resp.status_code, forgot_resp.json())
        assert forgot_resp.status_code == 200

        reset_otp_rec = db.query(EmailOTP).filter(EmailOTP.email == stud_email).order_by(EmailOTP.id.desc()).first()
        assert reset_otp_rec is not None
        reset_otp = reset_otp_rec.otp_code

        # Reset password using OTP
        reset_resp = client.post("/api/auth/reset-password", json={
            "identifier": test_usn,
            "otp": reset_otp,
            "new_password": "NewStudentPassword@2026",
            "confirm_password": "NewStudentPassword@2026"
        })
        print("Reset Password Status:", reset_resp.status_code, reset_resp.json())
        assert reset_resp.status_code == 200

        # Verify login with new password
        new_login_resp = client.post("/api/auth/login", json={
            "username_or_email": test_usn,
            "password": "NewStudentPassword@2026"
        })
        print("New Password Login Status:", new_login_resp.status_code)
        assert new_login_resp.status_code == 200, f"Login with new password failed: {new_login_resp.text}"

        print("\n=== ALL MASTER AUTH SYSTEM BACKEND TESTS PASSED 100%! ===")

    finally:
        db.close()

if __name__ == "__main__":
    test_full_master_auth_flow()
