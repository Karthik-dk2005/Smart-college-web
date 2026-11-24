import sqlite3
import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.utils.security import get_password_hash

def seed_common_auth(db_path):
    if not os.path.exists(db_path):
        return
    print(f"[*] Seeding auth credentials into {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    pwd_hash = get_password_hash("password123")
    student_pwd_hash = get_password_hash("password123")

    # 1. Ensure Admin accounts
    admin_accounts = [
        ("System Administrator", "admin", "admin@campus.edu", pwd_hash, "admin", "Approved", 1),
        ("MITT Admin", "admin_gmail", "admin@gmail.com", pwd_hash, "admin", "Approved", 1),
    ]
    for full_name, username, email, p_hash, role, status, is_act in admin_accounts:
        cur.execute("SELECT id FROM users WHERE lower(email) = lower(?)", (email,))
        row = cur.fetchone()
        if not row:
            cur.execute("""
                INSERT INTO users (full_name, name, username, email, password_hash, role, account_status, is_active, department_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
            """, (full_name, full_name, username, email, p_hash, role, status, is_act))
            print(f"  [+] Added admin: {email}")
        else:
            cur.execute("UPDATE users SET password_hash = ?, is_active = 1, account_status = 'Approved' WHERE id = ?", (p_hash, row[0]))

    # 2. Ensure HOD accounts
    hod_accounts = [
        ("Dr. Ranjit K.N", "hod.cse", "hod.cse@campus.edu", pwd_hash, "hod", "Approved", 1),
        ("Dr. Ranjit K.N", "hod_gmail", "hod.cse@gmail.com", pwd_hash, "hod", "Approved", 1),
    ]
    for full_name, username, email, p_hash, role, status, is_act in hod_accounts:
        cur.execute("SELECT id FROM users WHERE lower(email) = lower(?)", (email,))
        row = cur.fetchone()
        if not row:
            cur.execute("""
                INSERT INTO users (full_name, name, username, email, password_hash, role, account_status, is_active, department_id, designation, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'Professor & Head of Department', datetime('now'), datetime('now'))
            """, (full_name, full_name, username, email, p_hash, role, status, is_act))
            print(f"  [+] Added HOD: {email}")
        else:
            cur.execute("UPDATE users SET password_hash = ?, is_active = 1, account_status = 'Approved' WHERE id = ?", (p_hash, row[0]))

    # 3. Ensure Teacher accounts
    teacher_accounts = [
        ("Prof. Ananya Iyer", "ananya.iyer", "ananya.iyer@faculty.campus.edu", pwd_hash, "teacher", "FAC-CSE-001", "Approved", 1),
        ("Dr. Rajesh Kumar", "rajesh.kumar", "rajesh.kumar@faculty.campus.edu", pwd_hash, "teacher", "FAC-CSE-002", "Approved", 1),
        ("Dr. Rajesh Kumar", "teacher_gmail", "test.teacher.fac002@gmail.com", pwd_hash, "teacher", "FAC-CSE-002", "Approved", 1),
        ("Prof. Teacher CSE", "teacher_cse_gmail", "teacher@gmail.com", pwd_hash, "teacher", "FAC-CSE-003", "Approved", 1),
    ]
    for full_name, username, email, p_hash, role, emp_id, status, is_act in teacher_accounts:
        cur.execute("SELECT id FROM users WHERE lower(email) = lower(?)", (email,))
        row = cur.fetchone()
        if not row:
            cur.execute("""
                INSERT INTO users (full_name, name, username, email, password_hash, role, usn_or_employee_id, account_status, is_active, department_id, designation, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Assistant Professor', datetime('now'), datetime('now'))
            """, (full_name, full_name, username, email, p_hash, role, emp_id, status, is_act))
            print(f"  [+] Added Teacher: {email}")
        else:
            cur.execute("UPDATE users SET password_hash = ?, is_active = 1, account_status = 'Approved' WHERE id = ?", (p_hash, row[0]))

    # 4. Ensure an Inactive/Suspended account for testing rejection
    cur.execute("SELECT id FROM users WHERE email = 'inactive.teacher@gmail.com'")
    if not cur.fetchone():
        cur.execute("""
            INSERT INTO users (full_name, name, username, email, password_hash, role, account_status, is_active, department_id, created_at, updated_at)
            VALUES ('Inactive Teacher', 'Inactive Teacher', 'inactive_teacher', 'inactive.teacher@gmail.com', ?, 'teacher', 'Suspended', 0, 1, datetime('now'), datetime('now'))
        """, (pwd_hash,))
        print("  [+] Added Suspended Teacher: inactive.teacher@gmail.com")

    # 5. Ensure Student accounts for testing
    # 4MN24CS002 - ABHILASH KUMAR K
    # 4MN24CS003 - AHMED NABEEL
    students_to_register = [
        ("4MN24CS002", "ABHILASH KUMAR K", "student_4mn24cs002@gmail.com", student_pwd_hash, 5, "A"),
        ("4MN24CS003", "AHMED NABEEL", "4mn24cs003@college.edu", student_pwd_hash, 5, "A"),
    ]
    for usn, name, gmail, s_hash, sem, sec in students_to_register:
        # Update or check student table
        cur.execute("SELECT id FROM students WHERE upper(usn) = upper(?)", (usn,))
        s_row = cur.fetchone()
        if s_row:
            s_id = s_row[0]
            cur.execute("""
                UPDATE students
                SET registration_status = 'Registered',
                    email_verification_status = 'Verified',
                    password_hash = ?,
                    gmail = ?,
                    registered_at = datetime('now')
                WHERE id = ?
            """, (s_hash, gmail, s_id))
        else:
            cur.execute("""
                INSERT INTO students (usn, name, email, gmail, semester, section, department_id, registration_status, email_verification_status, password_hash, registered_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, 'Registered', 'Verified', ?, datetime('now'))
            """, (usn, name, gmail, gmail, sem, sec, s_hash))
            s_id = cur.lastrowid

        # Also link user record
        cur.execute("SELECT id FROM users WHERE upper(usn_or_employee_id) = upper(?)", (usn,))
        u_row = cur.fetchone()
        if not u_row:
            cur.execute("""
                INSERT INTO users (full_name, name, username, email, password_hash, role, usn_or_employee_id, semester, section, department_id, account_status, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, 1, 'Approved', 1, datetime('now'), datetime('now'))
            """, (name, name, usn.lower(), gmail, s_hash, usn, sem, sec))
            user_id = cur.lastrowid
        else:
            user_id = u_row[0]
            cur.execute("UPDATE users SET password_hash = ?, is_active = 1, account_status = 'Approved', email = ? WHERE id = ?", (s_hash, gmail, user_id))

        cur.execute("UPDATE students SET user_id = ? WHERE id = ?", (user_id, s_id))
        print(f"  [+] Registered Student {usn} ({name}) with user_id {user_id}")

    conn.commit()
    conn.close()
    print(f"[OK] {db_path} synced successfully.")

if __name__ == "__main__":
    seed_common_auth("smart_department.db")
    seed_common_auth("backend/smart_department.db")
