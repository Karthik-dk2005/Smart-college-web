import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, Timetable, Teacher, Student, Attendance, AttendanceSession, StudentAttendance
from app.utils.security import create_access_token


client = TestClient(app)

def test_all():
    db = SessionLocal()
    try:
        # Find teachers
        prof_ananya_user = db.query(User).filter(User.email == "ananya.iyer@faculty.campus.edu").first()
        dr_rajesh_user = db.query(User).filter(User.email == "rajesh.kumar@faculty.campus.edu").first()
        hod_user = db.query(User).filter(User.email == "hod.cse@campus.edu").first()
        student_user = db.query(User).filter(User.email == "aarav.sharma@college.edu").first()

        token_ananya = create_access_token({"sub": prof_ananya_user.email, "role": prof_ananya_user.role, "type": "access"})
        token_rajesh = create_access_token({"sub": dr_rajesh_user.email, "role": dr_rajesh_user.role, "type": "access"})
        token_hod = create_access_token({"sub": hod_user.email, "role": hod_user.role, "type": "access"})
        token_student = create_access_token({"sub": student_user.email, "role": student_user.role, "type": "access"})

        headers_ananya = {"Authorization": f"Bearer {token_ananya}"}
        headers_rajesh = {"Authorization": f"Bearer {token_rajesh}"}
        headers_hod = {"Authorization": f"Bearer {token_hod}"}
        headers_student = {"Authorization": f"Bearer {token_student}"}

        print("[1] Testing GET /api/timetable/today...")
        res = client.get("/api/timetable/today?day=Monday", headers=headers_ananya)
        assert res.status_code == 200, f"Failed: {res.text}"
        data = res.json()
        print(f"  -> Found {len(data)} classes for Monday")
        assert len(data) > 0

        print("[2] Testing GET /api/timetable/teacher/today...")
        res = client.get("/api/timetable/teacher/today?day=Monday", headers=headers_ananya)
        assert res.status_code == 200, f"Failed: {res.text}"
        teacher_classes = res.json()
        print(f"  -> Prof. Ananya has {len(teacher_classes)} classes on Monday")
        assert len(teacher_classes) > 0
        ananya_slot = teacher_classes[0]
        slot_id = ananya_slot["id"]
        print(f"  -> Target timetable slot ID {slot_id}: {ananya_slot['subject_name']} ({ananya_slot['start_time']} - {ananya_slot['end_time']})")

        print("[3] Testing GET /api/students/class...")
        res = client.get(f"/api/students/class?semester={ananya_slot['semester']}&section={ananya_slot['section']}", headers=headers_ananya)
        assert res.status_code == 200, f"Failed: {res.text}"
        st_data = res.json()
        assert st_data["success"] is True
        print(f"  -> Loaded {len(st_data['data'])} students for Sem {ananya_slot['semester']}{ananya_slot['section']}")
        assert len(st_data['data']) > 0

        print("[4] Testing GET /api/attendance/session/{timetable_id}...")
        test_date = "2026-09-26"
        # Ensure clean state for this date and slot
        db.query(Attendance).filter(Attendance.timetable_id == slot_id, Attendance.date == test_date).delete()
        old_sessions = db.query(AttendanceSession).filter(AttendanceSession.timetable_id == slot_id, AttendanceSession.date == test_date).all()
        for osess in old_sessions:
            db.query(StudentAttendance).filter(StudentAttendance.attendance_session_id == osess.id).delete()
            db.delete(osess)
        db.commit()


        res = client.get(f"/api/attendance/session/{slot_id}?date={test_date}", headers=headers_ananya)
        assert res.status_code == 200, f"Failed: {res.text}"
        session_info = res.json()["data"]
        print(f"  -> Session: {session_info['subject_name']} | Room: {session_info['room_name']} | Students: {len(session_info['students'])}")
        assert session_info["attendance_completed"] is False

        print("[5] Testing Teacher Authorization Check (Wrong teacher)...")
        # Dr. Rajesh trying to take attendance for Prof. Ananya's class
        res = client.get(f"/api/attendance/session/{slot_id}?date={test_date}", headers=headers_rajesh)
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
        print(f"  -> Successfully blocked unauthorized teacher with HTTP 403: {res.json()['detail']}")

        # Submit with Dr. Rajesh should also be blocked
        dummy_submit = {
            "attendance": [{"student_id": s["id"], "status": "Present"} for s in session_info["students"]],
            "date": test_date
        }
        res = client.post(f"/api/attendance/session/{slot_id}", json=dummy_submit, headers=headers_rajesh)
        assert res.status_code == 403, f"Expected 403 on submit, got {res.status_code}: {res.text}"
        print(f"  -> Successfully blocked submission by unauthorized teacher with HTTP 403")

        print("[6] Testing POST /api/attendance/session/{timetable_id} with authorized teacher...")
        submit_payload = {
            "attendance": [
                {"student_id": session_info["students"][0]["id"], "status": "Present"},
                {"student_id": session_info["students"][1]["id"], "status": "Absent"},
            ] + [{"student_id": s["id"], "status": "Present"} for s in session_info["students"][2:]],
            "date": test_date
        }
        res = client.post(f"/api/attendance/session/{slot_id}", json=submit_payload, headers=headers_ananya)
        assert res.status_code == 200, f"Failed: {res.text}"
        sub_res = res.json()
        assert sub_res["success"] is True
        print(f"  -> Submission message: {sub_res['data']['message']}")
        print(f"  -> Present: {sub_res['data']['present']} | Absent: {sub_res['data']['absent']} | Total: {sub_res['data']['total']}")

        print("[7] Testing Duplicate Attendance Prevention...")
        res = client.post(f"/api/attendance/session/{slot_id}", json=submit_payload, headers=headers_ananya)
        assert res.status_code == 409, f"Expected 409 Conflict, got {res.status_code}: {res.text}"
        print(f"  -> Duplicate blocked with HTTP 409: {res.json()['detail']}")

        print("[8] Re-checking GET /api/attendance/session/{timetable_id} after submission...")
        res = client.get(f"/api/attendance/session/{slot_id}?date={test_date}", headers=headers_ananya)
        assert res.status_code == 200
        updated_session = res.json()["data"]
        assert updated_session["attendance_completed"] is True
        print(f"  -> Session attendance_completed is now TRUE! Present: {updated_session['present_count']}, Absent: {updated_session['absent_count']}")

        print("[9] Testing GET /api/attendance/student/{student_id}...")
        student_id = session_info["students"][0]["id"]
        res = client.get(f"/api/attendance/student/{student_id}", headers=headers_hod)
        assert res.status_code == 200, f"Failed: {res.text}"
        st_summary = res.json()["data"]
        print(f"  -> Student {st_summary['student_name']} ({st_summary['usn']}) Overall: {st_summary['overall_percentage']}%")
        print(f"  -> Total conducted sessions: {st_summary['total_sessions']}, Present: {st_summary['present_sessions']}")

        print("[10] Testing HOD/Admin GET /api/attendance/sessions...")
        res = client.get("/api/attendance/sessions", headers=headers_hod)
        assert res.status_code == 200, f"Failed: {res.text}"
        all_sessions = res.json()["data"]
        print(f"  -> HOD view: {len(all_sessions)} conducted sessions found")
        assert len(all_sessions) > 0

        print("\nALL 10 TESTS PASSED SUCCESSFULLY! ATTENDANCE STRICTLY FOLLOWS TIMETABLE!")
    finally:
        db.close()

if __name__ == "__main__":
    test_all()
