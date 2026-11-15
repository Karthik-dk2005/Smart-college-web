"""
Automated Test Suite for SmartDept SMTP & In-App Notification System
Maharaja Institute of Technology Thandavapura (MITT)
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.services.email_notification_service import EmailNotificationService
from app.utils.security import create_access_token

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("SMARTDEPT SMTP & NOTIFICATION SYSTEM TEST SUITE")
    print("=" * 70)
    db = SessionLocal()

    try:
        # 1. Fetch Existing Verified Accounts
        print("\n[Step 1] Loading verified database accounts...")
        admin_user = db.query(User).filter(User.role == "admin").first()
        hod_user = db.query(User).filter(User.role == "hod").first()
        student_a_rec = db.query(Student).filter(Student.user_id.isnot(None)).first()
        student_b_rec = db.query(Student).filter(Student.user_id.isnot(None), Student.id != student_a_rec.id).first()

        assert admin_user is not None, "Admin user required"
        assert hod_user is not None, "HOD user required"
        assert student_a_rec is not None, "Student A required"
        assert student_b_rec is not None, "Student B required"

        student_a = db.query(User).filter(User.id == student_a_rec.user_id).first()
        student_b = db.query(User).filter(User.id == student_b_rec.user_id).first()

        print(f"Admin: {admin_user.username} ({admin_user.email})")
        print(f"HOD: {hod_user.username} ({hod_user.email})")
        print(f"Student A: {student_a_rec.usn} - {student_a_rec.name} (User ID: {student_a.id})")
        print(f"Student B: {student_b_rec.usn} - {student_b_rec.name} (User ID: {student_b.id})")

        admin_token = create_access_token({"sub": admin_user.username, "role": admin_user.role, "id": admin_user.id})
        student_a_token = create_access_token({"sub": student_a.username, "role": student_a.role, "id": student_a.id})
        student_b_token = create_access_token({"sub": student_b.username, "role": student_b.role, "id": student_b.id})
        hod_token = create_access_token({"sub": hod_user.username, "role": hod_user.role, "id": hod_user.id})

        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        student_a_headers = {"Authorization": f"Bearer {student_a_token}"}
        student_b_headers = {"Authorization": f"Bearer {student_b_token}"}
        hod_headers = {"Authorization": f"Bearer {hod_token}"}

        print("JWT Authorization tokens generated successfully.")

        # 2. Test Email Notification Service directly
        print("\n[Step 2] Testing EmailNotificationService direct dispatch...")
        
        # IA Marks notification
        res_marks = EmailNotificationService.notify_student_ia_marks(
            db=db,
            student_id_or_usn=student_a_rec.usn,
            subject_name="Database Management Systems (21CS53)",
            test_type="IA-1",
            marks_obtained=24.5,
            max_marks=25.0
        )
        assert res_marks is not None, "Failed to create IA Marks notification"
        print(f"PASS: IA Marks notification sent: ID {res_marks.id}, Status: {res_marks.delivery_status}")

        # Attendance notification
        res_att = EmailNotificationService.notify_student_attendance(
            db=db,
            student_id_or_usn=student_a_rec.usn,
            subject_name="Computer Networks (21CS52)",
            status_val="Present",
            date_str="2026-11-15",
            session_info="Lecture 3"
        )
        assert res_att is not None, "Failed to create Attendance notification"
        print(f"PASS: Attendance notification sent: ID {res_att.id}, Status: {res_att.delivery_status}")

        # Timetable notification
        count_tt = EmailNotificationService.notify_timetable_schedule(
            db=db,
            semester=5,
            section=student_a_rec.section or "A",
            subject_name="Database Management Systems",
            day="Monday",
            time_slot="10:00 - 11:00 AM",
            room="CS-301"
        )
        print(f"PASS: Timetable notification dispatched to {count_tt} students.")

        # Announcement notification
        res_ann = EmailNotificationService.notify_announcement_broadcast(
            db=db,
            title="MITT Tech Fest 2026 Registration Open",
            content="Registrations for hackathon and paper presentation are now active.",
            category="Academic",
            target_role="student"
        )
        assert res_ann is not None, "Failed to broadcast Announcement"
        print(f"PASS: Announcement broadcast generated {res_ann} notifications")

        # 3. Test Student A notification retrieval & privacy
        print("\n[Step 3] Testing Student A notification endpoints & privacy...")
        res = client.get("/api/notifications?limit=10", headers=student_a_headers)
        assert res.status_code == 200, f"Error getting notifications: {res.text}"
        data = res.json()
        print(f"PASS: Student A retrieved {len(data)} notifications")
        assert len(data) >= 1, "Expected notifications for Student A"

        # Verify all returned notifications belong to Student A or are public broadcasts
        for item in data:
            assert item["user_id"] == student_a.id or item["user_id"] is None, f"Privacy violation! Item belongs to user {item['user_id']}"
            assert item["user_id"] != student_b.id, f"Privacy violation! Student A saw Student B's notification"
        print("PASS: Verified strict privacy: Student A received ONLY their own notifications & broadcasts.")

        # Check unread count
        res = client.get("/api/notifications/unread-count", headers=student_a_headers)
        assert res.status_code == 200
        count_data = res.json()
        print(f"PASS: Student A unread count = {count_data['unread_count']}")
        assert count_data["unread_count"] >= 1

        # Student B privacy check
        res_b = client.get("/api/notifications", headers=student_b_headers)
        assert res_b.status_code == 200
        data_b = res_b.json()
        for item in data_b:
            assert item["user_id"] == student_b.id or item["user_id"] is None, "Privacy violation: Student B saw another user's item"
            assert item["user_id"] != student_a.id, "Privacy violation: Student B saw Student A's personal notification"
        print(f"PASS: Verified Student B sees only Student B's notifications ({len(data_b)} items).")

        # 4. Test Mark As Read
        print("\n[Step 4] Testing Mark As Read & Mark All As Read...")
        first_notif = data[0]
        res = client.put(f"/api/notifications/{first_notif['id']}/read", headers=student_a_headers)
        assert res.status_code == 200
        assert res.json()["read"] is True
        print(f"PASS: Notification {first_notif['id']} marked as read.")

        res = client.put("/api/notifications/read-all", headers=student_a_headers)
        assert res.status_code == 200
        print("PASS: Mark all as read succeeded.")

        # Check unread count is now 0
        res = client.get("/api/notifications/unread-count", headers=student_a_headers)
        assert res.json()["unread_count"] == 0
        print("PASS: Unread count confirmed 0 after read-all.")

        # 5. Test Notification Preferences
        print("\n[Step 5] Testing Notification Preferences...")
        res = client.get("/api/notifications/preferences", headers=student_a_headers)
        assert res.status_code == 200
        prefs = res.json()
        print(f"PASS: Retrieved preferences: email_attendance={prefs.get('email_attendance')}")

        # Update preferences
        update_payload = {
            "email_attendance": True,
            "email_marks": True,
            "email_timetable": False,
            "email_announcements": True,
            "email_events": True,
            "email_system": True
        }
        res = client.put("/api/notifications/preferences", json=update_payload, headers=student_a_headers)
        assert res.status_code == 200
        updated_prefs = res.json()
        assert updated_prefs["email_timetable"] is False
        print("PASS: Successfully updated notification preferences.")

        # 6. Test Admin / Staff Custom Send API
        print("\n[Step 6] Testing Staff Custom Notification Dispatch...")
        send_payload = {
            "title": "Semester Registration Verification",
            "message": "Please ensure your VTU electives form is submitted to CSE dept office.",
            "notification_type": "announcement",
            "target_role": "student",
            "send_email": True
        }
        res = client.post("/api/notifications/send", json=send_payload, headers=admin_headers)
        assert res.status_code in (200, 201), f"Failed send: {res.text}"
        send_res = res.json()
        print(f"PASS: Custom send executed. Dispatched count: {send_res.get('recipients_count') or send_res.get('notification_id')}")

        # 7. Test SMTP Configuration Probe
        print("\n[Step 7] Testing SMTP configuration diagnostic probe...")
        smtp_probe_payload = {
            "test_email": "test.recipient@mitt.edu.in",
            "subject": "MITT SmartDept Diagnostic Ping",
            "message": "Automated verification of SMTP delivery pipeline."
        }
        res = client.post("/api/notifications/test-smtp", json=smtp_probe_payload, headers=admin_headers)
        assert res.status_code == 200, f"SMTP test failed: {res.text}"
        probe_res = res.json()
        print(f"PASS: SMTP Diagnostic response: success={probe_res.get('success')}, message={probe_res.get('message')}")

        # 8. Test Notification History
        print("\n[Step 8] Testing Notification History & Delivery Audit...")
        res = client.get("/api/notifications/history?limit=10", headers=admin_headers)
        assert res.status_code == 200
        history_items = res.json()
        assert len(history_items) > 0
        first_h = history_items[0]
        print(f"PASS: Notification history retrieved ({len(history_items)} logged). Latest delivery status: '{first_h.get('delivery_status')}' to '{first_h.get('recipient_email')}'")

        print("\n" + "=" * 70)
        print("ALL 8 NOTIFICATION SYSTEM TESTS PASSED SUCCESSFULLY! (100% PASS)")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
