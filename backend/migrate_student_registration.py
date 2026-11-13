import sys
import os
import re
import datetime
import zipfile
import xml.etree.ElementTree as ET
from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from app.database import engine, SessionLocal
from app.models import Student, User, Department

def parse_xlsx(file_path):
    with zipfile.ZipFile(file_path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text_elems = si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                shared_strings.append("".join([t.text or "" for t in text_elems]))

        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')
        sheet_info = [(s.attrib.get('name'), s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')) for s in sheets]

        rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rels = {r.attrib.get('Id'): r.attrib.get('Target') for r in rels_tree.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship')}

        results = {}
        for name, rId in sheet_info:
            target = rels.get(rId)
            sheet_path = 'xl/' + target if not target.startswith(('xl/', '/')) else (target[1:] if target.startswith('/') else target)
            sheet_tree = ET.fromstring(z.read(sheet_path))
            rows_data = []
            for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                row_cells = []
                for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    cell_type = c.attrib.get('t')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = v.text if v is not None else None
                    if cell_type == 's' and val is not None:
                        val = shared_strings[int(val)]
                    row_cells.append((c.attrib.get('r'), val))
                rows_data.append(row_cells)
            results[name] = rows_data
    return results

def add_columns_if_missing():
    print("Checking and applying database column migrations...")
    with engine.connect() as conn:
        # Check current columns in students table
        cols_res = conn.execute(text("PRAGMA table_info(students)")).fetchall()
        existing_cols = {c[1] for c in cols_res}
        
        columns_to_add = [
            ("gmail", "VARCHAR(255)"),
            ("registration_status", "VARCHAR(50) DEFAULT 'Unregistered'"),
            ("email_verification_status", "VARCHAR(50) DEFAULT 'Unverified'"),
            ("is_flagged_for_admin", "INTEGER DEFAULT 0"),
            ("admin_flag_reason", "VARCHAR(255)"),
            ("otp_code", "VARCHAR(10)"),
            ("otp_expires_at", "DATETIME"),
            ("otp_resend_count", "INTEGER DEFAULT 0"),
            ("otp_last_sent_at", "DATETIME"),
            ("registered_at", "DATETIME"),
        ]
        
        for col_name, col_def in columns_to_add:
            if col_name not in existing_cols:
                print(f"Adding column '{col_name}' to students table...")
                conn.execute(text(f"ALTER TABLE students ADD COLUMN {col_name} {col_def}"))
                conn.commit()

def run_migration_and_matching(excel_path='5th_sem_students_list.xlsx'):
    add_columns_if_missing()
    
    db = SessionLocal()
    try:
        # Load all students currently in DB
        db_students = db.query(Student).all()
        db_by_usn = {s.usn.strip().upper(): s for s in db_students}
        
        # Build normalized name map for matching
        db_by_clean_name = {}
        for s in db_students:
            clean_n = re.sub(r'[^A-Z]', '', s.name.upper())
            db_by_clean_name[clean_n] = s

        print(f"Loaded {len(db_students)} existing students from database.")

        if not os.path.exists(excel_path):
            alt_path = os.path.join(os.path.dirname(__file__), '..', excel_path)
            if os.path.exists(alt_path):
                excel_path = alt_path
            else:
                print(f"Error: {excel_path} not found!")
                return

        print(f"Parsing Excel file: {excel_path}")
        sheets_data = parse_xlsx(excel_path)

        excel_rows = []
        for sheet_name in ['A-SEC', 'B-SEC', 'caste']:
            rows = sheets_data.get(sheet_name, [])
            for r in rows:
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

                excel_rows.append({
                    'sheet': sheet_name,
                    'usn': usn,
                    'name': name,
                    'phone': phone,
                    'gmail': gmail
                })

        print(f"Extracted {len(excel_rows)} student rows across sheets in Excel.")

        matched_count = 0
        diploma_count = 0
        flagged_count = 0

        # Known diploma mappings from name in Excel to PDF USN
        diploma_name_to_usn = {
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

        # First pass: map Excel rows to DB students
        matched_db_ids = set()

        for ex in excel_rows:
            usn_val = ex['usn'].strip().upper()
            name_val = ex['name'].strip()
            gmail_val = ex['gmail'].strip().lower() if ex['gmail'] else None
            is_diploma = 'DIPLOMA' in usn_val or not usn_val.startswith('4MN')
            clean_name = re.sub(r'[^A-Z]', '', name_val.upper())

            target_student = None

            if not is_diploma and usn_val in db_by_usn:
                target_student = db_by_usn[usn_val]
            elif is_diploma:
                # Check diploma mapping
                for d_name, d_usn in diploma_name_to_usn.items():
                    d_clean = re.sub(r'[^A-Z]', '', d_name.upper())
                    if clean_name == d_clean or clean_name in d_clean or d_clean in clean_name:
                        target_student = db_by_usn.get(d_usn)
                        if target_student:
                            diploma_count += 1
                            break
            
            # Fallback to name matching if not found
            if not target_student:
                if clean_name in db_by_clean_name:
                    target_student = db_by_clean_name[clean_name]
                else:
                    for s_clean, s in db_by_clean_name.items():
                        if len(clean_name) > 6 and (clean_name in s_clean or s_clean in clean_name):
                            target_student = s
                            break

            if target_student:
                matched_db_ids.add(target_student.id)
                if gmail_val and '@' in gmail_val:
                    target_student.gmail = gmail_val
                    target_student.email = gmail_val
                    if ex['phone']:
                        target_student.phone = ex['phone']
                    # Link to user email if exists
                    if target_student.user:
                        target_student.user.email = gmail_val

        # Second pass: check every DB student for missing Gmail and flag accordingly
        for s in db_students:
            if not s.gmail or '@' not in s.gmail:
                s.is_flagged_for_admin = 1
                s.admin_flag_reason = "Missing Gmail address in student roster"
                flagged_count += 1
                print(f"  Flagged (Missing Gmail): USN={s.usn}, Name='{s.name}', Sec={s.section}")
            else:
                s.is_flagged_for_admin = 0
                s.admin_flag_reason = None
                matched_count += 1

        # Check for unmatched Excel entries (e.g. SANKETH M B, NEHA JOSE J, etc.)
        # If SANKETH M B is not in DB, create a flagged student record for Admin review!
        dept = db.query(Department).first()
        dept_id = dept.id if dept else 1

        for ex in excel_rows:
            usn_val = ex['usn'].strip().upper()
            name_val = ex['name'].strip()
            gmail_val = ex['gmail'].strip().lower() if ex['gmail'] else None
            clean_name = re.sub(r'[^A-Z]', '', name_val.upper())

            # Check if this student matched anything in DB
            found_in_db = False
            for s in db_students:
                s_usn = s.usn.strip().upper()
                s_clean = re.sub(r'[^A-Z]', '', s.name.upper())
                if (usn_val and usn_val == s_usn) or clean_name == s_clean or (len(clean_name) > 6 and (clean_name in s_clean or s_clean in clean_name)):
                    found_in_db = True
                    break

            if not found_in_db and name_val:
                # This is an unmatched Excel entry! Flag it for Admin verification as per requirement 1!
                # Generate a temporary pending identifier or use 'PENDING_'
                temp_usn = usn_val if usn_val.startswith('4MN') else f"UNMATCHED_{clean_name[:8]}"
                existing_flagged = db.query(Student).filter(Student.usn == temp_usn).first()
                if not existing_flagged:
                    print(f"Creating flagged record for Admin verification: {name_val} ({temp_usn})")
                    flagged_student = Student(
                        usn=temp_usn,
                        name=name_val,
                        email=gmail_val or f"{temp_usn.lower()}@college.edu",
                        gmail=gmail_val,
                        phone=ex['phone'],
                        semester=5,
                        section='A' if 'A' in ex['sheet'] else 'B',
                        department_id=dept_id,
                        registration_status='Unregistered',
                        email_verification_status='Unverified',
                        is_flagged_for_admin=1,
                        admin_flag_reason=f"Excel student not found in IA marks PDF list (Sheet {ex['sheet']})"
                    )
                    db.add(flagged_student)
                    flagged_count += 1

        db.commit()
        print("\n============================================================")
        print("MIGRATION & MATCHING COMPLETED")
        print("============================================================")
        print(f"Total students with matched Gmail: {matched_count}")
        print(f"Total Diploma students mapped to official USN: {diploma_count}")
        print(f"Total students flagged for Admin review: {flagged_count}")

    finally:
        db.close()

if __name__ == '__main__':
    run_migration_and_matching()

