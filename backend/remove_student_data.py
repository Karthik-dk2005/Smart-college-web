import sys
import os
import sqlite3

def clean_database(db_path):
    print(f"\n==================================================")
    print(f"Cleaning student data from: {db_path}")
    print(f"==================================================")
    
    if not os.path.exists(db_path):
        print(f"[!] Database file does not exist: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Pre-clean counts
    def get_count(table, where=""):
        try:
            query = f"SELECT count(*) FROM {table} {where}"
            return cur.execute(query).fetchone()[0]
        except Exception:
            return 0

    print("--- COUNTS BEFORE REMOVAL ---")
    print(f"Students: {get_count('students')}")
    print(f"Users with role='student': {get_count('users', \"WHERE role='student'\")}")
    print(f"Total Users: {get_count('users')}")
    print(f"Teachers/Admin/HOD Users: {get_count('users', \"WHERE role!='student'\")}")
    print(f"Marks: {get_count('marks')}")
    print(f"Student Activity Files: {get_count('student_activity_files')}")
    print(f"Student Activity Verifications: {get_count('student_activity_verifications')}")
    print(f"Student Activities: {get_count('student_activities')}")
    print(f"Event Registrations: {get_count('event_registrations')}")
    print(f"Unmatched Student Records: {get_count('unmatched_student_records')}")
    print(f"Email OTPs: {get_count('email_otps')}")

    # Foreign key checks disable temporarily for clean cascade deletion
    cur.execute("PRAGMA foreign_keys = OFF;")

    # 1. Clear marks
    cur.execute("DELETE FROM marks;")

    # 2. Clear student activities & related
    cur.execute("DELETE FROM student_activity_files;")
    cur.execute("DELETE FROM student_activity_verifications;")
    cur.execute("DELETE FROM student_activities;")

    # 3. Clear student biometric/face/bus assignments
    cur.execute("DELETE FROM student_faces;")
    cur.execute("DELETE FROM student_biometrics;")
    cur.execute("DELETE FROM student_bus_assignments;")

    # 4. Clear student attendance
    cur.execute("DELETE FROM student_attendance;")
    cur.execute("DELETE FROM attendances;")
    try:
        cur.execute("DELETE FROM attendance;")
    except Exception:
        pass

    # 5. Clear event registrations for students
    cur.execute("DELETE FROM event_registrations;")

    # 6. Clear notifications for students
    cur.execute("DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE role='student');")

    # 7. Clear student locations
    cur.execute("DELETE FROM locations WHERE user_id IN (SELECT id FROM users WHERE role='student');")

    # 8. Clear unmatched student records
    cur.execute("DELETE FROM unmatched_student_records;")

    # 9. Clear student email OTPs
    cur.execute("DELETE FROM email_otps WHERE email NOT IN (SELECT email FROM users WHERE role!='student');")

    # 10. Delete all students
    cur.execute("DELETE FROM students;")

    # 11. Delete all users where role = 'student'
    cur.execute("DELETE FROM users WHERE role = 'student';")

    conn.commit()
    cur.execute("PRAGMA foreign_keys = ON;")
    cur.execute("VACUUM;")
    conn.commit()

    print("\n--- COUNTS AFTER REMOVAL ---")
    print(f"Students: {get_count('students')}")
    print(f"Users with role='student': {get_count('users', \"WHERE role='student'\")}")
    print(f"Total Users: {get_count('users')}")
    print(f"Teachers/Admin/HOD Users: {get_count('users', \"WHERE role!='student'\")}")
    print(f"Marks: {get_count('marks')}")
    print(f"Student Activity Files: {get_count('student_activity_files')}")
    print(f"Student Activities: {get_count('student_activities')}")
    print(f"Event Registrations: {get_count('event_registrations')}")
    print(f"Unmatched Student Records: {get_count('unmatched_student_records')}")
    print(f"Email OTPs: {get_count('email_otps')}")
    print(f"Teachers: {get_count('teachers')}")
    print(f"Departments: {get_count('departments')}")
    print(f"Subjects: {get_count('subjects')}")
    print(f"Timetables: {get_count('timetables')}")
    print(f"Bus Routes: {get_count('bus_routes')}")

    # Print remaining non-student users
    remaining = cur.execute("SELECT id, username, email, role, full_name FROM users").fetchall()
    print("\nRemaining Institutional Accounts:")
    for r in remaining:
        print(f" - [{r[3].upper()}] {r[4] or r[1]} ({r[2]})")

    conn.close()

if __name__ == "__main__":
    root_db = os.path.abspath("smart_department.db")
    backend_db = os.path.abspath("backend/smart_department.db")
    
    clean_database(root_db)
    clean_database(backend_db)
    print("\n[SUCCESS] Student data completely removed from both databases.")
