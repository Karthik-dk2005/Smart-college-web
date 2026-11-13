import sys
sys.path.insert(0, 'backend')
from app.database import SessionLocal
from app.models import Student
from inspect_excel import parse_xlsx
import re

db = SessionLocal()
students_in_db = db.query(Student).all()
db_by_usn = {s.usn.upper(): s for s in students_in_db}
db_by_name = {s.name.strip().upper(): s for s in students_in_db}
print(f"Total students in DB: {len(students_in_db)}")

data, strings = parse_xlsx('5th_sem_students_list.xlsx')

for sheet_name in ['A-SEC', 'B-SEC', 'caste']:
    print(f"\n=================== Sheet: {sheet_name} ===================")
    rows = data.get(sheet_name, [])
    diploma_rows = []
    missing_email = []
    matched = 0
    total_valid = 0
    
    for r in rows:
        # map cell coordinates to columns
        # cell coordinates like 'A6', 'B6', etc.
        cell_dict = {}
        for pos, val in r:
            col_letter = re.match(r'([A-Z]+)', pos).group(1)
            cell_dict[col_letter] = val
        
        # Check if this row is a student row (has Sl.No or USN or Name)
        usn_val = str(cell_dict.get('B') or '').strip()
        name_val = str(cell_dict.get('C') or '').strip()
        
        # In sheet 'caste', column layout:
        # A: Sl.No, B: USN, C: Name, D: Student Number, E: Gmail
        # In 'A-SEC' and 'B-SEC':
        # A: Sl.No, B: USN, C: Name, D: Student Number, E: Father, F: Mother, G: Gmail
        if sheet_name == 'caste':
            gmail_val = str(cell_dict.get('E') or '').strip()
        else:
            gmail_val = str(cell_dict.get('G') or '').strip()
            
        if not name_val or name_val in ['Name', 'None'] or 'Department' in name_val:
            continue
            
        total_valid += 1
        is_diploma = 'DIPLOMA' in usn_val.upper() or not usn_val.startswith('4MN')
        
        # Try matching by USN first
        matched_student = None
        if not is_diploma and usn_val.upper() in db_by_usn:
            matched_student = db_by_usn[usn_val.upper()]
        elif name_val.upper() in db_by_name:
            matched_student = db_by_name[name_val.upper()]
        else:
            # Try fuzzy match name
            clean_name = re.sub(r'[^A-Z]', '', name_val.upper())
            for s in students_in_db:
                s_clean = re.sub(r'[^A-Z]', '', s.name.upper())
                if clean_name == s_clean or (len(clean_name) > 5 and clean_name in s_clean) or (len(s_clean) > 5 and s_clean in clean_name):
                    matched_student = s
                    break

        if is_diploma:
            diploma_rows.append((usn_val, name_val, gmail_val, matched_student.usn if matched_student else 'NO MATCH'))
        
        if not gmail_val or '@' not in gmail_val:
            missing_email.append((usn_val, name_val))
            
        if matched_student:
            matched += 1

    print(f"Total student entries: {total_valid}")
    print(f"Matched with DB: {matched}")
    print(f"Diploma entries: {len(diploma_rows)}")
    for d in diploma_rows:
        print(f"  DIPLOMA row: Excel USN='{d[0]}', Name='{d[1]}', Gmail='{d[2]}', Matched DB USN='{d[3]}'")
    print(f"Missing Email entries: {len(missing_email)}")
    for m in missing_email[:5]:
        print(f"  Missing Email: USN='{m[0]}', Name='{m[1]}'")

db.close()

