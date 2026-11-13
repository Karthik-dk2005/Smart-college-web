import os
import sys
import pdfplumber
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import Base, engine, SessionLocal
from app.models.student import Student
from app.models.subject import Subject
from app.models.user import User
from app.models.department import Department
from app.models.mark import Mark
from app.utils.security import get_password_hash

OFFICIAL_SUBJECTS = [
    {
        "code": "BCS501",
        "name": "Software Engineering (SE)",
        "short": "SE",
        "raw_max": 30.0,
        "scaled_max": 25.0,
        "raw_col": 3,
        "scaled_col": 4,
        "credits": 4
    },
    {
        "code": "BCS502",
        "name": "Computer Networks (CN)",
        "short": "CN",
        "raw_max": 30.0,
        "scaled_max": 15.0,
        "raw_col": 5,
        "scaled_col": 6,
        "credits": 4
    },
    {
        "code": "BCS503",
        "name": "Theory of Computation (TOC)",
        "short": "TOC",
        "raw_max": 30.0,
        "scaled_max": 25.0,
        "raw_col": 7,
        "scaled_col": 8,
        "credits": 4
    },
    {
        "code": "BRMK557",
        "name": "RM & IPR",
        "short": "RM & IPR",
        "raw_max": 30.0,
        "scaled_max": 25.0,
        "raw_col": 9,
        "scaled_col": 10,
        "credits": 3
    },
    {
        "code": "BCS515C",
        "name": "UNIX",
        "short": "UNIX",
        "raw_max": 30.0,
        "scaled_max": 25.0,
        "raw_col": 11,
        "scaled_col": 12,
        "credits": 3
    },
    {
        "code": "BCS508",
        "name": "Environmental Studies (ENV)",
        "short": "ENV",
        "raw_max": 25.0,
        "scaled_max": 25.0,
        "raw_col": 13,
        "scaled_col": 14,
        "credits": 2
    },
]


def parse_ia_pdf(pdf_path: str, section: str):
    """Parse student marks from college 1st IA marks PDF."""
    records = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if not tables:
                continue
            table = tables[0]
            for row in table:
                if not row or not row[0]:
                    continue
                sl_str = str(row[0]).strip()
                if not sl_str.isdigit():
                    continue

                sl_no = int(sl_str)
                usn = str(row[1]).strip() if row[1] else ""
                name = str(row[2]).strip() if row[2] else ""

                if not usn:
                    continue

                student_entry = {
                    "sl_no": sl_no,
                    "usn": usn,
                    "student_name": name,
                    "section": section,
                    "marks": []
                }

                for sub in OFFICIAL_SUBJECTS:
                    raw_val = str(row[sub["raw_col"]]).strip() if sub["raw_col"] < len(row) and row[sub["raw_col"]] is not None else ""
                    scaled_val = str(row[sub["scaled_col"]]).strip() if sub["scaled_col"] < len(row) and row[sub["scaled_col"]] is not None else ""

                    is_absent = (raw_val.upper() == "AB" or scaled_val.upper() == "AB")

                    def parse_val(v):
                        if not v or v.upper() == "AB":
                            return None
                        try:
                            return float(v)
                        except ValueError:
                            return None

                    obtained = None if is_absent else parse_val(raw_val)
                    scaled = None if is_absent else parse_val(scaled_val)

                    student_entry["marks"].append({
                        "subject_code": sub["code"],
                        "subject_name": sub["name"],
                        "short_name": sub["short"],
                        "maximum_marks": sub["raw_max"],
                        "obtained_marks": obtained,
                        "scaled_max_marks": sub["scaled_max"],
                        "scaled_marks": scaled,
                        "is_absent": is_absent,
                        "status": "Absent" if is_absent else "Present",
                    })

                records.append(student_entry)
    return records


def import_5th_sem_marks(db: Session, force_reload: bool = False):
    """
    Ensure 6 official subjects exist, ensure students exist (preserving existing data),
    and populate complete IA marks from uploaded Section A and Section B PDFs.
    """
    # 1. Create table schema if not already present
    Base.metadata.create_all(bind=engine)

    # 2. Ensure default CSE department exists
    dept = db.query(Department).filter(
        (Department.name.ilike("%Computer Science%")) | (Department.code == "CSE")
    ).first()
    if not dept:
        dept = db.query(Department).first()
    dept_id = dept.id if dept else 1

    # 3. Ensure all 6 official subjects exist with exact names and codes
    subject_map = {}
    for sub_info in OFFICIAL_SUBJECTS:
        subj = db.query(Subject).filter(Subject.subject_code == sub_info["code"]).first()
        if not subj:
            subj = Subject(
                subject_code=sub_info["code"],
                subject_name=sub_info["name"],
                department_id=dept_id,
                semester=5,
                credits=sub_info["credits"],
                status="active"
            )
            db.add(subj)
            db.flush()
        else:
            # Keep official exact name
            subj.subject_name = sub_info["name"]
            subj.semester = 5
        subject_map[sub_info["code"]] = subj

    db.commit()

    # 4. Check if marks already imported
    existing_marks_count = db.query(Mark).filter(Mark.semester == 5, Mark.ia_number == "IA-1").count()
    if existing_marks_count >= 786 and not force_reload:
        return {
            "status": "already_loaded",
            "marks_count": existing_marks_count,
            "message": "IA marks are already loaded in database."
        }

    # If force_reload, clear old marks for semester 5 IA-1
    if force_reload:
        db.query(Mark).filter(Mark.semester == 5, Mark.ia_number == "IA-1").delete()
        db.commit()

    # 5. Locate PDF files
    base_dirs = [
        "data/marks",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "marks"),
        ".",
        "backend",
        "C:/Users/User/Downloads"
    ]

    sec_a_file = None
    sec_b_file = None

    for d in base_dirs:
        for fname_a in ["5th_SEM_A_SEC_1st_IA_Marks_List_2026(3).pdf", "5th_SEM_A_SEC_1st_IA_Marks_List_2026.pdf"]:
            fa = os.path.join(d, fname_a)
            if not sec_a_file and os.path.exists(fa):
                sec_a_file = fa

        for fname_b in ["5th_SEM_B_SEC_1st_IA_Marks_List_2026(3).pdf", "5th_SEM_B_SEC_1st_IA_Marks_List_2026.pdf"]:
            fb = os.path.join(d, fname_b)
            if not sec_b_file and os.path.exists(fb):
                sec_b_file = fb

    if not sec_a_file or not sec_b_file:
        raise FileNotFoundError(f"Marks PDF files not found in searched directories: {base_dirs}")

    sec_a_students = parse_ia_pdf(sec_a_file, "A")
    sec_b_students = parse_ia_pdf(sec_b_file, "B")

    all_students_data = sec_a_students + sec_b_students
    default_hash = get_password_hash("Student@123")

    inserted_marks = 0
    new_students_added = 0

    for st_data in all_students_data:
        usn = st_data["usn"].strip().upper()
        name = " ".join(st_data["student_name"].split())
        sec = st_data["section"]
        sl = st_data["sl_no"]

        # 1. Check existing student record
        student = db.query(Student).filter(func.upper(Student.usn) == usn).first()

        # 2. Ensure user account for login exists and is active/approved
        user_email = f"{usn.lower()}@college.edu"
        user = db.query(User).filter(
            (func.lower(User.email) == user_email) |
            (func.upper(User.usn_or_employee_id) == usn) |
            (User.id == (student.user_id if student else -1))
        ).first()

        if not user:
            user = User(
                name=name,
                full_name=name,
                username=usn.lower(),
                email=user_email,
                password_hash=default_hash,
                role="student",
                department_id=dept_id,
                semester=5,
                section=sec,
                usn_or_employee_id=usn,
                account_status="Approved",
                is_active=True
            )
            db.add(user)
            db.flush()
        else:
            user.name = name
            user.full_name = name
            user.username = usn.lower()
            user.usn_or_employee_id = usn
            user.account_status = "Approved"
            user.is_active = True
            user.password_hash = default_hash
            db.flush()

        # 3. Create or update Student record
        if not student:
            student = Student(
                student_id=usn,
                usn=usn,
                name=name,
                email=user_email,
                semester=5,
                section=sec,
                department_id=dept_id,
                user_id=user.id,
                admission_year=2024,
                status="active"
            )
            db.add(student)
            db.flush()
            new_students_added += 1
        else:
            student.name = name
            student.user_id = user.id
            student.section = sec
            student.semester = 5
            db.flush()

        # Now insert marks for all 6 subjects
        for mark_item in st_data["marks"]:
            code = mark_item["subject_code"]
            subj = subject_map.get(code)

            # Check if mark row already exists
            existing_mark = db.query(Mark).filter(
                Mark.usn == usn,
                Mark.subject_code == code,
                Mark.ia_number == "IA-1"
            ).first()

            if not existing_mark:
                mark_entry = Mark(
                    sl_no=sl,
                    student_id=student.id,
                    usn=usn,
                    student_name=name,
                    section=sec,
                    semester=5,
                    department="Computer Science and Engineering",
                    academic_year="2024-2025",
                    assessment_name="First Internal Assessment",
                    ia_number="IA-1",
                    subject_id=subj.id if subj else None,
                    subject_code=code,
                    subject_name=mark_item["subject_name"],
                    short_name=mark_item["short_name"],
                    maximum_marks=mark_item["maximum_marks"],
                    obtained_marks=mark_item["obtained_marks"],
                    scaled_max_marks=mark_item["scaled_max_marks"],
                    scaled_marks=mark_item["scaled_marks"],
                    is_absent=mark_item["is_absent"],
                    status="Absent" if mark_item["is_absent"] else "Present"
                )
                db.add(mark_entry)
                inserted_marks += 1
            else:
                # Update existing mark if needed
                existing_mark.sl_no = sl
                existing_mark.student_id = student.id
                existing_mark.student_name = name
                existing_mark.section = sec
                existing_mark.maximum_marks = mark_item["maximum_marks"]
                existing_mark.obtained_marks = mark_item["obtained_marks"]
                existing_mark.scaled_max_marks = mark_item["scaled_max_marks"]
                existing_mark.scaled_marks = mark_item["scaled_marks"]
                existing_mark.is_absent = mark_item["is_absent"]
                existing_mark.status = "Absent" if mark_item["is_absent"] else "Present"

    db.commit()

    return {
        "status": "success",
        "total_parsed": len(all_students_data),
        "section_a_count": len(sec_a_students),
        "section_b_count": len(sec_b_students),
        "new_students_added": new_students_added,
        "marks_records_created": inserted_marks,
    }


if __name__ == "__main__":
    with SessionLocal() as db:
        res = import_5th_sem_marks(db, force_reload=True)
        print("Import Result:", res)

