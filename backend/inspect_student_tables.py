import sqlite3
import os

for db_path in ['backend/smart_department.db', 'smart_department.db']:
    if not os.path.exists(db_path):
        continue
    print(f"\n--- Checking {db_path} ---")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cur.fetchall()]
    
    for t in tables:
        cur.execute(f"PRAGMA table_info({t});")
        cols = [c[1] for c in cur.fetchall()]
        has_student = any("student" in c.lower() or "usn" in c.lower() for c in cols) or t.lower() in ["students", "marks", "student_attendance", "student_activities", "student_bus_registrations"]
        if has_student:
            cur.execute(f"SELECT count(*) FROM {t};")
            cnt = cur.fetchone()[0]
            print(f"Table '{t}': {cnt} rows | Cols: {cols}")
    
    # Check users with role student
    cur.execute("SELECT count(*) FROM users WHERE role='student';")
    print(f"Users with role='student': {cur.fetchone()[0]}")
    conn.close()

