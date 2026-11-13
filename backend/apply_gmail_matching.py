import sys
import os
import re
import zipfile
import xml.etree.ElementTree as ET

sys.path.insert(0, 'backend')
from app.database import engine, SessionLocal
from app.models import Student, User, Department
from inspect_excel import parse_xlsx

db = SessionLocal()
students = db.query(Student).all()
print(f"Total students in DB: {len(students)}")

data, _ = parse_xlsx('5th_sem_students_list.xlsx')

# Extract all records from Excel
# We map name -> list of records, and usn -> list of records
excel_by_usn = {}
excel_by_clean_name = {}

for sheet_name in ['A-SEC', 'B-SEC', 'caste']:
    rows = data.get(sheet_name, [])
    for idx, r in enumerate(rows):
        cell_dict = {re.match(r'([A-Z]+)', pos).group(1): val for pos, val in r}
        usn = str(cell_dict.get('B') or '').strip()
        name = str(cell_dict.get('C') or '').strip()
        phone = str(cell_dict.get('D') or '').strip()
        if sheet_name == 'caste':
            gmail = str(cell_dict.get('E') or '').strip()
        else:
            gmail = str(cell_dict.get('G') or '').strip()

        if not name or name in ['Name', 'None'] or 'Department' in name or 'Maharaja' in name:
            continue

        clean_n = re.sub(r'[^A-Z]', '', name.upper())
        rec = {'usn': usn, 'name': name, 'phone': phone, 'gmail': gmail, 'sheet': sheet_name}
        
        if usn.startswith('4MN'):
            excel_by_usn[usn.upper()] = rec
        if clean_n:
            excel_by_clean_name[clean_n] = rec

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
    'SHUBHA T V': '4MN25CS415',
}

matched_students = 0
missing_gmail_students = 0

for s in students:
    s_usn = s.usn.strip().upper()
    s_clean = re.sub(r'[^A-Z]', '', s.name.upper())
    
    gmail = None
    phone = None
    
    # Check USN match
    if s_usn in excel_by_usn:
        gmail = excel_by_usn[s_usn]['gmail']
        phone = excel_by_usn[s_usn]['phone']
    elif s_clean in excel_by_clean_name:
        gmail = excel_by_clean_name[s_clean]['gmail']
        phone = excel_by_clean_name[s_clean]['phone']
    else:
        # Check diploma names
        for d_name, d_usn in diploma_map.items():
            d_clean = re.sub(r'[^A-Z]', '', d_name.upper())
            if s_usn == d_usn or s_clean == d_clean:
                if d_clean in excel_by_clean_name:
                    gmail = excel_by_clean_name[d_clean]['gmail']
                    phone = excel_by_clean_name[d_clean]['phone']
                break

    if gmail and '@' in gmail:
        s.gmail = gmail.strip().lower()
        if phone:
            s.phone = phone.strip()
        s.is_flagged_for_admin = 0
        s.admin_flag_reason = None
        matched_students += 1
    else:
        s.is_flagged_for_admin = 1
        s.admin_flag_reason = "Missing Gmail address in student roster"
        missing_gmail_students += 1
        print(f"Missing Gmail: {s.usn} | {s.name} | Sec {s.section}")

db.commit()
print(f"\nFinal DB Sync Result:")
print(f"Total Students: {len(students)}")
print(f"Students with Verified Matched Gmail: {matched_students}")
print(f"Students Flagged (Missing Gmail): {missing_gmail_students}")

db.close()

