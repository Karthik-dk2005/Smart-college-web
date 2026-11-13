import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_apis():
    print("=" * 60)
    print("TESTING ALL STUDENT MANAGEMENT APIS")
    print("=" * 60)

    # 1. Admin Login to get token
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "admin@campus.edu",
        "password": "password123"
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Admin logged in successfully")

    # 2. GET /api/students (Total 131)
    res = client.get("/api/students", headers=headers)
    assert res.status_code == 200, f"GET /api/students failed: {res.text}"
    data = res.json()["data"]
    assert len(data) == 131, f"Expected 131 students, got {len(data)}"
    print(f"✓ GET /api/students returned {len(data)} students")

    # 3. GET /api/students?section=A (66 students)
    res_a = client.get("/api/students?section=A", headers=headers)
    assert res_a.status_code == 200
    data_a = res_a.json()["data"]
    assert len(data_a) == 66, f"Expected 66 students for Section A, got {len(data_a)}"
    print(f"✓ GET /api/students?section=A returned {len(data_a)} students")

    # 4. GET /api/students?section=B (65 students)
    res_b = client.get("/api/students?section=B", headers=headers)
    assert res_b.status_code == 200
    data_b = res_b.json()["data"]
    assert len(data_b) == 65, f"Expected 65 students for Section B, got {len(data_b)}"
    print(f"✓ GET /api/students?section=B returned {len(data_b)} students")

    # 5. GET /api/students/search?query=VARUN
    res_search = client.get("/api/students/search?query=VARUN", headers=headers)
    assert res_search.status_code == 200
    search_data = res_search.json()["data"]
    assert any("VARUN" in s["name"].upper() for s in search_data)
    print(f"✓ GET /api/students/search?query=VARUN returned {len(search_data)} result(s)")

    # 6. GET /api/students/{usn} by USN string
    res_usn = client.get("/api/students/4MN23CS116", headers=headers)
    assert res_usn.status_code == 200
    st_data = res_usn.json()["data"]
    assert st_data["usn"] == "4MN23CS116"
    assert "VARUN" in st_data["name"]
    print("✓ GET /api/students/4MN23CS116 returned student profile")

    # 7. POST /api/students (Create new student)
    test_usn = "4MN24CS999"
    new_student = {
        "name": "TEST STUDENT API",
        "usn": test_usn,
        "email": "test.api.student@college.edu",
        "semester": 5,
        "section": "A",
        "phone": "9998887776",
        "department_id": 1,
    }
    create_res = client.post("/api/students", headers=headers, json=new_student)
    assert create_res.status_code == 201, f"Create student failed: {create_res.text}"
    print(f"✓ POST /api/students created student {test_usn}")

    # Duplicate USN check
    dup_res = client.post("/api/students", headers=headers, json=new_student)
    assert dup_res.status_code == 409, f"Expected 409 Conflict, got {dup_res.status_code}"
    print("✓ Duplicate USN validation correctly rejected with 409 Conflict")

    # 8. PUT /api/students/{usn}
    update_res = client.put(f"/api/students/{test_usn}", headers=headers, json={
        "name": "TEST STUDENT API UPDATED",
        "section": "B",
    })
    assert update_res.status_code == 200, f"Update failed: {update_res.text}"
    updated_st = update_res.json()["data"]
    assert updated_st["name"] == "TEST STUDENT API UPDATED"
    assert updated_st["section"] == "B"
    print(f"✓ PUT /api/students/{test_usn} updated student details")

    # 9. DELETE /api/students/{usn}
    del_res = client.delete(f"/api/students/{test_usn}", headers=headers)
    assert del_res.status_code == 200, f"Delete failed: {del_res.text}"
    print(f"✓ DELETE /api/students/{test_usn} deleted student")

    # Verify deleted
    verify_del = client.get(f"/api/students/{test_usn}", headers=headers)
    assert verify_del.status_code == 404
    print("✓ Verified deleted student returns 404")

    # 10. POST /api/students/bulk-import
    bulk_payload = {
        "students": [
            {
                "usn": "4MN24CS998",
                "name": "BULK STUDENT 1",
                "semester": 5,
                "section": "A",
                "department_id": 1
            },
            {
                "usn": "4MN24CS997",
                "name": "BULK STUDENT 2",
                "semester": 5,
                "section": "B",
                "department_id": 1
            }
        ]
    }
    bulk_res = client.post("/api/students/bulk-import", headers=headers, json=bulk_payload)
    assert bulk_res.status_code == 200, f"Bulk import failed: {bulk_res.text}"
    print("✓ POST /api/students/bulk-import successfully processed records")

    # Clean up bulk test students
    client.delete("/api/students/4MN24CS998", headers=headers)
    client.delete("/api/students/4MN24CS997", headers=headers)
    print("✓ Bulk test students cleaned up")

    print("\n" + "=" * 60)
    print("ALL STUDENT APIS VERIFIED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_apis()

