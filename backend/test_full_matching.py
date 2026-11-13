import sys
sys.path.insert(0, 'backend')
from app.database import SessionLocal
from app.models import Student
from inspect_excel import parse_xlsx
import re

db = SessionLocal()
# Get all 131 students from the DB (which were loaded from 5th_SEM_A_SEC and 5th_SEM_B_SEC PDFs)
pdf_students = db.query(Student).order_by(Student.section, Student.usn).all()
print(f"Total students in DB from PDFs: {len(pdf_students)}")

data, strings = parse_xlsx('5th_sem_students_list.xlsx')

# Build mapping of Excel rows
# In A-SEC and B-SEC:
# Col A: Sl.No, B: USN, C: Name, D: Phone, E: Father, F: Mother, G: Gmail
excel_records = [] # dicts: {'usn', 'name', 'phone', 'gmail', 'sheet', 'row_idx'}

for sheet in ['A-SEC', 'B-SEC']:
    for idx, r in enumerate(data.get(sheet, [])):
        cell_dict = {re.match(r'([A-Z]+)', pos).group(1): val for pos, val in r}
        usn = str(cell_dict.get('B') or '').strip()
        name = str(cell_dict.get('C') or '').strip()
        phone = str(cell_dict.get('D') or '').strip()
        gmail = str(cell_dict.get('G') or '').strip()
        
        if not name or name in ['Name', 'None'] or 'Department' in name or 'Maharaja' in name:
            continue
            
        excel_records.append({
            'usn': usn,
            'name': name,
            'phone': phone,
            'gmail': gmail,
            'sheet': sheet,
            'row_idx': idx + 1
        })

print(f"Total student rows in Excel A-SEC + B-SEC: {len(excel_records)}")

# Match PDF students to Excel records
matched_count = 0
unmatched_pdf = []
diploma_matched = []

for s in pdf_students:
    s_usn = s.usn.strip().upper()
    s_clean_name = re.sub(r'[^A-Z]', '', s.name.upper())
    
    # Try exact USN match
    found = None
    for ex in excel_records:
        if ex['usn'].strip().upper() == s_usn:
            found = ex
            break
            
    # If not found by USN, try matching by name
    if not found:
        for ex in excel_records:
            ex_clean_name = re.sub(r'[^A-Z]', '', ex['name'].upper())
            if s_clean_name == ex_clean_name or (len(s_clean_name) > 6 and (s_clean_name in ex_clean_name or ex_clean_name in s_clean_name)):
                found = ex
                if 'DIPLOMA' in ex['usn'].upper() or not ex['usn'].startswith('4MN'):
                    diploma_matched.append((s, ex))
                break
                
    if found:
        matched_count += 1
    else:
        unmatched_pdf.append(s)

print(f"\nPDF Students matched to Excel: {matched_count} / {len(pdf_students)}")
print(f"Diploma Students mapped from Name to USN: {len(diploma_matched)}")
for s, ex in diploma_matched:
    print(f"  DIPLOMA: Name='{s.name}' -> PDF USN='{s.usn}', Excel USN='{ex['usn']}', Gmail='{ex['gmail']}', Sec={s.section}")

print(f"\nUnmatched PDF Students (No Excel match): {len(unmatched_pdf)}")
for s in unmatched_pdf:
    print(f"  UNMATCHED: USN={s.usn}, Name='{s.name}', Sec={s.section}")

# Also check Excel rows that didn't match any PDF student
unmatched_excel = []
for ex in excel_records:
    ex_usn = ex['usn'].strip().upper()
    ex_clean_name = re.sub(r'[^A-Z]', '', ex['name'].upper())
    found_s = False
    for s in pdf_students:
        s_usn = s.usn.strip().upper()
        s_clean_name = re.sub(r'[^A-Z]', '', s.name.upper())
        if ex_usn == s_usn or ex_clean_name == s_clean_name or (len(ex_clean_name) > 6 and (ex_clean_name in s_clean_name or s_clean_name in ex_clean_name)):
            found_s = True
            break
    if not found_s:
        unmatched_excel.append(ex)

print(f"\nExcel Students not in PDF lists: {len(unmatched_excel)}")
for ex in unmatched_excel:
    print(f"  EXCEL EXTRA: USN='{ex['usn']}', Name='{ex['name']}', Gmail='{ex['gmail']}', Sheet={ex['sheet']}")

db.close()

