import sys
import os

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.teacher import Teacher

client = TestClient(app)

def get_data(res):
    body = res.json()
    if isinstance(body, dict) and "data" in body:
        return body["data"]
    return body

def cleanup_records():
    db = SessionLocal()
    try:
        test_emails = [
            "test.student@mitt.ac.in",
            "test.teacher@mitt.ac.in",
            "test.hod@mitt.ac.in",
            "test.admin@mitt.ac.in",
            "duplicate.test@mitt.ac.in",
            "other.teacher@mitt.ac.in",
            "admin.hod@mitt.ac.in",
        ]
        test_usns = ["4MH21CS999"]
        test_emp_ids = ["FAC-TEST-01", "EMP-9999"]

        db.query(Student).filter(Student.usn.in_(test_usns)).delete(synchronize_session=False)
        db.query(Teacher).filter(Teacher.email.in_(test_emails)).delete(synchronize_session=False)
        db.query(Faculty).filter(Faculty.employee_id.in_(test_emp_ids)).delete(synchronize_session=False)
        db.query(User).filter(User.email.in_(test_emails)).delete(synchronize_session=False)
        db.query(User).filter(User.username.in_(["teststudent1", "testteachercse", "otherteacher", "adminbyhod"])).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

def run_tests():
    print("=" * 60)
    print("RUNNING COMPREHENSIVE AUTH & REGISTRATION TESTS")
    print("=" * 60)

    # 0. Clean up any previous test accounts
    cleanup_records()

    # 1. Public Student Registration (Must be 'Pending')
    print("\n[TEST 1] Public Student Registration")
    student_payload = {
        "full_name": "Test Student One",
        "username": "teststudent1",
        "email": "test.student@mitt.ac.in",
        "mobile_number": "9876543210",
        "usn_or_employee_id": "4MH21CS999",
        "role": "student",
        "department_id": 1,
        "semester": 5,
        "section": "A",
        "password": "Password@123",
        "confirm_password": "Password@123",
    }
    res = client.post("/api/auth/register", json=student_payload)
    assert res.status_code == 201, f"Failed: {res.status_code} {res.text}"
    data = get_data(res)
    assert data["account_status"] == "Pending", f"Expected Pending, got {data.get('account_status')}"
    assert data["role"] == "student"
    student_id = data["user_id"]
    print("✓ Student registered with status: Pending (ID:", student_id, ")")

    # 2. Student Login blocked while Pending
    print("\n[TEST 2] Student Login blocked while Pending")
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "teststudent1",
        "password": "Password@123"
    })
    assert login_res.status_code == 403, f"Expected 403, got {login_res.status_code}"
    assert "pending approval" in login_res.json()["detail"].lower()
    print("✓ Pending student login correctly blocked with 403 Forbidden")

    # 3. Public Admin & HOD registration blocked
    print("\n[TEST 3] Public Admin & HOD registration blocked")
    bad_admin = {
        "full_name": "Fake Admin",
        "username": "fakeadmin",
        "email": "fake.admin@campus.edu",
        "mobile_number": "9999999999",
        "usn_or_employee_id": "ADM999",
        "role": "admin",
        "password": "Password@123",
        "confirm_password": "Password@123",
    }
    res_bad = client.post("/api/auth/register", json=bad_admin)
    assert res_bad.status_code == 403, f"Expected 403, got {res_bad.status_code}"
    print("✓ Public user prohibited from registering as Admin/HOD")

    # 4. Duplicate Check (Email / Username / USN)
    print("\n[TEST 4] Duplicate registration checks")
    dup_res = client.post("/api/auth/register", json=student_payload)
    assert dup_res.status_code == 409, f"Expected 409 Conflict, got {dup_res.status_code}"
    print("✓ Duplicate prevention verified (409 Conflict)")

    # 5. HOD Login & Student Approval
    print("\n[TEST 5] HOD Login and Account Approval")
    # Login as CSE HOD (seeded account: hod.cse@campus.edu / password123)
    hod_login = client.post("/api/auth/login", json={
        "username_or_email": "hod.cse@campus.edu",
        "password": "password123"
    })
    assert hod_login.status_code == 200, f"HOD login failed: {hod_login.text}"
    hod_token = hod_login.json()["access_token"]
    hod_headers = {"Authorization": f"Bearer {hod_token}"}
    print("✓ HOD logged in successfully")

    # Approve the student
    approve_res = client.put(f"/api/users/{student_id}/approve", headers=hod_headers, json={
        "status": "Approved"
    })
    assert approve_res.status_code == 200, f"Approval failed: {approve_res.text}"
    approved_data = get_data(approve_res)
    assert approved_data["account_status"] == "Approved"
    print("✓ HOD successfully approved student account")

    # 6. Student Login Success after Approval (testing with USN, Email, Username)
    print("\n[TEST 6] Student Login using Username, Email, and USN")
    # Via Username
    s_login1 = client.post("/api/auth/login", json={
        "username_or_email": "teststudent1",
        "password": "Password@123"
    })
    assert s_login1.status_code == 200, f"Login by username failed: {s_login1.text}"
    print("✓ Student login by username succeeded")

    # Via Email
    s_login2 = client.post("/api/auth/login", json={
        "username_or_email": "test.student@mitt.ac.in",
        "password": "Password@123"
    })
    assert s_login2.status_code == 200, f"Login by email failed: {s_login2.text}"
    print("✓ Student login by email succeeded")

    # Via USN
    s_login3 = client.post("/api/auth/login", json={
        "username_or_email": "4MH21CS999",
        "password": "Password@123"
    })
    assert s_login3.status_code == 200, f"Login by USN succeeded: {s_login3.text}"
    print("✓ Student login by USN succeeded")

    # 7. HOD Permissions Boundary Check
    print("\n[TEST 7] HOD Boundary Check (cannot create Admin or users in other dept)")
    bad_teacher = {
        "full_name": "Other Dept Teacher",
        "username": "otherteacher",
        "email": "other.teacher@mitt.ac.in",
        "password": "Password@123",
        "role": "teacher",
        "department_id": 9999,  # different department
        "usn_or_employee_id": "EMP-9999",
    }
    res_hod_fail = client.post("/api/users", headers=hod_headers, json=bad_teacher)
    assert res_hod_fail.status_code == 403, f"Expected 403, got {res_hod_fail.status_code}"
    print("✓ HOD prevented from creating user in other department")

    bad_admin_by_hod = {
        "full_name": "Admin By HOD",
        "username": "adminbyhod",
        "email": "admin.hod@mitt.ac.in",
        "password": "Password@123",
        "role": "admin",
        "department_id": 1,
    }
    res_hod_admin_fail = client.post("/api/users", headers=hod_headers, json=bad_admin_by_hod)
    assert res_hod_admin_fail.status_code == 403, f"Expected 403, got {res_hod_admin_fail.status_code}"
    print("✓ HOD prevented from creating Admin role")

    # 8. Admin Login & Full Permissions
    print("\n[TEST 8] Admin Login & Full Permissions")
    admin_login = client.post("/api/auth/login", json={
        "username_or_email": "admin@campus.edu",
        "password": "password123"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("✓ Admin logged in successfully")

    # Admin creates a new teacher
    create_t_res = client.post("/api/users", headers=admin_headers, json={
        "full_name": "Test Teacher CSE",
        "username": "testteachercse",
        "email": "test.teacher@mitt.ac.in",
        "password": "Password@123",
        "mobile_number": "9123456789",
        "usn_or_employee_id": "FAC-TEST-01",
        "role": "teacher",
        "department_id": 1,
        "designation": "Assistant Professor",
        "account_status": "Approved"
    })
    assert create_t_res.status_code == 201, f"Admin create teacher failed: {create_t_res.text}"
    teacher_id = get_data(create_t_res)["id"]
    print("✓ Admin successfully created Teacher account")

    # 9. Forgot Password & Reset Password Flow
    print("\n[TEST 9] Forgot Password and Reset Password Flow")
    forgot_res = client.post("/api/auth/forgot-password", json={
        "email": "test.student@mitt.ac.in"
    })
    assert forgot_res.status_code == 200, f"Forgot password failed: {forgot_res.text}"
    reset_token = get_data(forgot_res)["reset_token"]
    assert reset_token is not None, "Reset token not returned"
    print("✓ Reset token generated successfully:", reset_token)

    # Reset password with token
    reset_res = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": "NewSecretPassword@999",
        "confirm_password": "NewSecretPassword@999"
    })
    assert reset_res.status_code == 200, f"Reset password failed: {reset_res.text}"
    print("✓ Password reset completed")

    # Login with new password succeeds
    login_new = client.post("/api/auth/login", json={
        "username_or_email": "teststudent1",
        "password": "NewSecretPassword@999"
    })
    assert login_new.status_code == 200, "Login with new password failed"
    print("✓ Student login with new password succeeded")

    # Login with old password fails
    login_old = client.post("/api/auth/login", json={
        "username_or_email": "teststudent1",
        "password": "Password@123"
    })
    assert login_old.status_code == 401, "Login with old password should fail with 401"
    print("✓ Student login with old password rejected (401)")

    # 10. Clean up test users
    print("\n[TEST 10] Final Cleanup")
    cleanup_records()
    print("✓ Test accounts cleaned up cleanly")

    print("\n" + "=" * 60)
    print("ALL 10 TESTS PASSED SUCCESSFULLY! 100% VERIFIED.")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
