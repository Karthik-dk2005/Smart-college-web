import sys
sys.path.insert(0, 'backend')
from app.database import SessionLocal
from app.models import Student
from inspect_excel import parse_xlsx
import re

db = SessionLocal()
students_in_db = db.query(Student).all()
db_by_usn = {s.usn.upper(): s for s in students_in_db}
db_by_name = {re.sub(r'[^A-Z]', '', s.name.upper()): s for s in students_in_db}

data, strings = parse_xlsx('5th_sem_students_list.xlsx')

print(f"Total students in DB (from PDFs): {len(students_in_db)}")

# Let's see the 'caste' sheet in detail
caste_rows = data.get('caste', [])
print("\n--- Analysing 'caste' sheet ---")
for r in caste_rows[4:]:
    cell_dict = {re.match(r'([A-Z]+)', pos).group(1): val for pos, val in r}
    usn = str(cell_dict.get('B') or '').strip()
    name = str(cell_dict.get('C') or '').strip()
    phone = str(cell_dict.get('D') or '').strip()
    email = str(cell_dict.get('E') or '').strip()
    
    clean_n = re.sub(r'[^A-Z]', '', name.upper())
    s_by_u = db_by_usn.get(usn.upper())
    s_by_n = db_by_name.get(clean_n)
    
    if not s_by_u and not s_by_n:
        print(f"UNMATCHED IN CASTE: USN='{usn}', Name='{name}', Phone='{phone}', Email='{email}'")

print("\n--- Checking DB students that have NO email from either A-SEC, B-SEC, or caste ---")
# Build a master mapping of student -> email
email_map = {} # usn -> (email, source)

# First parse A-SEC and B-SEC
for sname in ['A-SEC', 'B-SEC']:
    for r in data.get(sname, []):
        cell_dict = {re.match(r'([A-Z]+)', pos).group(1): val for pos, val in r}
        usn = str(cell_dict.get('B') or '').strip()
        name = str(cell_dict.get('C') or '').strip()
        email = str(cell_dict.get('G') or '').strip()
        
        if not name or name in ['Name', 'None'] or 'Department' in name:
            continue
            
        clean_n = re.sub(r'[^A-Z]', '', name.upper())
        matched_s = db_by_usn.get(usn.upper()) or db_by_name.get(clean_n)
        if matched_s and email and '@' in email:
            email_map[matched_s.usn] = (email.strip().lower(), f"{sname} sheet")

# Then check caste
for r in caste_rows[4:]:
    cell_dict = {re.match(r'([A-Z]+)', pos).group(1): val for pos, val in r}
    usn = str(cell_dict.get('B') or '').strip()
    name = str(cell_dict.get('C') or '').strip()
    email = str(cell_dict.get('E') or '').strip()
    
    clean_n = re.sub(r'[^A-Z]', '', name.upper())
    matched_s = db_by_usn.get(usn.upper()) or db_by_name.get(clean_n)
    if matched_s and email and '@' in email and matched_s.usn not in email_map:
        email_map[matched_s.usn] = (email.strip().lower(), "caste sheet")

print(f"Total students matched with email: {len(email_map)} / {len(students_in_db)}")

unmatched_students = []
for s in students_in_db:
    if s.usn not in email_map:
        unmatched_students.append(s)
        print(f"NO EMAIL FOR DB STUDENT: USN={s.usn}, Name='{s.name}', Sec={s.section}")

db.close()

