import sqlite3
import os

db_paths = [
    os.path.join(os.path.dirname(__file__), "smart_department.db"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "smart_department.db"),
]

for db_path in db_paths:
    if not os.path.exists(db_path):
        continue
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(users)")
    cols = [r[1] for r in cur.fetchall()]

    columns_to_add = [
        ("full_name", "VARCHAR(255)"),
        ("username", "VARCHAR(100)"),
        ("mobile_number", "VARCHAR(50)"),
        ("usn_or_employee_id", "VARCHAR(100)"),
        ("designation", "VARCHAR(100)"),
        ("account_status", "VARCHAR(50) DEFAULT 'Approved'"),
        ("reset_token", "VARCHAR(255)"),
        ("reset_token_expires_at", "DATETIME")
    ]

    for col_name, col_type in columns_to_add:
        if col_name not in cols:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} to {db_path}")

    # Backfill full_name
    cur.execute("UPDATE users SET full_name = name WHERE full_name IS NULL")
    # Backfill mobile_number
    cur.execute("UPDATE users SET mobile_number = phone WHERE mobile_number IS NULL")
    # Backfill account_status
    cur.execute("UPDATE users SET account_status = 'Approved' WHERE account_status IS NULL")

    # Backfill username from email prefix
    cur.execute("SELECT id, email FROM users WHERE username IS NULL")
    for uid, email in cur.fetchall():
        uname = email.split("@")[0].lower()
        cur.execute("SELECT id FROM users WHERE username = ? AND id != ?", (uname, uid))
        if cur.fetchone():
            uname = f"{uname}_{uid}"
        cur.execute("UPDATE users SET username = ? WHERE id = ?", (uname, uid))

    # Backfill usn_or_employee_id from students or faculty
    cur.execute("""
        UPDATE users
        SET usn_or_employee_id = (
            SELECT usn FROM students WHERE students.user_id = users.id LIMIT 1
        )
        WHERE usn_or_employee_id IS NULL AND role = 'student'
    """)
    cur.execute("""
        UPDATE users
        SET usn_or_employee_id = (
            SELECT employee_id FROM faculty WHERE faculty.user_id = users.id LIMIT 1
        )
        WHERE usn_or_employee_id IS NULL AND role IN ('teacher', 'faculty', 'hod')
    """)

    conn.commit()
    conn.close()
    print(f"Successfully migrated {db_path}")

