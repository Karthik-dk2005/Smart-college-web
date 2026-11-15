import os
import sys
import sqlite3
from collections import Counter

# Ensure backend is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import create_dev_tables, SessionLocal, engine
from app.models.student import Student
from app.models.department import Department

diploma_map = {
    'ADARSH D C': '4MN25CS400',
    'AKASH J': '4MN25CS401',
    'AKASH K': '4MN25CS402',
    'ANKITHA C': '4MN25CS403',
    'CHANDRA SHEKHAR A': '4MN25CS404',
    'CHETHAN A J': '4MN25CS405',
    'DHANUSH N P': '4MN25CS406',
    'DHANUSHREE D': '4MN25CS407',
    'DILEEP Y P': '4MN25CS408',
    'GANESHA S': '4MN25CS409',
    'KARTHIKA D K': '4MN25CS410',
    'NAVEEN KSHEERASAGAR': '4MN25CS411',
    'PRAJWAL D': '4MN25CS412',
    'PRATEESHA': '4MN25CS413',
    'SANKETH M B': '4MN25CS414',
    'SHUBHA T V': '4MN25CS415'
}

def parse_csv_data():
    raw_path = os.path.join(os.path.dirname(__file__), "student_data_raw.csv")
    with open(raw_path, encoding='utf-8') as f:
        text = f.read()

    parts = text.split('Maharaja Institute of Technology Thandavapura')

    def parse_part(part_text, section_letter):
        students = []
        for line in part_text.splitlines():
            row = [c.strip() for c in line.split(',')]
            if len(row) >= 3 and row[0].isdigit():
                sl = int(row[0])
                raw_usn = row[1].upper()
                raw_name = ' '.join(row[2].split()).upper()
                student_num = row[3] if len(row) > 3 and row[3] not in ('-', '') else None
                father_num = row[4] if len(row) > 4 and row[4] not in ('-', '') else None
                mother_num = row[5] if len(row) > 5 and row[5] not in ('-', '') else None
                gmail = row[6].strip().lower() if len(row) > 6 and '@' in row[6] else None

                final_usn = raw_usn
                if 'DIPLOMA' in raw_usn:
                    final_usn = diploma_map.get(raw_name, raw_usn)

                students.append({
                    'sl_no': sl,
                    'usn': final_usn,
                    'name': raw_name,
                    'section': section_letter,
                    'semester': 5,
                    'phone': student_num,
                    'father_phone': father_num,
                    'mother_phone': mother_num,
                    'gmail': gmail,
                    'email': gmail or f"{final_usn.lower()}@college.edu"
                })
        return students

    sec_a = parse_part(parts[1], 'A')
    sec_b = parse_part(parts[2], 'B')
    return sec_a, sec_b


def run_import():
    print("=" * 60)
    print("IMPORTING OFFICIAL 5TH SEMESTER STUDENTS")
    print("=" * 60)

    # 1. Ensure schema includes new columns
    create_dev_tables()

    sec_a, sec_b = parse_csv_data()
    all_students = sec_a + sec_b
    print(f"[*] Parsed Section A: {len(sec_a)} students")
    print(f"[*] Parsed Section B: {len(sec_b)} students")
    print(f"[*] Total parsed: {len(all_students)} students")

    # Check USN uniqueness
    usn_counts = Counter([s['usn'] for s in all_students])
    duplicates = [u for u, c in usn_counts.items() if c > 1]
    if duplicates:
        raise ValueError(f"Duplicate USNs detected in parsed data: {duplicates}")

    db = SessionLocal()
    try:
        # Find or create department 1 (CSE)
        dept = db.query(Department).first()
        dept_id = dept.id if dept else 1

        # Clear existing students first
        print("[*] Clearing existing student rows...")
        db.query(Student).delete()
        db.commit()

        # Insert new students
        inserted = 0
        for s in all_students:
            new_student = Student(
                usn=s['usn'],
                student_id=s['usn'],
                name=s['name'],
                email=s['email'],
                gmail=s['gmail'],
                phone=s['phone'],
                father_phone=s['father_phone'],
                mother_phone=s['mother_phone'],
                semester=5,
                section=s['section'],
                department_id=dept_id,
                admission_year=2024,
                username=s['usn'].lower(),
                status="active",
                registration_status="Unregistered",
                email_verification_status="Unverified"
            )
            db.add(new_student)
            inserted += 1

        db.commit()
        print(f"[+] Successfully inserted {inserted} 5th Semester students into database!")

        # Verify counts in DB
        db_count_a = db.query(Student).filter(Student.section == 'A').count()
        db_count_b = db.query(Student).filter(Student.section == 'B').count()
        db_total = db.query(Student).count()
        print(f"[✓] Database verification:")
        print(f"    - Section A: {db_count_a} students")
        print(f"    - Section B: {db_count_b} students")
        print(f"    - Total 5th Sem Students: {db_total} students")

        # Sync to root database file if working with backend/smart_department.db
        root_db = os.path.abspath("smart_department.db")
        backend_db = os.path.abspath("backend/smart_department.db")
        import shutil
        if os.path.exists(backend_db) and os.path.exists(root_db):
            if os.path.getmtime(backend_db) > os.path.getmtime(root_db):
                shutil.copy2(backend_db, root_db)
                print("[*] Synced backend DB to root DB")
            else:
                shutil.copy2(root_db, backend_db)
                print("[*] Synced root DB to backend DB")

    finally:
        db.close()

if __name__ == "__main__":
    run_import()
