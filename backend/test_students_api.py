import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.student import Student
from app.models.user import User

client = TestClient(app)

def test_students_endpoints():
    print("=== TESTING STUDENTS API WITH NEW 135 5TH SEMESTER STUDENTS ===")
    
    # 1. Admin login to get token
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "admin@campus.edu",
        "password": "password123"
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. GET /api/students (All)
    all_res = client.get("/api/students", headers=headers)
    assert all_res.status_code == 200, f"GET /api/students failed: {all_res.text}"
    all_data = all_res.json().get("data", [])
    print(f"Total students returned from GET /api/students: {len(all_data)}")
    assert len(all_data) == 135, f"Expected 135 students, got {len(all_data)}"

    # 3. GET /api/students?section=A
    sec_a_res = client.get("/api/students?section=A", headers=headers)
    assert sec_a_res.status_code == 200
    sec_a_data = sec_a_res.json().get("data", [])
    print(f"Section A students count: {len(sec_a_data)}")
    assert len(sec_a_data) == 67, f"Expected 67 students in Section A, got {len(sec_a_data)}"

    # 4. GET /api/students?section=B
    sec_b_res = client.get("/api/students?section=B", headers=headers)
    assert sec_b_res.status_code == 200
    sec_b_data = sec_b_res.json().get("data", [])
    print(f"Section B students count: {len(sec_b_data)}")
    assert len(sec_b_data) == 68, f"Expected 68 students in Section B, got {len(sec_b_data)}"

    # 5. Search by USN
    search_res = client.get("/api/students/search?query=4MN24CS002", headers=headers)
    assert search_res.status_code == 200
    search_data = search_res.json().get("data", [])
    assert len(search_data) >= 1
    st = search_data[0]
    print(f"Search for 4MN24CS002 found: {st['name']}, Section: {st['section']}, Gmail: {st['gmail']}, Father Phone: {st['father_phone']}")
    assert st['usn'] == "4MN24CS002"
    assert st['name'] == "ABHILASH KUMAR K"
    assert st['section'] == "A"
    assert st['gmail'] == "abhilashkumar27k@gmail.com"
    assert st['father_phone'] == "9964000264"
    assert st['mother_phone'] == "9036540972"

    # 6. Check Diploma USN
    dip_res = client.get("/api/students/search?query=4MN25CS410", headers=headers)
    assert dip_res.status_code == 200
    dip_data = dip_res.json().get("data", [])
    assert len(dip_data) >= 1
    dip_st = dip_data[0]
    print(f"Diploma search for 4MN25CS410 found: {dip_st['name']}, Section: {dip_st['section']}, Gmail: {dip_st['gmail']}")
    assert dip_st['usn'] == "4MN25CS410"
    assert "KARTHIKA" in dip_st['name']
    assert dip_st['section'] == "B"

    # 7. Check Student Registration Check-USN endpoint (public)
    check_usn_res = client.post("/api/auth/student/check-usn", json={"usn": "4MN24CS002"})
    assert check_usn_res.status_code == 200
    check_data = check_usn_res.json()
    print("Check-USN response:", check_data)
    assert check_data["name"] == "ABHILASH KUMAR K"
    assert check_data["is_registered"] is False

    print("\n=== ALL STUDENT TESTS PASSED 100%! ===")

if __name__ == "__main__":
    test_students_endpoints()
