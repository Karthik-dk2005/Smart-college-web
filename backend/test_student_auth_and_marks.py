import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_student_and_marks_integration():
    print("=" * 60)
    print("TESTING STUDENT AUTH & IA MARKS PRIVACY INTEGRATION")
    print("=" * 60)

    # 1. Student Login using USN
    student_usn = "4MN23CS116"
    login_res = client.post("/api/auth/login", json={
        "username_or_email": student_usn,
        "password": "Student@123"
    })
    assert login_res.status_code == 200, f"Student login failed: {login_res.text}"
    student_token = login_res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print(f"✓ Student '{student_usn}' logged in successfully using USN")

    # 2. Student views own profile
    res_own = client.get(f"/api/students/{student_usn}", headers=student_headers)
    assert res_own.status_code == 200, f"Failed to view own profile: {res_own.text}"
    assert res_own.json()["data"]["usn"] == student_usn
    print(f"✓ Student successfully viewed own profile ({student_usn})")

    # 3. Student attempts to view another student's profile -> MUST BE 403 FORBIDDEN
    other_usn = "4MN24CS002"
    res_other = client.get(f"/api/students/{other_usn}", headers=student_headers)
    assert res_other.status_code == 403, f"Expected 403 Forbidden, got {res_other.status_code}"
    print("✓ Student blocked from viewing another student's profile (403 Forbidden)")

    # 4. Student views their own IA marks
    res_marks = client.get("/api/marks/my", headers=student_headers)
    assert res_marks.status_code == 200, f"Failed to get marks: {res_marks.text}"
    marks_data = res_marks.json()
    assert marks_data["usn"] == student_usn
    assert len(marks_data["subjects"]) == 6, f"Expected 6 subjects, got {len(marks_data['subjects'])}"
    print(f"✓ Student retrieved own 6 subject IA marks for {student_usn}")

    # 5. Student attempts to override ?usn= to spy on other student -> MUST STILL RETURN OWN MARKS
    res_spy = client.get(f"/api/marks/my?usn={other_usn}", headers=student_headers)
    assert res_spy.status_code == 200
    assert res_spy.json()["usn"] == student_usn, "Security breach: Student was able to access other student's marks!"
    print("✓ Privacy enforced: Student cannot access other student's marks via ?usn parameter")

    # 6. Admin Login
    admin_login = client.post("/api/auth/login", json={
        "username_or_email": "admin@campus.edu",
        "password": "password123"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin can view any student marks
    admin_marks = client.get(f"/api/marks/my?usn={other_usn}", headers=admin_headers)
    assert admin_marks.status_code == 200
    assert admin_marks.json()["usn"] == other_usn
    print(f"✓ Admin authorized to view marks for any student ({other_usn})")

    print("\n" + "=" * 60)
    print("ALL STUDENT AUTH & IA MARKS INTEGRATION TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    test_student_and_marks_integration()

