import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.status
            resp_body = resp.read().decode("utf-8")
            try:
                return status_code, json.loads(resp_body)
            except Exception:
                return status_code, resp_body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body

def get_token(email, password="password123"):
    code, res = request("POST", "/api/auth/login", {"email": email, "password": password})
    if code != 200:
        raise Exception(f"Login failed for {email}: {res}")
    return res.get("access_token") or res.get("data", {}).get("access_token")

def test_events_and_announcements():
    print("==================================================")
    print("STARTING COMPLETE EVENTS & ANNOUNCEMENTS TEST SUITE")
    print("==================================================")

    # 1. Authenticate users
    admin_token = get_token("admin@campus.edu")
    hod_token = get_token("hod.cse@campus.edu")
    teacher_token = get_token("ananya.iyer@faculty.campus.edu")
    student_token = get_token("aarav.sharma@college.edu")
    student2_token = get_token("aditi.rao@college.edu")

    log("[OK] Authenticated Admin, HOD, Teacher, and Students", "PASS")

    # 2. Test: Admin creates an event
    create_payload = {
        "title": "Quantum Computing & Cryptography Summit",
        "description": "High-level summit on post-quantum encryption algorithms and quantum annealing.",
        "category": "Conference",
        "event_date": "2026-11-12",
        "start_time": "10:00 AM",
        "end_time": "04:30 PM",
        "venue": "Main Auditorium",
        "organizer": "Department of Computer Science",
        "department_id": 1,
        "target_audience": "All Students",
        "registration_required": True,
        "registration_deadline": "2026-11-10T23:59:59",
        "max_participants": 2,  # set small for testing full capacity
        "status": "Upcoming",
        "is_published": True,
    }
    code, created_event = request("POST", "/api/events", create_payload, admin_token)
    assert code == 201, f"Admin create event failed: {created_event}"
    event_id = created_event["id"]
    log(f"[OK] Admin created event: ID {event_id} - '{created_event['title']}'", "PASS")

    # 3. Test: Admin edits event
    edit_payload = {
        "venue": "Main Auditorium & Virtual Stream",
        "max_participants": 2
    }
    code, edited_event = request("PUT", f"/api/events/{event_id}", edit_payload, admin_token)
    assert code == 200, f"Admin edit event failed: {edited_event}"
    assert edited_event["venue"] == "Main Auditorium & Virtual Stream"
    log("[OK] Admin edited event successfully", "PASS")

    # 4. Test: HOD can create event for own department
    hod_event_payload = {
        "title": "CSE Department Research Colloquium",
        "description": "Research paper presentations by faculty and research scholars.",
        "category": "Academic",
        "event_date": "2026-11-15",
        "start_time": "02:00 PM",
        "end_time": "05:00 PM",
        "venue": "CSE Seminar Hall",
        "organizer": "HOD CSE",
        "department_id": 1,
        "target_audience": "Teachers",
        "registration_required": False,
        "max_participants": 50,
        "status": "Upcoming",
        "is_published": True,
    }
    code, hod_event = request("POST", "/api/events", hod_event_payload, hod_token)
    assert code == 201, f"HOD create event failed: {hod_event}"
    hod_event_id = hod_event["id"]
    log(f"[OK] HOD created event for own department: ID {hod_event_id}", "PASS")

    # 5. Test: HOD cannot manage events belonging to another department (403 Forbidden)
    dept2_payload = {
        "title": "Mechanical Engineering CAD Workshop",
        "description": "SolidWorks & ANSYS finite element modeling.",
        "category": "Workshop",
        "event_date": "2026-11-20",
        "start_time": "09:00 AM",
        "end_time": "01:00 PM",
        "venue": "CAD Lab",
        "organizer": "Mechanical Department",
        "department_id": 2, # Dept 2
        "target_audience": "Students",
        "registration_required": True,
        "max_participants": 60,
    }
    code, dept2_event = request("POST", "/api/events", dept2_payload, admin_token)
    assert code == 201
    dept2_event_id = dept2_event["id"]

    # Now HOD (dept 1) attempts to edit or delete Dept 2 event
    code, res = request("PUT", f"/api/events/{dept2_event_id}", {"venue": "Hacked Hall"}, hod_token)
    assert code == 403, f"Expected 403 when HOD edits another department's event, got {code}"
    log("[OK] HOD editing another department event strictly returns HTTP 403 Forbidden", "PASS")

    code, res = request("DELETE", f"/api/events/{dept2_event_id}", None, hod_token)
    assert code == 403, f"Expected 403 when HOD deletes another department's event, got {code}"
    log("[OK] HOD deleting another department event strictly returns HTTP 403 Forbidden", "PASS")

    # 6. Test: Student cannot create or edit events (403 Forbidden)
    code, res = request("POST", "/api/events", create_payload, student_token)
    assert code == 403, f"Expected 403 when Student creates event, got {code}"
    log("[OK] Student creating event returns HTTP 403 Forbidden", "PASS")

    code, res = request("PUT", f"/api/events/{event_id}", {"title": "Hacked"}, student_token)
    assert code == 403, f"Expected 403 when Student edits event, got {code}"
    log("[OK] Student editing event returns HTTP 403 Forbidden", "PASS")

    # 7. Test: Student and Teacher view & register for events
    code, res = request("POST", f"/api/events/{event_id}/register", None, student_token)
    assert code == 200, f"Student registration failed: {res}"
    log("[OK] Student registered for event successfully", "PASS")

    # 8. Test: Prevent duplicate registration
    code, res = request("POST", f"/api/events/{event_id}/register", None, student_token)
    assert code == 400, f"Expected 400 on duplicate registration, got {code}"
    log("[OK] Duplicate registration prevented (HTTP 400 Duplicate Registration)", "PASS")

    # 9. Test: Teacher registers for event
    code, res = request("POST", f"/api/events/{event_id}/register", None, teacher_token)
    assert code == 200, f"Teacher registration failed: {res}"
    log("[OK] Teacher registered for event successfully (Capacity now 2/2)", "PASS")

    # 10. Test: Maximum participants limit (Capacity = 2, now 2 are registered)
    code, res = request("POST", f"/api/events/{event_id}/register", None, student2_token)
    assert code == 400, f"Expected 400 on full event, got {code}"
    assert "Event Full" in str(res)
    log("[OK] Maximum participants capacity limit enforced: returns 'Event Full'", "PASS")

    # 11. Test: Registration deadline passed
    expired_event_payload = {
        "title": "Past Hackathon",
        "description": "Past registration deadline event",
        "category": "Hackathon",
        "event_date": "2026-11-30",
        "start_time": "09:00 AM",
        "end_time": "05:00 PM",
        "venue": "Online",
        "organizer": "CSE",
        "registration_required": True,
        "registration_deadline": "2026-01-01T00:00:00", # Past deadline
        "max_participants": 100,
    }
    code, expired_event = request("POST", "/api/events", expired_event_payload, admin_token)
    expired_event_id = expired_event["id"]

    code, res = request("POST", f"/api/events/{expired_event_id}/register", None, student2_token)
    assert code == 400, f"Expected 400 for passed deadline, got {code}"
    assert "Registration Closed" in str(res)
    log("[OK] Registration deadline check works: returns 'Registration Closed'", "PASS")

    # 12. Test: View participants & mark attendance
    code, participants = request("GET", f"/api/events/{event_id}/participants", None, admin_token)
    assert code == 200
    assert len(participants) == 2
    student_user_id = participants[0]["user_id"]
    log(f"[OK] Viewed {len(participants)} registered participants", "PASS")

    # Organizer marks attendance
    att_payload = {
        "user_id": student_user_id,
        "attendance_status": "Present"
    }
    code, res = request("POST", f"/api/events/{event_id}/attendance", att_payload, admin_token)
    assert code == 200
    log("[OK] Marked participant as 'Present'", "PASS")

    # Verify participant has Present status
    code, updated_parts = request("GET", f"/api/events/{event_id}/participants", None, admin_token)
    matched = next((p for p in updated_parts if p["user_id"] == student_user_id), None)
    assert matched and matched["attendance_status"] == "Present"
    log("[OK] Attendance status verified in participant roster", "PASS")

    # 13. Test: Student cancels own registration
    code, res = request("DELETE", f"/api/events/{event_id}/register", None, student_token)
    assert code == 200
    log("[OK] Student successfully cancelled own registration", "PASS")

    # Now Student 2 can register since capacity freed up!
    code, res = request("POST", f"/api/events/{event_id}/register", None, student2_token)
    assert code == 200
    log("[OK] Next participant can register once spot is freed", "PASS")

    # 14. Test: /api/my-registrations and /api/my-events
    code, my_regs = request("GET", "/api/my-registrations", None, teacher_token)
    assert code == 200
    assert any(ev["id"] == event_id for ev in my_regs)
    log("[OK] GET /api/my-registrations returned user registered events", "PASS")

    code, my_events = request("GET", "/api/my-events", None, hod_token)
    assert code == 200
    log("[OK] GET /api/my-events returned department events for HOD", "PASS")

    # 15. Test: Announcements CRUD
    ann_payload = {
        "title": "Semester End Examination Notification 2026",
        "content": "Official circular regarding hall ticket issuance, fee clearance, and exam timetable.",
        "category": "Examination",
        "priority": "Urgent",
        "target_audience": "All Students",
        "department_id": 1,
    }
    code, ann_res = request("POST", "/api/announcements", ann_payload, admin_token)
    assert code == 201
    ann_id = ann_res["id"]
    log(f"[OK] Created announcement: ID {ann_id}", "PASS")

    # View announcement
    code, ann_detail = request("GET", f"/api/announcements/{ann_id}", None, student_token)
    assert code == 200
    assert ann_detail["priority"] == "Urgent"
    log("[OK] Retrieved announcement details with Urgent priority", "PASS")

    # Edit announcement
    code, ann_edited = request("PUT", f"/api/announcements/{ann_id}", {"priority": "Important"}, admin_token)
    assert code == 200
    assert ann_edited["priority"] == "Important"
    log("[OK] Updated announcement priority", "PASS")

    # Delete announcement
    code, del_res = request("DELETE", f"/api/announcements/{ann_id}", None, admin_token)
    assert code == 200
    log("[OK] Deleted announcement successfully", "PASS")

    # 16. Test: Notifications API
    code, notifs = request("GET", "/api/notifications", None, student_token)
    assert code == 200
    assert len(notifs) > 0
    notif_id = notifs[0]["id"]
    log(f"[OK] Retrieved notifications ({len(notifs)} available)", "PASS")

    # Mark as read
    code, read_res = request("PUT", f"/api/notifications/{notif_id}/read", None, student_token)
    assert code == 200
    assert read_res["read"] == True
    log("[OK] Marked notification as read", "PASS")

    # 17. Test: Search & Filter on /api/events
    code, search_results = request("GET", "/api/events?search=Quantum", None, student_token)
    assert code == 200
    assert any("Quantum" in ev["title"] for ev in search_results)
    log("[OK] Search events by title keyword works", "PASS")

    code, cat_results = request("GET", "/api/events?category=Workshop", None, student_token)
    assert code == 200
    assert all(ev["category"] == "Workshop" for ev in cat_results)
    log("[OK] Filter events by category works", "PASS")

    # 18. Test: Admin cancels event
    code, del_ev_res = request("DELETE", f"/api/events/{event_id}", None, admin_token)
    assert code == 200
    code, cancelled_ev = request("GET", f"/api/events/{event_id}", None, admin_token)
    assert cancelled_ev["status"] == "Cancelled"
    log("[OK] Admin cancelled event successfully", "PASS")

    print("==================================================")
    print("ALL 18 VERIFICATION CHECKS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    try:
        test_events_and_announcements()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
