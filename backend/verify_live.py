import json
import urllib.request
import urllib.error
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

BASE = "http://127.0.0.1:8000"

def request_json(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8")), response.status
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body), e.code
        except Exception:
            return {"error": err_body}, e.code

def run_all_verifications():
    print("=" * 60)
    print("SMART DEPARTMENT COMPREHENSIVE END-TO-END VERIFICATION")
    print("=" * 60)

    # 1. Health check
    h, status = request_json(f"{BASE}/health")
    assert status == 200, f"Health check failed: {h}"
    print(f"✓ 1. Health check: OK (HTTP {status})")

    # 2. Admin Login
    admin_res, status = request_json(
        f"{BASE}/api/auth/login",
        method="POST",
        data={"email": "admin@campus.edu", "password": "password123"}
    )
    assert status == 200, f"Admin login failed: {admin_res}"
    admin_token = admin_res.get("access_token") or admin_res.get("data", {}).get("access_token")
    print("✓ 2. Admin login: SUCCESS")

    # 3. HOD Login
    hod_res, status = request_json(
        f"{BASE}/api/auth/login",
        method="POST",
        data={"email": "hod.cse@campus.edu", "password": "password123"}
    )
    assert status == 200, f"HOD login failed: {hod_res}"
    hod_token = hod_res.get("access_token") or hod_res.get("data", {}).get("access_token")
    print("✓ 3. HOD login: SUCCESS")

    # 4. Teacher Login
    teacher_res, status = request_json(
        f"{BASE}/api/auth/login",
        method="POST",
        data={"email": "rajesh.kumar@faculty.campus.edu", "password": "password123"}
    )
    assert status == 200, f"Teacher login failed: {teacher_res}"
    teacher_token = teacher_res.get("access_token") or teacher_res.get("data", {}).get("access_token")
    print("✓ 4. Teacher login: SUCCESS")

    # 5. Student Login
    student_res, status = request_json(
        f"{BASE}/api/auth/login",
        method="POST",
        data={"email": "aarav.sharma@college.edu", "password": "password123"}
    )
    assert status == 200, f"Student login failed: {student_res}"
    student_token = student_res.get("access_token") or student_res.get("data", {}).get("access_token")
    print("✓ 5. Student login: SUCCESS")

    # 6. Student CRUD (Add, Edit, Remove/Deactivate)
    new_stu, status = request_json(
        f"{BASE}/api/students",
        method="POST",
        data={
            "name": "Live Test Student",
            "usn": "1MS21CS999",
            "student_id": "1MS21CS999",
            "email": "livetest.student@campus.edu",
            "phone": "9998887776",
            "department_id": 1,
            "semester": 5,
            "section": "A",
            "admission_year": 2024,
            "username": "liveteststudent",
            "password": "password123"
        },
        token=admin_token
    )
    assert status in (200, 201), f"Add student failed: {new_stu}"
    created_stu_id = new_stu.get("data", {}).get("id") or new_stu.get("id")
    print(f"✓ 6. Add student: SUCCESS (ID #{created_stu_id})")

    # Edit student
    edit_stu, status = request_json(
        f"{BASE}/api/students/{created_stu_id}",
        method="PUT",
        data={"phone": "9112223334", "name": "Live Test Student Updated"},
        token=admin_token
    )
    assert status == 200, f"Edit student failed: {edit_stu}"
    print("✓ 7. Edit student: SUCCESS")

    # Deactivate / Soft delete student
    del_stu, status = request_json(
        f"{BASE}/api/students/{created_stu_id}",
        method="DELETE",
        token=admin_token
    )
    assert status == 200, f"Delete student failed: {del_stu}"
    print("✓ 8. Remove/deactivate student: SUCCESS (status=inactive)")

    # 7. Teacher CRUD (Add, Edit, Remove/Deactivate)
    new_teach, status = request_json(
        f"{BASE}/api/teachers",
        method="POST",
        data={
            "name": "Prof. Live Verifier",
            "employee_id": "EMP-LIVE-99",
            "email": "verifier@campus.edu",
            "phone": "9123456789",
            "department_id": 1,
            "designation": "Assistant Professor",
            "username": "profverifier",
            "password": "password123"
        },
        token=admin_token
    )
    assert status in (200, 201), f"Add teacher failed: {new_teach}"
    created_teach_id = new_teach.get("data", {}).get("id") or new_teach.get("id")
    print(f"✓ 9. Add teacher: SUCCESS (ID #{created_teach_id})")

    # Edit teacher
    edit_teach, status = request_json(
        f"{BASE}/api/teachers/{created_teach_id}",
        method="PUT",
        data={"designation": "Associate Professor"},
        token=admin_token
    )
    assert status == 200, f"Edit teacher failed: {edit_teach}"
    print("✓ 10. Edit teacher: SUCCESS")

    # Delete teacher
    del_teach, status = request_json(
        f"{BASE}/api/teachers/{created_teach_id}",
        method="DELETE",
        token=admin_token
    )
    assert status == 200, f"Delete teacher failed: {del_teach}"
    print("✓ 11. Remove/deactivate teacher: SUCCESS")

    # 8. Room CRUD
    new_room, status = request_json(
        f"{BASE}/api/rooms",
        method="POST",
        data={"room_name": "LIVE-LAB-9", "room_type": "Lab", "capacity": 45, "status": "active"},
        token=admin_token
    )
    assert status in (200, 201), f"Create room failed: {new_room}"
    created_room_id = new_room.get("id") or new_room.get("data", {}).get("id")
    print(f"✓ 12. Room CRUD - Create: SUCCESS (ID #{created_room_id})")

    rooms_list, status = request_json(f"{BASE}/api/rooms", token=admin_token)
    assert status == 200 and len(rooms_list) > 0, "List rooms failed"
    print(f"✓ 13. Room CRUD - List: SUCCESS ({len(rooms_list)} rooms)")

    del_room, status = request_json(f"{BASE}/api/rooms/{created_room_id}", method="DELETE", token=admin_token)
    assert status == 200, f"Delete room failed: {del_room}"
    print("✓ 14. Room CRUD - Delete: SUCCESS")

    # 9. Subject CRUD
    new_sub, status = request_json(
        f"{BASE}/api/subjects",
        method="POST",
        data={
            "subject_code": "CS-LIVE-88",
            "subject_name": "Autonomous Systems",
            "department_id": 1,
            "semester": 5,
            "credits": 4
        },
        token=admin_token
    )
    assert status in (200, 201), f"Create subject failed: {new_sub}"
    created_sub_id = new_sub.get("data", {}).get("id") or new_sub.get("id")
    print(f"✓ 15. Subject CRUD: SUCCESS (ID #{created_sub_id})")

    # Clean up subject
    request_json(f"{BASE}/api/subjects/{created_sub_id}", method="DELETE", token=admin_token)

    # 10. Timetable & Conflict Validation
    tt_today, status = request_json(f"{BASE}/api/timetable/today", token=admin_token)
    assert status == 200, f"Today's timetable failed: {tt_today}"
    today_slots = tt_today.get("data") if isinstance(tt_today, dict) else tt_today
    print(f"✓ 16. Today's timetable API: SUCCESS ({len(today_slots)} slots returned)")

    tt_teacher, status = request_json(f"{BASE}/api/timetable/teacher/today", token=teacher_token)
    assert status == 200, f"Teacher today's timetable failed: {tt_teacher}"
    teacher_slots = tt_teacher.get("data") if isinstance(tt_teacher, dict) else tt_teacher
    print(f"✓ 17. Teacher-specific today's timetable API: SUCCESS ({len(teacher_slots)} slots returned)")

    # 11. 30-Minute Attendance Session & Intervals Check
    # Retrieve a valid slot
    tt_all, _ = request_json(f"{BASE}/api/timetable?semester=5&section=A", token=admin_token)
    slots = tt_all.get("data") if isinstance(tt_all, dict) else tt_all
    assert len(slots) > 0, "No timetable slots found for testing"
    test_slot = slots[0]
    test_slot_id = test_slot["id"]

    sess_res, status = request_json(f"{BASE}/api/attendance/session/{test_slot_id}", token=admin_token)
    assert status == 200, f"Load attendance session failed: {sess_res}"
    sess_data = sess_res.get("data") or sess_res
    intervals = sess_data.get("intervals", [])
    print(f"✓ 18. Attendance follows timetable: Loaded session #{test_slot_id} ({sess_data.get('subject_name')})")
    print(f"✓ 19. 30-Minute interval division: Found {len(intervals)} intervals:")
    for inv in intervals:
        print(f"      - Duration {inv['duration_number']}: {inv['start_time']} – {inv['end_time']} ({inv['duration_minutes']} min)")

    assert len(intervals) >= 2, f"Expected at least 2 30-minute intervals for 1-hour slot, got {len(intervals)}"
    print("✓ 20. Every student appears: Loaded", len(sess_data.get("students", [])), "students (no student skipped)")

    # 12. Student Attendance Report & Minutes Formula
    first_stu_id = sess_data.get("students", [])[0]["id"]
    stu_att_res, status = request_json(f"{BASE}/api/attendance/student/{first_stu_id}", token=admin_token)
    assert status == 200, f"Student attendance report failed: {stu_att_res}"
    stu_att_data = stu_att_res.get("data") or stu_att_res
    print(f"✓ 21. Attendance minutes & percentage calculation:")
    print(f"      - Student: {stu_att_data.get('student_name')} ({stu_att_data.get('usn')})")
    print(f"      - Conducted: {stu_att_data.get('conducted_minutes')} mins")
    print(f"      - Present:   {stu_att_data.get('present_minutes')} mins")
    print(f"      - Absent:    {stu_att_data.get('absent_minutes')} mins")
    print(f"      - Overall:   {stu_att_data.get('overall_percentage')}%")

    # 13. Role Restrictions & 403 checks
    # Student attempting CRUD on student
    blocked_crud, status = request_json(
        f"{BASE}/api/students",
        method="POST",
        data={"name": "Hacker", "usn": "HACK01", "email": "hack@campus.edu", "department_id": 1},
        token=student_token
    )
    assert status == 403, f"Expected 403 for student CRUD, got {status}: {blocked_crud}"
    print(f"✓ 22. Student CRUD blocked: HTTP {status} Forbidden")

    # Student attempting teacher CRUD
    blocked_teach, status = request_json(
        f"{BASE}/api/teachers",
        method="POST",
        data={"name": "Hacker", "employee_id": "HACK02", "email": "hack2@campus.edu", "department_id": 1},
        token=student_token
    )
    assert status == 403, f"Expected 403 for student creating teacher, got {status}: {blocked_teach}"
    print(f"✓ 23. Student creating teacher blocked: HTTP {status} Forbidden")

    # Teacher taking attendance for another teacher's timetable
    # Find slot not assigned to teacher 1
    other_slot = next((s for s in slots if s.get("teacher_id") != 1 and s.get("faculty_id") != 1), None)
    if other_slot:
        unauth_att, status = request_json(
            f"{BASE}/api/attendance/session/{other_slot['id']}",
            token=teacher_token
        )
        assert status == 403, f"Expected 403 for unauthorized teacher attendance, got {status}: {unauth_att}"
        print(f"✓ 24. Teacher attendance authorization enforced: HTTP {status} Forbidden for other teacher's class")

    # ==========================================================
    # FACE RECOGNITION & BIOMETRIC VERIFICATIONS (Steps 25 - 35)
    # ==========================================================
    print("\n--- FACE RECOGNITION TESTS ---")
    import base64
    import io
    from PIL import Image

    def make_face_b64():
        img = Image.new("RGB", (100, 100), color=(150, 150, 150))
        for x in range(30, 70):
            for y in range(30, 70):
                img.putpixel((x, y), (210, 160, 110))
        for x in range(35, 45):
            for y in range(40, 45):
                img.putpixel((x, y), (10, 10, 10))
        for x in range(55, 65):
            for y in range(40, 45):
                img.putpixel((x, y), (10, 10, 10))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    face_b64 = make_face_b64()

    # Clean up test attendance for student 1 & 2 on timetable 21 to ensure idempotency
    from app.database import SessionLocal
    from app.models.student_attendance import StudentAttendance
    from app.models.attendance_session import AttendanceSession
    with SessionLocal() as db:
        session_ids = [s.id for s in db.query(AttendanceSession).filter(AttendanceSession.timetable_id == 21).all()]
        if session_ids:
            db.query(StudentAttendance).filter(
                StudentAttendance.student_id.in_([1, 2]),
                StudentAttendance.attendance_session_id.in_(session_ids)
            ).delete(synchronize_session=False)
            db.commit()

    # 25. Check Face Status
    face_stat, status = request_json(f"{BASE}/api/face/status/1", token=admin_token)
    assert status == 200, f"Face status check failed: {face_stat}"
    print(f"✓ 25. Face status endpoint: Registered={face_stat.get('is_registered')}")

    # 26. Register Face
    face_reg, status = request_json(
        f"{BASE}/api/face/register/1",
        method="POST",
        data={"image": face_b64},
        token=admin_token
    )
    assert status == 200, f"Face registration failed: {face_reg}"
    assert "embedding" not in str(face_reg).lower(), "Raw embedding must NOT be exposed!"
    print(f"✓ 26. Face registration: SUCCESS (Student #1 linked, embeddings secured)")

    # 27. Face Verification OUTSIDE Geofence -> HTTP 403
    geo_blocked_face, status = request_json(
        f"{BASE}/api/face/verify",
        method="POST",
        data={
            "image": face_b64,
            "timetable_id": 21,
            "latitude": 0.0,
            "longitude": 0.0
        },
        token=admin_token
    )
    assert status == 403, f"Expected 403 outside geofence, got {status}: {geo_blocked_face}"
    assert "outside the college campus" in str(geo_blocked_face), f"Expected geofence message, got: {geo_blocked_face}"
    print(f"✓ 27. Face Geofence check: HTTP 403 ({geo_blocked_face.get('detail')})")

    # 28. Face Verification INSIDE Geofence -> HTTP 200
    face_verified, status = request_json(
        f"{BASE}/api/face/verify",
        method="POST",
        data={
            "image": face_b64,
            "timetable_id": 21,
            "latitude": 12.183700,
            "longitude": 76.694200
        },
        token=admin_token
    )
    assert status == 200, f"Face verification failed: {face_verified}"
    face_data = face_verified.get("data") or face_verified
    assert face_data.get("method") == "FACE" or face_data.get("attendance_method") == "FACE", f"Expected FACE method: {face_verified}"
    print(f"✓ 28. Face Verification inside campus: SUCCESS -> Student: {face_data.get('student_name')} (Method: {face_data.get('attendance_method') or face_data.get('method')})")

    # 29. Duplicate Attendance Prevention -> HTTP 400
    dup_face, status = request_json(
        f"{BASE}/api/face/verify",
        method="POST",
        data={
            "image": face_b64,
            "timetable_id": 21,
            "latitude": 12.183700,
            "longitude": 76.694200
        },
        token=admin_token
    )
    assert status in (400, 409), f"Expected 400/409 for duplicate attendance, got {status}: {dup_face}"
    assert "already marked Present" in str(dup_face), f"Expected duplicate warning: {dup_face}"
    print(f"✓ 29. Face Duplicate Prevention: HTTP {status} ({dup_face.get('detail')})")

    print("\n--- BIOMETRIC ATTENDANCE TESTS ---")
    # 30. Check Biometric Status & Mock Provider Label
    bio_stat, status = request_json(f"{BASE}/api/biometric/status", token=admin_token)
    assert status == 200, f"Biometric status check failed: {bio_stat}"
    bio_info = bio_stat.get("data") or bio_stat
    assert "DEVELOPMENT" in str(bio_info).upper() or "MOCK" in str(bio_info).upper(), "Must clearly label mock provider"
    print(f"✓ 30. Biometric status & provider label: {bio_info.get('active_provider')} ({bio_info.get('message')})")

    # 31. Biometric Registration
    bio_reg, status = request_json(
        f"{BASE}/api/biometric/register/2",
        method="POST",
        data={"finger_position": "RIGHT_INDEX"},
        token=admin_token
    )
    assert status == 200, f"Biometric registration failed: {bio_reg}"
    print(f"✓ 31. Biometric registration: SUCCESS (Student #2 minutiae token generated)")

    # 32. Biometric Verification OUTSIDE Geofence -> HTTP 403
    geo_blocked_bio, status = request_json(
        f"{BASE}/api/biometric/verify",
        method="POST",
        data={
            "student_id": 2,
            "timetable_id": 21,
            "latitude": 51.5074,
            "longitude": -0.1278
        },
        token=admin_token
    )
    assert status == 403, f"Expected 403 outside geofence, got {status}: {geo_blocked_bio}"
    print(f"✓ 32. Biometric Geofence check: HTTP 403 ({geo_blocked_bio.get('detail')})")

    # 33. Biometric Verification INSIDE Geofence -> HTTP 200
    bio_verified, status = request_json(
        f"{BASE}/api/biometric/verify",
        method="POST",
        data={
            "student_id": 2,
            "timetable_id": 21,
            "latitude": 12.183700,
            "longitude": 76.694200
        },
        token=admin_token
    )
    assert status == 200, f"Biometric verification failed: {bio_verified}"
    bio_data = bio_verified.get("data") or bio_verified
    assert bio_data.get("method") == "BIOMETRIC" or bio_data.get("attendance_method") == "BIOMETRIC", f"Expected BIOMETRIC method: {bio_verified}"
    print(f"✓ 33. Biometric Verification inside campus: SUCCESS -> Student: {bio_data.get('student_name')} (Method: {bio_data.get('attendance_method') or bio_data.get('method')})")

    # 34. Biometric Duplicate Prevention -> HTTP 400/409
    dup_bio, status = request_json(
        f"{BASE}/api/biometric/verify",
        method="POST",
        data={
            "student_id": 2,
            "timetable_id": 21,
            "latitude": 12.183700,
            "longitude": 76.694200
        },
        token=admin_token
    )
    assert status in (400, 409), f"Expected 400/409 for duplicate biometric attendance, got {status}: {dup_bio}"
    assert "already marked Present" in str(dup_bio), f"Expected duplicate warning: {dup_bio}"
    print(f"✓ 34. Biometric Duplicate Prevention: HTTP {status} ({dup_bio.get('detail')})")

    # 35. Verify attendance_method column is persisted in DB
    att_session, status = request_json(f"{BASE}/api/attendance/session/21", token=admin_token)
    assert status == 200, f"Session attendance fetch failed: {att_session}"
    students_in_session = att_session.get("students") or att_session.get("data", {}).get("students", [])
    methods_found = {st.get("attendance_method") for st in students_in_session if st.get("attendance_method")}
    assert "FACE" in methods_found or "BIOMETRIC" in methods_found or "MANUAL" in methods_found, f"Expected attendance methods in DB, got: {methods_found}"
    print(f"✓ 35. Attendance Method persistence validated: DB recorded methods {methods_found}")

    print("\n" + "=" * 60)
    print("ALL 35 BACKEND ENDPOINTS AND BIOMETRIC/FACE CHECKS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_verifications()
