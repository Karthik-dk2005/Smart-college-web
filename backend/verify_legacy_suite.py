import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

print("=" * 60)
print("RUNNING SMART DEPARTMENT BACKEND VERIFICATION SUITE")
print("=" * 60)

# 1. Initialize Database
print("\n[Step 1] Initializing Database & Seed Records...")
init_db()
print(" -> Database initialized successfully!")

client = TestClient(app)

# 2. Test Health Endpoint
print("\n[Step 2] Testing GET /health...")
res = client.get("/health")
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
assert res.json() == {"status": "ok"}
print(f" -> GET /health PASSED: {res.json()}")

# 3. Test Authentication (Login)
print("\n[Step 3] Testing POST /api/auth/login...")
# Test Student login
res = client.post("/api/auth/login", json={"email": "amulya.h.s@mitt.ac.in", "password": "password123"})
assert res.status_code == 200, f"Student login failed: {res.text}"
student_token = res.json()["access_token"]
print(" -> Student Login (amulya.h.s@mitt.ac.in): PASSED! JWT Token acquired.")

# Test Faculty login
res = client.post("/api/auth/login", json={"email": "ananya.iyer@faculty.campus.edu", "password": "password123"})
assert res.status_code == 200, f"Teacher login failed: {res.text}"
teacher_token = res.json()["access_token"]
print(" -> Teacher Login (ananya.iyer@faculty.campus.edu): PASSED! JWT Token acquired.")

# Test HOD login
res = client.post("/api/auth/login", json={"email": "hod.cse@campus.edu", "password": "password123"})
assert res.status_code == 200, f"HOD login failed: {res.text}"
hod_token = res.json()["access_token"]
print(" -> HOD Login (hod.cse@campus.edu): PASSED! JWT Token acquired.")

# Test Admin login
res = client.post("/api/auth/login", json={"email": "admin@campus.edu", "password": "password123"})
assert res.status_code == 200, f"Admin login failed: {res.text}"
admin_token = res.json()["access_token"]
print(" -> Admin Login (admin@campus.edu): PASSED! JWT Token acquired.")

# 4. Test GET /api/auth/me
print("\n[Step 4] Testing GET /api/auth/me...")
headers_student = {"Authorization": f"Bearer {student_token}"}
headers_teacher = {"Authorization": f"Bearer {teacher_token}"}
headers_hod = {"Authorization": f"Bearer {hod_token}"}
headers_admin = {"Authorization": f"Bearer {admin_token}"}

res = client.get("/api/auth/me", headers=headers_student)
assert res.status_code == 200
user_info = res.json()["user"]
assert user_info["email"] == "amulya.h.s@mitt.ac.in"
print(f" -> Authenticated User Profile: {user_info['full_name']} ({user_info['role']})")

# 5. Test Rooms API
print("\n[Step 5] Testing Rooms API...")
res = client.get("/api/rooms", headers=headers_student)
assert res.status_code == 200
rooms = res.json()["rooms"]
print(f" -> Found {len(rooms)} pre-seeded rooms: {[r['room_number'] for r in rooms]}")
room_id = rooms[0]["id"]

# 6. Test Teacher Sessions & Attendance
print("\n[Step 6] Testing Attendance Session Creation (Teacher)...")
session_payload = {
    "subject_id": 1,
    "room_id": room_id,
    "start_time": "09:00",
    "end_time": "10:00"
}
res = client.post("/api/attendance/session", json=session_payload, headers=headers_teacher)
assert res.status_code == 201, f"Create session failed: {res.text}"
session_data = res.json()["session"]
session_id = session_data["id"]
session_code = session_data["session_id"]
print(f" -> Created Attendance Session: ID={session_id}, SessionCode={session_code}")

# 7. Test Location Verification (Live GPS Geofence)
print("\n[Step 7] Testing GPS Geofence Verification (Inside vs Outside Radius)...")
# Test 7a: Inside radius (Campus coords: 12.183700, 76.694200)
mark_inside_payload = {
    "session_id": session_id,
    "latitude": 12.183705,
    "longitude": 76.694210,
    "device_verified": True
}
res = client.post("/api/attendance/mark", json=mark_inside_payload, headers=headers_student)
assert res.status_code == 200, f"Attendance inside mark failed: {res.text}"
res_data = res.json()
assert res_data["success"] is True
print(f" -> Inside Radius Test: PASSED! Distance: {res_data.get('distance_meters')}m. Response: {res_data['message']}")

# Test 7b: Duplicate mark rejection
res = client.post("/api/attendance/mark", json=mark_inside_payload, headers=headers_student)
assert res.status_code == 400 or res.json().get("success") is False
print(f" -> Duplicate Attendance Test: PASSED! Correctly rejected duplicate submission.")

# Test 7c: Student 2 Outside radius (Bangalore coordinates: 12.9716, 77.5946 -> ~130km away)
# Register a second student for outside test
reg_student2 = {
    "email": "student2@campus.edu",
    "password": "password123",
    "full_name": "Farhan Khan",
    "role": "student"
}
res = client.post("/api/auth/register", json=reg_student2)
# Login as student 2
res = client.post("/api/auth/login", json={"email": "student2@campus.edu", "password": "password123"})
assert res.status_code == 200
s2_token = res.json()["access_token"]
headers_s2 = {"Authorization": f"Bearer {s2_token}"}

mark_outside_payload = {
    "session_id": session_id,
    "latitude": 12.9716,
    "longitude": 77.5946,
    "device_verified": True
}
res = client.post("/api/attendance/mark", json=mark_outside_payload, headers=headers_s2)
assert res.status_code == 400 or res.json().get("success") is False
print(f" -> Outside Radius Test: PASSED! Correctly rejected with message: '{res.json().get('message')}'")

# 8. Test Attendance Report
print("\n[Step 8] Testing Attendance Reports...")
res = client.get("/api/attendance/my", headers=headers_student)
assert res.status_code == 200
my_att = res.json()["report"]
print(f" -> GET /api/attendance/my returned {len(my_att['records'])} attendance records")

res = client.get("/api/attendance/student/1", headers=headers_teacher)
assert res.status_code == 200
report = res.json()["data"]
print(f" -> Student Attendance Report: Total: {report['total_classes']}, Attended: {report['attended_classes']}, Percentage: {report['attendance_percentage']}%")

# 9. Test Timetable API & Conflict Detection
print("\n[Step 9] Testing Timetable API & Conflict Detection...")
timetable_payload = {
    "department": "Computer Science & Engineering",
    "semester": 6,
    "section": "A",
    "day_of_week": "Monday",
    "start_time": "10:00",
    "end_time": "11:00",
    "subject_id": 1,
    "teacher_id": 1,
    "room_id": room_id
}
res = client.post("/api/timetable", json=timetable_payload, headers=headers_hod)
assert res.status_code in (200, 201), f"Create timetable failed: {res.text}"
tt_data = res.json()
tt_id = tt_data.get("data", {}).get("id") or tt_data.get("id")
print(f" -> Created Timetable slot ID={tt_id}")

# Conflict test: Create overlapping slot with same room at same time
conflict_payload = {
    "department": "Computer Science & Engineering",
    "semester": 4,
    "section": "B",
    "day_of_week": "Monday",
    "start_time": "10:00",
    "end_time": "11:00",
    "subject_id": 2,
    "teacher_id": 1,
    "room_id": room_id
}
res = client.post("/api/timetable", json=conflict_payload, headers=headers_hod)
assert res.status_code == 409, f"Expected 409 conflict, got {res.status_code}: {res.text}"
print(f" -> Timetable Conflict Detection PASSED: Correctly caught collision! ({res.json().get('detail') or res.json().get('message')})")

# 10. Test Internal Marks API & Grade Calculation
print("\n[Step 10] Testing Internal Marks & Grade Calculation...")
marks_payload = {
    "student_id": 1,
    "subject_id": 1,
    "exam_type": "Internal Assessment 1",
    "ia1_score": 28.0,
    "ia2_score": 27.0,
    "assignment_score": 18.0,
    "test_score": 19.0,
    "quiz_score": 5.0,
    "semester_exam_score": 0.0,
    "max_total": 100.0
}
res = client.post("/api/marks", json=marks_payload, headers=headers_teacher)
assert res.status_code in (200, 201), f"Marks entry failed: {res.text}"
mark_res = res.json()
mark_id = mark_res.get("data", {}).get("id") or mark_res.get("id")
print(f" -> Created Mark Entry: ID={mark_id}, Result={mark_res.get('message')}")

# Finalize mark by HOD
res = client.post(f"/api/marks/{mark_id}/finalize", headers=headers_hod)
assert res.status_code == 200
print(f" -> HOD Finalize Mark: PASSED! Message: {res.json()['message']}")

# 11. Test Exams API
print("\n[Step 11] Testing Exams API...")
exam_payload = {
    "exam_title": "Full Stack Development Mid-Term Lab Exam",
    "exam_type": "Lab Exam",
    "subject_id": 1,
    "semester": 6,
    "date": "2026-10-15",
    "start_time": "14:00",
    "end_time": "17:00",
    "room_id": room_id,
    "max_marks": 50,
    "instructions": "Bring college ID card and lab journal."
}
res = client.post("/api/exams", json=exam_payload, headers=headers_hod)
assert res.status_code in (200, 201), f"Exam create failed: {res.text}"
print(f" -> Created Exam: {exam_payload['exam_title']} (Status: {res.json()['message']})")

# 12. Test Notices API
print("\n[Step 12] Testing Notices API & Broadcast...")
notice_payload = {
    "title": "Semester VI IA-1 Schedule & Attendance Policy Announcement",
    "description": "All 6th semester students must ensure minimum 75% attendance to be eligible for IA-1.",
    "category": "Academic",
    "priority": "Urgent",
    "department": "Computer Science & Engineering"
}
res = client.post("/api/notices", json=notice_payload, headers=headers_hod)
assert res.status_code == 201, f"Notice create failed: {res.text}"
print(f" -> Published Notice: {res.json()['title']} (Priority: {res.json()['priority']})")

# 13. Test Bus Transit API
print("\n[Step 13] Testing Bus Transit API...")
res = client.get("/api/bus", headers=headers_student)
assert res.status_code == 200
bus_routes = res.json()
print(f" -> Retrieved {len(bus_routes)} Bus Routes. First Route: {bus_routes[0]['route_number']} - {bus_routes[0]['route_name']}")

# 14. Test Study Materials API
print("\n[Step 14] Testing Study Materials API...")
mat_payload = {
    "subject_id": 1,
    "unit": "Unit 3: RESTful APIs with FastAPI & SQLAlchemy",
    "title": "FastAPI Architecture, Dependency Injection & Relational Models",
    "description": "Complete lecture slides, code examples, and practice viva questions.",
    "material_type": "PDF Notes",
    "file_url": "https://cdn.campus.edu/materials/cse601-unit3.pdf",
    "important_questions_attached": True
}
res = client.post("/api/materials", json=mat_payload, headers=headers_teacher)
assert res.status_code == 201
print(f" -> Uploaded Material: {res.json()['title']}")

# 15. Test Dashboard APIs
print("\n[Step 15] Testing Dashboards (Student, Teacher, HOD, Admin)...")
# Student Dashboard
res = client.get("/api/dashboard/student", headers=headers_student)
assert res.status_code == 200
dash_student = res.json()
assert dash_student["success"] is True
print(f" -> Student Dashboard: Attendance={dash_student['attendance']['attendance_percentage']}%, Next Classes={len(dash_student['today_classes'])}, Notices={len(dash_student['latest_notices'])}")

# Teacher Dashboard
res = client.get("/api/dashboard/teacher", headers=headers_teacher)
assert res.status_code == 200
dash_teacher = res.json()
print(f" -> Teacher Dashboard: Faculty={dash_teacher['profile']['name']}, Subjects={len(dash_teacher['subjects'])}, Sessions={len(dash_teacher['attendance_sessions'])}")

# HOD Dashboard
res = client.get("/api/dashboard/hod", headers=headers_hod)
assert res.status_code == 200
dash_hod = res.json()
print(f" -> HOD Dashboard: Total Students={dash_hod['statistics']['total_students']}, Dept Attendance={dash_hod['statistics']['department_attendance_rate']}%")

# Admin Dashboard
res = client.get("/api/dashboard/admin", headers=headers_admin)
assert res.status_code == 200
dash_admin = res.json()
print(f" -> Admin Dashboard: Total Users={dash_admin['user_statistics']['total_users']}, Audit Logs={len(dash_admin['recent_audit_events'])}")

print("\n" + "=" * 60)
print("ALL 15 TEST SUITES PASSED FLAWLESSLY WITH 100% SUCCESS!")
print("=" * 60)
