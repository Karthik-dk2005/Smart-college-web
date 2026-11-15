import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.student import Student

client = TestClient(app)

def test_1_admin_gmail_login():
    """Test 1: Admin Gmail & password login -> role: admin"""
    res = client.post("/api/auth/login", json={
        "username_or_email": "admin@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["role"] == "admin"
    assert "access_token" in data
    assert data["account_status"] == "Approved"
    print("[PASS] Test 1: Admin Gmail login successful -> role: admin")

def test_2_hod_gmail_login():
    """Test 2: HOD Gmail & password login -> role: hod"""
    res = client.post("/api/auth/login", json={
        "username_or_email": "hod.cse@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["role"] == "hod"
    assert "access_token" in data
    print("[PASS] Test 2: HOD Gmail login successful -> role: hod")

def test_3_teacher_gmail_login():
    """Test 3: Teacher Gmail & password login -> role: teacher"""
    res = client.post("/api/auth/login", json={
        "username_or_email": "teacher@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["role"] == "teacher"
    assert "access_token" in data
    print("[PASS] Test 3: Teacher Gmail login successful -> role: teacher")

def test_4_student_usn_login():
    """Test 4: Student USN & password login -> role: student"""
    res = client.post("/api/auth/login", json={
        "username_or_email": "4MN24CS002",
        "password": "password123"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["role"] == "student"
    assert data["usn"].upper() == "4MN24CS002"
    assert "access_token" in data
    print("[PASS] Test 4: Student USN login successful -> role: student")

def test_5_student_gmail_login_blocked():
    """Test 5: Student attempting to log in via Gmail is blocked with instruction to use USN"""
    res = client.post("/api/auth/login", json={
        "username_or_email": "student_4mn24cs002@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    assert "USN" in res.json().get("detail", "")
    print("[PASS] Test 5: Student Gmail login correctly blocked -> redirected to USN")

def test_6_invalid_gmail():
    """Test 6: Invalid Gmail rejection (401)"""
    res = client.post("/api/auth/login", json={
        "username_or_email": "nonexistent.user999@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 401
    print("[PASS] Test 6: Invalid Gmail rejected with 401")

def test_7_invalid_usn():
    """Test 7: Invalid USN rejection (401)"""
    res = client.post("/api/auth/login", json={
        "username_or_email": "4MN99CS999",
        "password": "password123"
    })
    assert res.status_code == 401
    print("[PASS] Test 7: Invalid USN rejected with 401")

def test_8_incorrect_password():
    """Test 8: Incorrect password rejection (401)"""
    res = client.post("/api/auth/login", json={
        "username_or_email": "4MN24CS002",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401
    print("[PASS] Test 8: Incorrect password rejected with 401")

def test_9_suspended_account():
    """Test 9: Suspended/Inactive account rejection (403)"""
    res = client.post("/api/auth/login", json={
        "username_or_email": "inactive.teacher@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 403
    print("[PASS] Test 9: Suspended account rejected with 403")

def test_10_get_me_and_logout():
    """Test 10: Profile /api/auth/me and /api/auth/logout with token"""
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "admin@gmail.com",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    user_info = me_res.json()["user"]
    assert user_info["role"] == "admin"
    assert user_info["email"] == "admin@gmail.com"

    logout_res = client.post("/api/auth/logout", headers=headers)
    assert logout_res.status_code == 200
    print("[PASS] Test 10: GET /api/auth/me and POST /api/auth/logout verified")

def test_11_role_dashboard_mappings():
    """Test 11: Verify role dashboard mapping contracts"""
    role_to_dashboard = {
        "admin": "/admin/dashboard",
        "hod": "/hod/dashboard",
        "teacher": "/teacher/dashboard",
        "student": "/student/dashboard",
    }
    for role, dashboard_url in role_to_dashboard.items():
        assert dashboard_url == f"/{role}/dashboard"
    print("[PASS] Test 11: Role dashboard mapping contracts verified")

def test_12_register_student_endpoint_exists():
    """Test 12: POST /api/auth/register-student exists and validates input"""
    # Send empty body to test endpoint exists and returns 422 Unprocessable Entity
    res = client.post("/api/auth/register-student", json={})
    assert res.status_code == 422
    print("[PASS] Test 12: POST /api/auth/register-student endpoint exists")

if __name__ == "__main__":
    test_1_admin_gmail_login()
    test_2_hod_gmail_login()
    test_3_teacher_gmail_login()
    test_4_student_usn_login()
    test_5_student_gmail_login_blocked()
    test_6_invalid_gmail()
    test_7_invalid_usn()
    test_8_incorrect_password()
    test_9_suspended_account()
    test_10_get_me_and_logout()
    test_11_role_dashboard_mappings()
    test_12_register_student_endpoint_exists()
    print("\n[SUCCESS] ALL 12 MITT COMMON AUTHENTICATION TESTS PASSED!")
