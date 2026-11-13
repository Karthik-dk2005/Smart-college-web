import sqlite3
import os

DB_PATHS = [
    os.path.abspath("backend/smart_department.db"),
    os.path.abspath("smart_department.db")
]

def remove_student_data(db_path):
    if not os.path.exists(db_path):
        print(f"File not found: {db_path}")
        return

    print(f"\n========================================================")
    print(f"Processing Database: {db_path}")
    print(f"========================================================")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    try:
        cur.execute("PRAGMA foreign_keys = OFF;")

        # Gather before counts
        tables_to_clear = [
            ("marks", "DELETE FROM marks;"),
            ("student_activities", "DELETE FROM student_activities;"),
            ("student_attendance", "DELETE FROM student_attendance;"),
            ("attendance", "DELETE FROM attendance;"),
            ("attendances", "DELETE FROM attendances;"),
            ("student_faces", "DELETE FROM student_faces;"),
            ("student_biometrics", "DELETE FROM student_biometrics;"),
            ("student_bus_assignments", "DELETE FROM student_bus_assignments;"),
            ("event_registrations (students)", "DELETE FROM event_registrations WHERE student_id IS NOT NULL OR user_id IN (SELECT id FROM users WHERE role='student');"),
            ("students", "DELETE FROM students;"),
            ("users (role='student')", "DELETE FROM users WHERE role='student';"),
        ]

        print("[BEFORE COUNTS]")
        for label, _ in tables_to_clear:
            if "event_registrations" in label:
                cur.execute("SELECT count(*) FROM event_registrations WHERE student_id IS NOT NULL OR user_id IN (SELECT id FROM users WHERE role='student');")
            elif "users" in label:
                cur.execute("SELECT count(*) FROM users WHERE role='student';")
            else:
                tbl = label.split()[0]
                cur.execute(f"SELECT count(*) FROM {tbl};")
            print(f" - {label}: {cur.fetchone()[0]}")

        # Perform deletions
        for label, sql in tables_to_clear:
            cur.execute(sql)
            print(f"  ✓ Cleared {label}")

        conn.commit()

        # Vacuum database to reclaim space
        cur.execute("VACUUM;")
        conn.commit()

        print("\n[AFTER COUNTS]")
        for label, _ in tables_to_clear:
            if "event_registrations" in label:
                cur.execute("SELECT count(*) FROM event_registrations WHERE student_id IS NOT NULL OR user_id IN (SELECT id FROM users WHERE role='student');")
            elif "users" in label:
                cur.execute("SELECT count(*) FROM users WHERE role='student';")
            else:
                tbl = label.split()[0]
                cur.execute(f"SELECT count(*) FROM {tbl};")
            print(f" - {label}: {cur.fetchone()[0]}")

        # Non-student user counts preserved
        cur.execute("SELECT count(*) FROM users;")
        total_remaining_users = cur.fetchone()[0]
        cur.execute("SELECT role, count(*) FROM users GROUP BY role;")
        role_counts = cur.fetchall()
        print(f"\nRemaining User Accounts ({total_remaining_users} total):")
        for r, cnt in role_counts:
            print(f" - Role '{r}': {cnt}")

        cur.execute("SELECT count(*) FROM departments;")
        print(f"Departments preserved: {cur.fetchone()[0]}")

        cur.execute("SELECT count(*) FROM teachers;")
        print(f"Teachers preserved: {cur.fetchone()[0]}")

        cur.execute("SELECT count(*) FROM subjects;")
        print(f"Subjects preserved: {cur.fetchone()[0]}")

    finally:
        conn.close()

if __name__ == "__main__":
    for p in DB_PATHS:
        remove_student_data(p)
    print("\n✓ ALL STUDENT DATA REMOVED SUCCESSFULLY ACROSS ALL DATABASES.")

