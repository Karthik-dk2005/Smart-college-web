import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# -------------------------------------------------------------
# Fixtures for Authentication Tokens
# -------------------------------------------------------------
@pytest.fixture(scope="session")
def admin_headers():
    res = client.post("/api/auth/login", json={"email": "admin@campus.edu", "password": "password123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def hod_headers():
    res = client.post("/api/auth/login", json={"email": "hod.cse@campus.edu", "password": "password123"})
    assert res.status_code == 200, f"HOD login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def faculty_headers():
    res = client.post("/api/auth/login", json={"email": "ananya.iyer@faculty.campus.edu", "password": "password123"})
    assert res.status_code == 200, f"Faculty login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def student_headers():
    res = client.post("/api/auth/login", json={"email": "amulya.h.s@mitt.ac.in", "password": "password123"})
    assert res.status_code == 200, f"Student login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# -------------------------------------------------------------
# 1. Health Check Test
# -------------------------------------------------------------
def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "Smart Department Backend"


# -------------------------------------------------------------
# 2. Authentication & Authorization Tests
# -------------------------------------------------------------
def test_auth_registration_and_login():
    test_email = "new_test_student_2026@campus.edu"
    reg_payload = {
        "email": test_email,
        "password": "strongPassword123!",
        "name": "Test Student User",
        "role": "student",
        "phone": "+91 99999 88888"
    }
    # Register
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code in (201, 409)

    # Login
    res_login = client.post("/api/auth/login", json={"email": test_email, "password": "strongPassword123!"})
    assert res_login.status_code == 200
    body = res_login.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["role"] == "student"

    # Refresh token
    res_refresh = client.post("/api/auth/refresh", json={"refresh_token": body["refresh_token"]})
    assert res_refresh.status_code == 200
    assert "access_token" in res_refresh.json()["data"]

    # Get /me
    auth_h = {"Authorization": f"Bearer {body['access_token']}"}
    res_me = client.get("/api/auth/me", headers=auth_h)
    assert res_me.status_code == 200
    assert res_me.json()["data"]["email"] == test_email

    # Logout
    res_logout = client.post("/api/auth/logout", headers=auth_h)
    assert res_logout.status_code == 200


def test_authorization_role_enforcement(student_headers):
    # Student attempting to create a department should be forbidden (403)
    dept_payload = {
        "name": "Unauthorized Mechanical",
        "code": "MECH-TEST",
        "description": "Test"
    }
    res = client.post("/api/departments", json=dept_payload, headers=student_headers)
    assert res.status_code == 403


# -------------------------------------------------------------
# 3. Student CRUD Tests
# -------------------------------------------------------------
def test_student_crud(admin_headers, student_headers):
    # CREATE
    new_student = {
        "usn": "4MT22CS999",
        "name": "CRUD Test Student",
        "email": "crud_test_student@campus.edu",
        "phone": "+91 98888 77777",
        "semester": 5,
        "section": "A",
        "department_id": 1,
        "password": "password123"
    }
    res_create = client.post("/api/students", json=new_student, headers=admin_headers)
    assert res_create.status_code in (201, 409)
    if res_create.status_code == 201:
        st_data = res_create.json()["data"]
        st_id = st_data["id"]

        # READ (List)
        res_list = client.get("/api/students?semester=5&section=A", headers=admin_headers)
        assert res_list.status_code == 200
        assert any(s["usn"] == "4MT22CS999" for s in res_list.json()["data"])

        # READ (Single)
        res_get = client.get(f"/api/students/{st_id}", headers=admin_headers)
        assert res_get.status_code == 200
        assert res_get.json()["data"]["usn"] == "4MT22CS999"

        # UPDATE
        res_put = client.put(f"/api/students/{st_id}", json={"name": "CRUD Test Student Updated"}, headers=admin_headers)
        assert res_put.status_code == 200
        assert res_put.json()["data"]["name"] == "CRUD Test Student Updated"

        # DELETE
        res_del = client.delete(f"/api/students/{st_id}", headers=admin_headers)
        assert res_del.status_code == 200


# -------------------------------------------------------------
# 4. Faculty CRUD Tests
# -------------------------------------------------------------
def test_faculty_crud(admin_headers):
    # CREATE
    new_fac = {
        "employee_id": "FAC-TEST-99",
        "name": "Dr. Test Professor",
        "email": "dr.test.prof@campus.edu",
        "phone": "+91 91111 22222",
        "department_id": 1,
        "designation": "Associate Professor",
        "password": "password123"
    }
    res_create = client.post("/api/faculty", json=new_fac, headers=admin_headers)
    assert res_create.status_code in (201, 409)
    if res_create.status_code == 201:
        fac_id = res_create.json()["data"]["id"]

        # READ List
        res_list = client.get("/api/faculty", headers=admin_headers)
        assert res_list.status_code == 200
        assert len(res_list.json()["data"]) > 0

        # READ Single
        res_get = client.get(f"/api/faculty/{fac_id}", headers=admin_headers)
        assert res_get.status_code == 200

        # UPDATE
        res_put = client.put(f"/api/faculty/{fac_id}", json={"designation": "Senior Professor"}, headers=admin_headers)
        assert res_put.status_code == 200
        assert res_put.json()["data"]["designation"] == "Senior Professor"

        # DELETE
        res_del = client.delete(f"/api/faculty/{fac_id}", headers=admin_headers)
        assert res_del.status_code == 200


# -------------------------------------------------------------
# 5. Department & Subject CRUD Tests
# -------------------------------------------------------------
def test_department_crud(admin_headers, student_headers):
    # READ departments
    res = client.get("/api/departments", headers=student_headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) >= 1

    dept_id = res.json()["data"][0]["id"]
    res_single = client.get(f"/api/departments/{dept_id}", headers=student_headers)
    assert res_single.status_code == 200


def test_subject_crud(admin_headers):
    # CREATE
    sub_payload = {
        "subject_code": "21TEST88",
        "subject_name": "Test Subject Engineering",
        "credits": 3,
        "semester": 5,
        "department_id": 1
    }
    res_create = client.post("/api/subjects", json=sub_payload, headers=admin_headers)
    assert res_create.status_code in (201, 409)
    if res_create.status_code == 201:
        sub_id = res_create.json()["data"]["id"]

        # READ
        res_get = client.get(f"/api/subjects/{sub_id}", headers=admin_headers)
        assert res_get.status_code == 200

        # UPDATE
        res_put = client.put(f"/api/subjects/{sub_id}", json={"credits": 4}, headers=admin_headers)
        assert res_put.status_code == 200
        assert res_put.json()["data"]["credits"] == 4

        # DELETE
        res_del = client.delete(f"/api/subjects/{sub_id}", headers=admin_headers)
        assert res_del.status_code == 200


# -------------------------------------------------------------
# 6. Attendance CRUD & Percentage Tests
# -------------------------------------------------------------
def test_attendance_crud_and_percentage(faculty_headers, student_headers):
    # CREATE
    att_payload = {
        "student_id": 1,
        "subject_id": 1,
        "date": "2026-09-25",
        "status": "present",
        "latitude": 12.183705,
        "longitude": 76.694210,
        "remarks": "On campus test"
    }
    res_create = client.post("/api/attendance", json=att_payload, headers=faculty_headers)
    assert res_create.status_code == 201
    att_id = res_create.json()["data"]["id"]

    # READ list
    res_list = client.get("/api/attendance?student_id=1", headers=faculty_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()["data"]) > 0

    # READ by student
    res_st = client.get("/api/attendance/student/1", headers=faculty_headers)
    assert res_st.status_code == 200

    # READ by subject
    res_sub = client.get("/api/attendance/subject/1", headers=faculty_headers)
    assert res_sub.status_code == 200

    # READ by date
    res_date = client.get("/api/attendance/date/2026-09-25", headers=faculty_headers)
    assert res_date.status_code == 200

    # CALCULATE PERCENTAGE
    res_pct = client.get("/api/attendance/percentage/1", headers=student_headers)
    assert res_pct.status_code == 200
    pct_data = res_pct.json()["data"]
    assert "percentage" in pct_data
    assert "total_classes" in pct_data
    assert "present_classes" in pct_data
    assert isinstance(pct_data["percentage"], (int, float))

    # UPDATE
    res_put = client.put(f"/api/attendance/{att_id}", json={"status": "late"}, headers=faculty_headers)
    assert res_put.status_code == 200
    assert res_put.json()["data"]["status"] == "late"

    # DELETE
    res_del = client.delete(f"/api/attendance/{att_id}", headers=faculty_headers)
    assert res_del.status_code == 200


# -------------------------------------------------------------
# 7. Timetable CRUD & Filters Tests
# -------------------------------------------------------------
def test_timetable_crud_and_filters(admin_headers, student_headers):
    # READ Timetable with Filters
    res = client.get("/api/timetable?semester=5&section=A&day=Monday", headers=student_headers)
    assert res.status_code == 200
    slots = res.json()["data"]
    assert len(slots) > 0
    assert all(s["room_number"] == "CS-303" for s in slots)

    # Test Section B Room CS-304
    res_b = client.get("/api/timetable?semester=5&section=B&day=Monday", headers=student_headers)
    assert res_b.status_code == 200
    slots_b = res_b.json()["data"]
    assert len(slots_b) > 0
    assert all(s["room_number"] == "CS-304" for s in slots_b)

    # CREATE Slot
    new_slot = {
        "department_id": 1,
        "semester": 5,
        "section": "A",
        "day": "Saturday",
        "start_time": "14:00",
        "end_time": "15:00",
        "subject_id": 1,
        "faculty_id": 1,
        "room_number": "CS-303"
    }
    res_create = client.post("/api/timetable", json=new_slot, headers=admin_headers)
    assert res_create.status_code == 201
    slot_id = res_create.json()["data"]["id"]

    # READ Single
    res_single = client.get(f"/api/timetable/{slot_id}", headers=student_headers)
    assert res_single.status_code == 200

    # UPDATE
    res_put = client.put(f"/api/timetable/{slot_id}", json={"room_number": "CS-303-UPDATED"}, headers=admin_headers)
    assert res_put.status_code == 200
    assert res_put.json()["data"]["room_number"] == "CS-303-UPDATED"

    # DELETE
    res_del = client.delete(f"/api/timetable/{slot_id}", headers=admin_headers)
    assert res_del.status_code == 200


# -------------------------------------------------------------
# 8. Location & Geofence Tests
# -------------------------------------------------------------
def test_location_api(student_headers):
    # Inside campus coordinates (around 12.183700, 76.694200)
    inside_payload = {
        "latitude": 12.183705,
        "longitude": 76.694210,
        "accuracy": 4.5,
        "location_type": "device"
    }
    res = client.post("/api/location/update", json=inside_payload, headers=student_headers)
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["in_geofence"] is True
    assert data["distance_meters"] <= 300.0

    # Read current location
    res_curr = client.get("/api/location/current/8", headers=student_headers)
    assert res_curr.status_code in (200, 404)

    # Read history
    res_hist = client.get("/api/location/history/8", headers=student_headers)
    assert res_hist.status_code == 200


# -------------------------------------------------------------
# 9. Notice CRUD Tests
# -------------------------------------------------------------
def test_notice_crud(hod_headers, student_headers):
    # CREATE
    notice_payload = {
        "title": "Pytest Test Announcement",
        "description": "This is an automated test notice.",
        "target_role": "all"
    }
    res_create = client.post("/api/notices", json=notice_payload, headers=hod_headers)
    assert res_create.status_code == 201
    notice_id = res_create.json()["data"]["id"]

    # READ List
    res_list = client.get("/api/notices", headers=student_headers)
    assert res_list.status_code == 200
    assert any(n["id"] == notice_id for n in res_list.json()["data"])

    # READ Single
    res_single = client.get(f"/api/notices/{notice_id}", headers=student_headers)
    assert res_single.status_code == 200

    # UPDATE
    res_put = client.put(f"/api/notices/{notice_id}", json={"title": "Updated Test Announcement"}, headers=hod_headers)
    assert res_put.status_code == 200
    assert res_put.json()["data"]["title"] == "Updated Test Announcement"

    # DELETE
    res_del = client.delete(f"/api/notices/{notice_id}", headers=hod_headers)
    assert res_del.status_code == 200
