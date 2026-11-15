import sqlite3
import os

def migrate_db(db_path):
    if not os.path.exists(db_path):
        return
    print(f"[*] Migrating notifications schema for {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("PRAGMA table_info(notifications)")
    existing_cols = [c[1] for c in cur.fetchall()]

    new_cols = [
        ("recipient_email", "VARCHAR(255)"),
        ("delivery_status", "VARCHAR(50) DEFAULT 'pending'"),
        ("notification_type", "VARCHAR(50) DEFAULT 'general'"),
        ("error_log", "TEXT"),
        ("sent_at", "DATETIME"),
    ]

    for col_name, col_def in new_cols:
        if col_name not in existing_cols:
            cur.execute(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_def}")
            print(f"  [+] Added column '{col_name}' to notifications table")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS notification_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            email_attendance BOOLEAN DEFAULT 1,
            email_marks BOOLEAN DEFAULT 1,
            email_timetable BOOLEAN DEFAULT 1,
            email_announcements BOOLEAN DEFAULT 1,
            email_events BOOLEAN DEFAULT 1,
            email_system BOOLEAN DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    conn.commit()
    conn.close()
    print(f"[OK] Migration completed for {db_path}\n")

if __name__ == "__main__":
    migrate_db("smart_department.db")
    migrate_db("backend/smart_department.db")
