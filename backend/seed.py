"""
SmartDept - Smart Department Academic & Campus Management System
Database Seed Script (Compatible with both local SQLite/MySQL and Vercel serverless cold start)
Seeds CSE Department, Rooms, Staff Accounts (Admin, HOD, Teachers),
all 133 Verified 5th Semester CSE Students (from official_students.csv),
5th Semester Subjects, Timetables (Section A & B), and Department Notices.
"""
import csv
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, create_dev_tables
from app.models.department import Department
from app.models.user import User
from app.models.faculty import Faculty
from app.models.teacher import Teacher
from app.models.room import Room
from app.models.student import Student
from app.models.subject import Subject
from app.models.timetable import Timetable
from app.models.notice import Notice
from app.utils.security import get_password_hash

# Pre-activated demo student USNs (password: password123) so Student Login works out-of-the-box;
# all other 131 verified students remain Unregistered so they can test/use /register/student.
PRE_ACTIVATED_STUDENT_USNS = {"4MN24CS002", "4MN24CS003"}


def seed_database():
    print("=" * 65)
    print("SEEDING SMARTDEPT DATABASE (Academic Year 2026-2027 ODD SEM)")
    print("=" * 65)

    create_dev_tables()
    db = SessionLocal()
    default_pw_hash = get_password_hash("password123")

    try:
        # 1. Seed Department
        dept = db.query(Department).filter(Department.code == "CSE").first()
        if not dept:
            dept = Department(
                name="Computer Science and Engineering",
                code="CSE",
                description="Department of Computer Science and Engineering (NBA Accredited)",
                status="active",
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            print(f"[+] Department created: {dept.name} ({dept.code})")

        # 2. Seed Rooms
        rooms_spec = [
            ("CS-303", "Classroom", 70),
            ("CS-304", "Classroom", 70),
            ("WT-LAB", "Laboratory", 40),
            ("MP-LAB", "Laboratory", 40),
            ("AUD-01", "Auditorium", 120),
        ]
        room_map = {}
        for rname, rtype, rcap in rooms_spec:
            rm = db.query(Room).filter(Room.room_name == rname).first()
            if not rm:
                rm = Room(room_name=rname, room_type=rtype, capacity=rcap, status="active")
                db.add(rm)
                db.commit()
                db.refresh(rm)
            room_map[rname] = rm

        # 3. Seed Institutional Users (Admin, HOD, Teachers) + Faculty & Teacher profiles
        staff_to_seed = [
            {
                "email": "admin@campus.edu",
                "username": "admin",
                "name": "System Administrator",
                "role": "admin",
                "phone": "+91 98765 00001",
            },
            {
                "email": "admin@gmail.com",
                "username": "admin_gmail",
                "name": "MITT Admin",
                "role": "admin",
                "phone": "+91 98765 00011",
            },
            {
                "email": "hod.cse@campus.edu",
                "username": "hod.cse",
                "name": "Dr. Vikramaditya Sen",
                "role": "hod",
                "phone": "+91 98765 00002",
                "employee_id": "FAC-CSE-000",
                "designation": "Professor & Head of Department",
            },
            {
                "email": "hod.cse@gmail.com",
                "username": "hod_gmail",
                "name": "Dr. Vikramaditya Sen",
                "role": "hod",
                "phone": "+91 98765 00012",
                "designation": "Professor & Head of Department",
            },
            {
                "email": "teacher@gmail.com",
                "username": "teacher_cse_gmail",
                "name": "Prof. Teacher CSE",
                "role": "teacher",
                "phone": "+91 98765 10000",
                "employee_id": "FAC-CSE-010",
                "designation": "Assistant Professor",
            },
            {
                "email": "ananya.iyer@faculty.campus.edu",
                "username": "ananya.iyer",
                "name": "Prof. Ananya Iyer",
                "role": "teacher",
                "phone": "+91 98765 10001",
                "employee_id": "FAC-CSE-001",
                "designation": "Associate Professor",
            },
            {
                "email": "rajesh.kumar@faculty.campus.edu",
                "username": "rajesh.kumar",
                "name": "Dr. Rajesh Kumar",
                "role": "teacher",
                "phone": "+91 98765 10002",
                "employee_id": "FAC-CSE-002",
                "designation": "Professor",
            },
            {
                "email": "divya.menon@faculty.campus.edu",
                "username": "divya.menon",
                "name": "Prof. Divya Menon",
                "role": "teacher",
                "phone": "+91 98765 10003",
                "employee_id": "FAC-CSE-003",
                "designation": "Assistant Professor",
            },
            {
                "email": "ramesh.kulkarni@faculty.campus.edu",
                "username": "ramesh.kulkarni",
                "name": "Prof. Ramesh Kulkarni",
                "role": "teacher",
                "phone": "+91 98765 10004",
                "employee_id": "FAC-CSE-004",
                "designation": "Associate Professor",
            },
            {
                "email": "sneha.reddy@faculty.campus.edu",
                "username": "sneha.reddy",
                "name": "Prof. Sneha Reddy",
                "role": "teacher",
                "phone": "+91 98765 10005",
                "employee_id": "FAC-CSE-005",
                "designation": "Assistant Professor",
            },
        ]

        created_users = {}
        teacher_map = {}

        for udata in staff_to_seed:
            user = db.query(User).filter(User.email == udata["email"]).first()
            if not user:
                user = User(
                    name=udata["name"],
                    full_name=udata["name"],
                    username=udata["username"],
                    email=udata["email"],
                    password_hash=default_pw_hash,
                    role=udata["role"],
                    department_id=dept.id,
                    phone=udata.get("phone"),
                    designation=udata.get("designation"),
                    usn_or_employee_id=udata.get("employee_id"),
                    account_status="Approved",
                    is_active=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                user.name = udata["name"]
                user.full_name = udata["name"]
                user.role = udata["role"]
                user.account_status = "Approved"
                user.is_active = True
                user.password_hash = default_pw_hash
                db.commit()
            created_users[udata["email"]] = user

            if udata.get("employee_id"):
                emp_id = udata["employee_id"]
                fac = db.query(Faculty).filter(Faculty.user_id == user.id).first()
                if not fac:
                    fac = Faculty(
                        employee_id=emp_id,
                        name=user.name,
                        email=user.email,
                        phone=user.phone,
                        department_id=dept.id,
                        user_id=user.id,
                        designation=udata.get("designation", "Assistant Professor"),
                    )
                    db.add(fac)
                    db.commit()

                tch = db.query(Teacher).filter(Teacher.employee_id == emp_id).first()
                if not tch:
                    tch = Teacher(
                        employee_id=emp_id,
                        name=user.name,
                        email=user.email,
                        phone=user.phone,
                        department_id=dept.id,
                        designation=udata.get("designation", "Assistant Professor"),
                        username=user.username,
                        password_hash=default_pw_hash,
                        status="active",
                    )
                    db.add(tch)
                    db.commit()
                    db.refresh(tch)
                teacher_map[udata["email"]] = tch

        print(f"[+] Staff accounts ready: {len(created_users)} institutional users")

        # 4. Seed Official 133 5th Semester CSE Students from official_students.csv
        official_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "official_students.csv")
        if os.path.exists(official_csv) and db.query(Student).count() == 0:
            with open(official_csv, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                imported_count = 0
                for row in reader:
                    usn = (row.get("USN") or "").strip().upper()
                    name = (row.get("Student Name") or "").strip().upper()
                    gmail = (row.get("Gmail") or "").strip().lower()
                    section = (row.get("Section") or "A").strip().upper()
                    semester = int(row.get("Semester") or 5)
                    if not usn or not name:
                        continue

                    is_pre_active = usn in PRE_ACTIVATED_STUDENT_USNS
                    linked_user_id = None

                    if is_pre_active:
                        stu_user = db.query(User).filter(User.username == usn.lower()).first()
                        if not stu_user:
                            stu_user = User(
                                full_name=name,
                                name=name,
                                username=usn.lower(),
                                email=gmail or f"{usn.lower()}@college.edu",
                                password_hash=default_pw_hash,
                                usn_or_employee_id=usn,
                                role="student",
                                department_id=dept.id,
                                semester=semester,
                                section=section,
                                account_status="Approved",
                                is_active=True,
                            )
                            db.add(stu_user)
                            db.flush()
                        linked_user_id = stu_user.id

                    std = Student(
                        usn=usn,
                        student_id=usn,
                        name=name,
                        email=gmail or f"{usn.lower()}@college.edu",
                        gmail=gmail or None,
                        phone=(row.get("Phone") or "").strip() or None,
                        father_phone=(row.get("Father Phone") or "").strip() or None,
                        mother_phone=(row.get("Mother Phone") or "").strip() or None,
                        semester=semester,
                        section=section,
                        department_id=dept.id,
                        admission_year=2025 if usn.startswith("4MN25") else 2024,
                        username=usn.lower(),
                        password_hash=default_pw_hash if is_pre_active else None,
                        user_id=linked_user_id,
                        status="active",
                        registration_status="Registered" if is_pre_active else "Unregistered",
                        email_verification_status="Verified" if is_pre_active else "Unverified",
                        registered_at=datetime.utcnow() if is_pre_active else None,
                    )
                    db.add(std)
                    imported_count += 1
                db.commit()
                print(f"[+] Imported {imported_count} official 5th Sem CSE students ({len(PRE_ACTIVATED_STUDENT_USNS)} pre-activated for instant login)")

        # 5. Seed 5th Semester Subjects
        hod_t = teacher_map.get("hod.cse@campus.edu")
        ananya_t = teacher_map.get("ananya.iyer@faculty.campus.edu")
        rajesh_t = teacher_map.get("rajesh.kumar@faculty.campus.edu")
        divya_t = teacher_map.get("divya.menon@faculty.campus.edu")
        ramesh_t = teacher_map.get("ramesh.kulkarni@faculty.campus.edu")
        sneha_t = teacher_map.get("sneha.reddy@faculty.campus.edu")

        subjects_data = [
            ("21CS51", "Software Engineering & Project Management", 4, ananya_t),
            ("21CS52", "Computer Networks", 4, rajesh_t),
            ("21CS53", "Theory of Computation", 4, hod_t),
            ("21CSL58", "Web Technology Lab", 2, divya_t),
            ("21CS55", "Unix System Programming", 3, ramesh_t),
            ("21CSP57", "Mini Project", 2, sneha_t),
            ("21RMI56", "Research Methodology and IPR", 3, hod_t),
            ("21CIV59", "Environmental Studies and E-waste Management", 2, sneha_t),
            ("21NSS59", "National Service Scheme", 1, ramesh_t),
        ]

        subject_map = {}
        for code, sname, creds, tch in subjects_data:
            subj = db.query(Subject).filter(Subject.subject_code == code).first()
            if not subj:
                subj = Subject(
                    subject_code=code,
                    subject_name=sname,
                    credits=creds,
                    semester=5,
                    department_id=dept.id,
                    teacher_id=tch.id if tch else None,
                    status="active",
                )
                db.add(subj)
                db.commit()
                db.refresh(subj)
            subject_map[code] = subj

        # 6. Seed 5th Sem Timetables (Sections A & B)
        if db.query(Timetable).count() == 0 and ananya_t and rajesh_t and hod_t and divya_t and ramesh_t and sneha_t:
            slots_a = [
                ("Monday", 1, "09:00", "10:00", "21CS51", ananya_t),
                ("Monday", 2, "10:00", "11:00", "21CS52", rajesh_t),
                ("Monday", 3, "11:15", "12:15", "21CS53", hod_t),
                ("Tuesday", 1, "09:00", "10:00", "21CS52", rajesh_t),
                ("Tuesday", 2, "10:00", "11:00", "21CS55", ramesh_t),
                ("Tuesday", 3, "11:15", "12:15", "21RMI56", hod_t),
                ("Wednesday", 1, "09:00", "10:00", "21CS53", hod_t),
                ("Wednesday", 2, "10:00", "11:00", "21CS51", ananya_t),
                ("Wednesday", 3, "11:15", "13:15", "21CSL58", divya_t),
                ("Thursday", 1, "09:00", "10:00", "21CS55", ramesh_t),
                ("Thursday", 2, "10:00", "11:00", "21CS52", rajesh_t),
                ("Thursday", 3, "11:15", "12:15", "21CIV59", sneha_t),
                ("Friday", 1, "09:00", "10:00", "21CS51", ananya_t),
                ("Friday", 2, "10:00", "11:00", "21CS53", hod_t),
                ("Friday", 3, "11:15", "13:15", "21CSP57", sneha_t),
            ]
            slots_b = [
                ("Monday", 1, "09:00", "10:00", "21CS52", rajesh_t),
                ("Monday", 2, "10:00", "11:00", "21CS53", hod_t),
                ("Monday", 3, "11:15", "12:15", "21CS51", ananya_t),
                ("Tuesday", 1, "09:00", "10:00", "21CS55", ramesh_t),
                ("Tuesday", 2, "10:00", "11:00", "21CS51", ananya_t),
                ("Tuesday", 3, "11:15", "13:15", "21CSL58", divya_t),
                ("Wednesday", 1, "09:00", "10:00", "21CS52", rajesh_t),
                ("Wednesday", 2, "10:00", "11:00", "21RMI56", hod_t),
                ("Wednesday", 3, "11:15", "12:15", "21CS55", ramesh_t),
                ("Thursday", 1, "09:00", "10:00", "21CS53", hod_t),
                ("Thursday", 2, "10:00", "11:00", "21CIV59", sneha_t),
                ("Thursday", 3, "11:15", "13:15", "21CSP57", sneha_t),
                ("Friday", 1, "09:00", "10:00", "21CS52", rajesh_t),
                ("Friday", 2, "10:00", "11:00", "21CS51", ananya_t),
                ("Friday", 3, "11:15", "12:15", "21NSS59", ramesh_t),
            ]
            for day, pno, st, et, code, tch in slots_a:
                db.add(Timetable(
                    department_id=dept.id, semester=5, section="A", day=day,
                    period_number=pno, start_time=st, end_time=et,
                    subject_id=subject_map[code].id, teacher_id=tch.id,
                    room_id=room_map["WT-LAB"].id if code == "21CSL58" else room_map["CS-303"].id,
                ))
            for day, pno, st, et, code, tch in slots_b:
                db.add(Timetable(
                    department_id=dept.id, semester=5, section="B", day=day,
                    period_number=pno, start_time=st, end_time=et,
                    subject_id=subject_map[code].id, teacher_id=tch.id,
                    room_id=room_map["WT-LAB"].id if code == "21CSL58" else room_map["CS-304"].id,
                ))
            db.commit()
            print(f"[+] Timetables seeded: {len(slots_a)} slots (Sec A) + {len(slots_b)} slots (Sec B)")

        # 7. Seed Notices
        notices_to_seed = [
            (
                "Odd Semester 2026-2027 Academic Schedule Released",
                "Welcome to 5th Semester ODD SEM. Regular classes for Sections A (CS-303) and B (CS-304) commence as per the published department timetable.",
                "all",
                created_users["hod.cse@campus.edu"].id,
            ),
            (
                "Web Technology Lab (21CSL58) Setup",
                "Students must bring their lab manuals and verify their environments for upcoming practical sessions.",
                "student",
                created_users["divya.menon@faculty.campus.edu"].id,
            ),
        ]
        for title, desc, target, creator_id in notices_to_seed:
            if not db.query(Notice).filter(Notice.title == title).first():
                db.add(Notice(title=title, description=desc, target_role=target, created_by=creator_id))
        db.commit()

        print("=" * 65)
        print("SMARTDEPT DATABASE SEED COMPLETED SUCCESSFULLY!")
        print("=" * 65)

    except Exception as e:
        db.rollback()
        print(f"[-] Error while seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
