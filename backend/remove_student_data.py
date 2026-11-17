import sys
import os
import sqlite3

def clean_database(db_path):
    print(f"\n==================================================")
    print(f"Cleaning ALL student data from: {db_path}")
    print(f"==================================================")

    if not os.path.exists(db_path):
        print(f"[!] Database file does not exist: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    existing_tables = {
        r[0] for r in cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    }

    def get_count(table, where=""):
        if table not in existing_tables:
            return 0
        try:
            query = f"SELECT count(*) FROM \"{table}\" {where}"
            return cur.execute(query).fetchone()[0]
        except Exception:
            return 0

    def safe_delete(sql):
        try:
            cur.execute(sql)
        except Exception as e:
            print(f"  [note] Skipped ({e}): {sql}")

    student_where = "WHERE LOWER(role)='student'"
    staff_where = "WHERE LOWER(role)!='student'"

    print("--- COUNTS BEFORE REMOVAL ---")
    print(f"Students: {get_count('students')}")
    print(f"Users with role='student': {get_count('users', student_where)}")
    print(f"Total Users: {get_count('users')}")
    print(f"Staff (Admin/HOD/Teacher) Users: {get_count('users', staff_where)}")
    print(f"Marks: {get_count('marks')}")
    print(f"Attendance (attendances): {get_count('attendances')}")
    print(f"Student Attendance (student_attendance): {get_count('student_attendance')}")
    print(f"Student Activities: {get_count('student_activities')}")
    print(f"Student Activity Files: {get_count('student_activity_files')}")
    print(f"Student Faces: {get_count('student_faces')}")
    print(f"Student Biometrics: {get_count('student_biometrics')}")
    print(f"Student Bus Assignments: {get_count('student_bus_assignments')}")
    print(f"Event Registrations: {get_count('event_registrations')}")
    print(f"Unmatched Student Records: {get_count('unmatched_student_records')}")
    print(f"Notifications (total): {get_count('notifications')}")
    print(f"Notification Preferences: {get_count('notification_preferences')}")
    print(f"Email OTPs: {get_count('email_otps')}")

    # Disable foreign key checks temporarily for clean cascade deletion
    cur.execute("PRAGMA foreign_keys = OFF;")

    # 1. Clear marks
    for tbl in ("marks", "ia_marks"):
        if tbl in existing_tables:
            safe_delete(f"DELETE FROM \"{tbl}\";")

    # 2. Clear student activities & related
    for tbl in ("student_activity_files", "student_activity_verifications", "student_activities"):
        if tbl in existing_tables:
            safe_delete(f"DELETE FROM \"{tbl}\";")

    # 3. Clear student biometric/face/bus assignments
    for tbl in ("student_faces", "student_biometrics", "student_bus_assignments"):
        if tbl in existing_tables:
            safe_delete(f"DELETE FROM \"{tbl}\";")

    # 4. Clear student attendance
    for tbl in ("student_attendance", "attendances", "attendance"):
        if tbl in existing_tables:
            safe_delete(f"DELETE FROM \"{tbl}\";")

    # 5. Clear event registrations/participants for students
    for tbl in ("event_registrations", "event_participants"):
        if tbl in existing_tables:
            safe_delete(f"DELETE FROM \"{tbl}\";")

    # 6. Clear notifications & notification preferences for students
    if "notification_preferences" in existing_tables:
        safe_delete(
            "DELETE FROM notification_preferences WHERE user_id IN (SELECT id FROM users WHERE LOWER(role)='student');"
        )
    if "notifications" in existing_tables:
        safe_delete(
            "DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE LOWER(role)='student');"
        )
        # Also remove any student-targeted notifications logged without user_id (matched via student email/gmail)
        if "students" in existing_tables:
            safe_delete(
                "DELETE FROM notifications WHERE recipient_email IN (SELECT email FROM students WHERE email IS NOT NULL) "
                "OR recipient_email IN (SELECT gmail FROM students WHERE gmail IS NOT NULL);"
            )

    # 7. Clear student locations
    if "locations" in existing_tables:
        safe_delete(
            "DELETE FROM locations WHERE user_id IN (SELECT id FROM users WHERE LOWER(role)='student');"
        )

    # 8. Clear unmatched student records
    if "unmatched_student_records" in existing_tables:
        safe_delete("DELETE FROM unmatched_student_records;")

    # 9. Clear student email OTPs
    if "email_otps" in existing_tables:
        safe_delete(
            "DELETE FROM email_otps WHERE email NOT IN (SELECT email FROM users WHERE LOWER(role)!='student' AND email IS NOT NULL);"
        )

    # 10. Delete all students
    if "students" in existing_tables:
        safe_delete("DELETE FROM students;")

    # 11. Delete all users where role = 'student'
    if "users" in existing_tables:
        safe_delete("DELETE FROM users WHERE LOWER(role) = 'student';")

    conn.commit()
    cur.execute("PRAGMA foreign_keys = ON;")
    cur.execute("VACUUM;")
    conn.commit()

    print("\n--- COUNTS AFTER REMOVAL ---")
    print(f"Students: {get_count('students')}")
    print(f"Users with role='student': {get_count('users', student_where)}")
    print(f"Total Users: {get_count('users')}")
    print(f"Staff (Admin/HOD/Teacher) Users: {get_count('users', staff_where)}")
    print(f"Marks: {get_count('marks')}")
    print(f"Attendance (attendances): {get_count('attendances')}")
    print(f"Student Attendance (student_attendance): {get_count('student_attendance')}")
    print(f"Student Activities: {get_count('student_activities')}")
    print(f"Student Faces: {get_count('student_faces')}")
    print(f"Student Biometrics: {get_count('student_biometrics')}")
    print(f"Student Bus Assignments: {get_count('student_bus_assignments')}")
    print(f"Event Registrations: {get_count('event_registrations')}")
    print(f"Unmatched Student Records: {get_count('unmatched_student_records')}")
    print(f"Email OTPs: {get_count('email_otps')}")
    print(f"Teachers: {get_count('teachers')}")
    print(f"Departments: {get_count('departments')}")
    print(f"Subjects: {get_count('subjects')}")
    print(f"Timetables: {get_count('timetables')}")
    print(f"Bus Routes: {get_count('bus_routes')}")

    # Print remaining non-student users
    if "users" in existing_tables:
        remaining = cur.execute("SELECT id, username, email, role, full_name FROM users").fetchall()
        print("\nRemaining Institutional Accounts:")
        for r in remaining:
            print(f" - [{(r[3] or '').upper()}] {r[4] or r[1]} ({r[2]})")

    conn.close()

if __name__ == "__main__":
    root_db = os.path.abspath("smart_department.db")
    backend_db = os.path.abspath("backend/smart_department.db")

    clean_database(root_db)
    clean_database(backend_db)
    print("\n[SUCCESS] All student data completely removed from both databases.")
