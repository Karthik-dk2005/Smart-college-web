import sqlite3

def check_db(path):
    print("=== Checking DB:", path)
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(id), COUNT(password_hash), COUNT(CASE WHEN registration_status='Registered' THEN 1 END) FROM students")
    print("Students count / with pwd / registered:", cur.fetchone())
    cur.execute("SELECT usn, name, gmail, registration_status, password_hash IS NOT NULL FROM students WHERE registration_status='Registered' LIMIT 5")
    print("Sample registered students:", cur.fetchall())
    cur.execute("SELECT id, full_name, email, role, is_active, account_status FROM users WHERE role IN ('admin', 'hod', 'teacher')")
    print("Staff users:", cur.fetchall())
    conn.close()

if __name__ == "__main__":
    check_db("smart_department.db")
    check_db("backend/smart_department.db")
