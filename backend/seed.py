"""
Smart Department Academic Management System - Database Seed Script
Academic Year: 2026–2027, ODD SEM (Fifth Semester)
Sections: A (Room CS-303) and B (Room CS-304)
"""
import sys
import os
from datetime import datetime, date, timedelta

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, Base, engine, create_dev_tables
from app.models.user import User
from app.models.department import Department
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.attendance import Attendance
from app.models.timetable import Timetable
from app.models.location import Location
from app.models.notice import Notice
from app.utils.security import get_password_hash
from app.config import settings


def seed_database():
    print("=" * 60)
    print("SEEDING SMART DEPARTMENT DATABASE (Academic Year 2026–2027 ODD SEM)")
    print("=" * 60)

    create_dev_tables()
    db = SessionLocal()

    try:
        # 1. Seed or find Department
        dept = db.query(Department).filter(Department.code == "CSE").first()
        if not dept:
            dept = Department(
                name="Computer Science and Engineering",
                code="CSE",
                description="Department of Computer Science and Engineering, Academic Year 2026–2027"
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            print(f"[+] Department created: {dept.name} ({dept.code})")
        else:
            print(f"[*] Department already exists: {dept.name} ({dept.code})")

        # 2. Seed Users & Profiles
        users_to_seed = [
            # Admin
            {
                "email": "admin@campus.edu",
                "name": "System Administrator",
                "role": "admin",
                "phone": "+91 98765 00001",
                "is_active": True,
            },
            # HOD
            {
                "email": "hod.cse@campus.edu",
                "name": "Dr. Vikramaditya Sen",
                "role": "hod",
                "phone": "+91 98765 00002",
                "is_active": True,
                "faculty_info": {
                    "employee_id": "FAC-CSE-000",
                    "designation": "Professor & Head of Department",
                }
            },
            # Faculty
            {
                "email": "ananya.iyer@faculty.campus.edu",
                "name": "Prof. Ananya Iyer",
                "role": "faculty",
                "phone": "+91 98765 10001",
                "is_active": True,
                "faculty_info": {
                    "employee_id": "FAC-CSE-001",
                    "designation": "Associate Professor",
                }
            },
            {
                "email": "rajesh.kumar@faculty.campus.edu",
                "name": "Dr. Rajesh Kumar",
                "role": "faculty",
                "phone": "+91 98765 10002",
                "is_active": True,
                "faculty_info": {
                    "employee_id": "FAC-CSE-002",
                    "designation": "Professor",
                }
            },
            {
                "email": "divya.menon@faculty.campus.edu",
                "name": "Prof. Divya Menon",
                "role": "faculty",
                "phone": "+91 98765 10003",
                "is_active": True,
                "faculty_info": {
                    "employee_id": "FAC-CSE-003",
                    "designation": "Assistant Professor",
                }
            },
            {
                "email": "ramesh.kulkarni@faculty.campus.edu",
                "name": "Prof. Ramesh Kulkarni",
                "role": "faculty",
                "phone": "+91 98765 10004",
                "is_active": True,
                "faculty_info": {
                    "employee_id": "FAC-CSE-004",
                    "designation": "Associate Professor",
                }
            },
            {
                "email": "sneha.reddy@faculty.campus.edu",
                "name": "Prof. Sneha Reddy",
                "role": "faculty",
                "phone": "+91 98765 10005",
                "is_active": True,
                "faculty_info": {
                    "employee_id": "FAC-CSE-005",
                    "designation": "Assistant Professor",
                }
            },
        ]

        created_users = {}
        for udata in users_to_seed:
            user = db.query(User).filter(User.email == udata["email"]).first()
            if not user:
                user = User(
                    name=udata["name"],
                    email=udata["email"],
                    password_hash=get_password_hash("password123"),
                    role=udata["role"],
                    phone=udata.get("phone"),
                    is_active=udata["is_active"],
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"[+] User created: {user.name} ({user.email}) -> Role: {user.role}")
            else:
                user.name = udata["name"]
                user.role = udata["role"]
                user.password_hash = get_password_hash("password123")
                db.commit()
            created_users[udata["email"]] = user

            # Profile creation
            if "faculty_info" in udata:
                finfo = udata["faculty_info"]
                fac = db.query(Faculty).filter(Faculty.user_id == user.id).first()
                if not fac:
                    fac = Faculty(
                        employee_id=finfo["employee_id"],
                        name=user.name,
                        email=user.email,
                        phone=user.phone,
                        department_id=dept.id,
                        user_id=user.id,
                        designation=finfo["designation"],
                    )
                    db.add(fac)
                    db.commit()
                    db.refresh(fac)
                    print(f"  [+] Faculty profile linked: {fac.name} [{fac.employee_id}]")
                if udata["role"] == "hod" and not dept.hod_id:
                    dept.hod_id = fac.id
                    db.commit()

            elif "student_info" in udata:
                sinfo = udata["student_info"]
                std = db.query(Student).filter(Student.user_id == user.id).first()
                if not std:
                    std = Student(
                        usn=sinfo["usn"],
                        name=user.name,
                        email=user.email,
                        phone=user.phone,
                        semester=sinfo["semester"],
                        section=sinfo["section"],
                        department_id=dept.id,
                        user_id=user.id,
                    )
                    db.add(std)
                    db.commit()
                    db.refresh(std)
                    print(f"  [+] Student profile linked: {std.name} [{std.usn}] Section {std.section}")

        # Fetch all faculty records
        all_faculty = {f.email: f for f in db.query(Faculty).all()}
        hod_fac = all_faculty.get("hod.cse@campus.edu")
        ananya_fac = all_faculty.get("ananya.iyer@faculty.campus.edu")
        rajesh_fac = all_faculty.get("rajesh.kumar@faculty.campus.edu")
        divya_fac = all_faculty.get("divya.menon@faculty.campus.edu")
        ramesh_fac = all_faculty.get("ramesh.kulkarni@faculty.campus.edu")
        sneha_fac = all_faculty.get("sneha.reddy@faculty.campus.edu")

        # 3. Seed 5th Semester Subjects
        # Exactly matching source requirements:
        # - Software Engineering & Project Management
        # - Computer Networks
        # - Theory of Computation
        # - Web Technology Lab
        # - Unix System Programming
        # - Mini Project
        # - Research Methodology and IPR
        # - Environmental Studies and E-waste Management
        # - National Service Scheme
        subjects_data = [
            {
                "code": "21CS51",
                "name": "Software Engineering & Project Management",
                "credits": 4,
                "semester": 5,
                "faculty_id": ananya_fac.id if ananya_fac else None
            },
            {
                "code": "21CS52",
                "name": "Computer Networks",
                "credits": 4,
                "semester": 5,
                "faculty_id": rajesh_fac.id if rajesh_fac else None
            },
            {
                "code": "21CS53",
                "name": "Theory of Computation",
                "credits": 4,
                "semester": 5,
                "faculty_id": hod_fac.id if hod_fac else None
            },
            {
                "code": "21CSL58",
                "name": "Web Technology Lab",
                "credits": 2,
                "semester": 5,
                "faculty_id": divya_fac.id if divya_fac else None
            },
            {
                "code": "21CS55",
                "name": "Unix System Programming",
                "credits": 3,
                "semester": 5,
                "faculty_id": ramesh_fac.id if ramesh_fac else None
            },
            {
                "code": "21CSP57",
                "name": "Mini Project",
                "credits": 2,
                "semester": 5,
                "faculty_id": sneha_fac.id if sneha_fac else None
            },
            {
                "code": "21RMI56",
                "name": "Research Methodology and IPR",
                "credits": 3,
                "semester": 5,
                "faculty_id": hod_fac.id if hod_fac else None
            },
            {
                "code": "21CIV59",
                "name": "Environmental Studies and E-waste Management",
                "credits": 2,
                "semester": 5,
                "faculty_id": sneha_fac.id if sneha_fac else None
            },
            {
                "code": "21NSS59",
                "name": "National Service Scheme",
                "credits": 1,
                "semester": 5,
                "faculty_id": ramesh_fac.id if ramesh_fac else None
            },
        ]

        subject_map = {}
        for sdata in subjects_data:
            subj = db.query(Subject).filter(Subject.subject_code == sdata["code"]).first()
            if not subj:
                subj = Subject(
                    subject_code=sdata["code"],
                    subject_name=sdata["name"],
                    credits=sdata["credits"],
                    semester=sdata["semester"],
                    department_id=dept.id,
                    faculty_id=sdata["faculty_id"]
                )
                db.add(subj)
                db.commit()
                db.refresh(subj)
                print(f"[+] Subject registered: {subj.subject_name} ({subj.subject_code})")
            else:
                subj.subject_name = sdata["name"]
                subj.credits = sdata["credits"]
                subj.faculty_id = sdata["faculty_id"]
                db.commit()
            subject_map[sdata["name"]] = subj
            subject_map[sdata["code"]] = subj

        # 4. Seed Timetable for Academic Year 2026–2027 ODD SEM
        # Section A -> Room CS-303
        # Section B -> Room CS-304
        # Days: Monday to Saturday
        timetable_slots_a = [
            # Monday - Section A (CS-303)
            {"day": "Monday", "start": "09:00", "end": "10:00", "sub": "21CS51", "fac": ananya_fac},
            {"day": "Monday", "start": "10:00", "end": "11:00", "sub": "21CS52", "fac": rajesh_fac},
            {"day": "Monday", "start": "11:15", "end": "12:15", "sub": "21CS53", "fac": hod_fac},
            {"day": "Monday", "start": "12:15", "end": "13:15", "sub": "21CS55", "fac": ramesh_fac},
            {"day": "Monday", "start": "14:00", "end": "16:00", "sub": "21CSL58", "fac": divya_fac},

            # Tuesday - Section A (CS-303)
            {"day": "Tuesday", "start": "09:00", "end": "10:00", "sub": "21CS53", "fac": hod_fac},
            {"day": "Tuesday", "start": "10:00", "end": "11:00", "sub": "21CS51", "fac": ananya_fac},
            {"day": "Tuesday", "start": "11:15", "end": "12:15", "sub": "21RMI56", "fac": hod_fac},
            {"day": "Tuesday", "start": "12:15", "end": "13:15", "sub": "21CS52", "fac": rajesh_fac},
            {"day": "Tuesday", "start": "14:00", "end": "16:00", "sub": "21CSP57", "fac": sneha_fac},

            # Wednesday - Section A (CS-303)
            {"day": "Wednesday", "start": "09:00", "end": "10:00", "sub": "21CS55", "fac": ramesh_fac},
            {"day": "Wednesday", "start": "10:00", "end": "11:00", "sub": "21CS53", "fac": hod_fac},
            {"day": "Wednesday", "start": "11:15", "end": "12:15", "sub": "21CS51", "fac": ananya_fac},
            {"day": "Wednesday", "start": "12:15", "end": "13:15", "sub": "21CIV59", "fac": sneha_fac},
            {"day": "Wednesday", "start": "14:00", "end": "15:00", "sub": "21CS52", "fac": rajesh_fac},

            # Thursday - Section A (CS-303)
            {"day": "Thursday", "start": "09:00", "end": "10:00", "sub": "21CS52", "fac": rajesh_fac},
            {"day": "Thursday", "start": "10:00", "end": "11:00", "sub": "21CS55", "fac": ramesh_fac},
            {"day": "Thursday", "start": "11:15", "end": "12:15", "sub": "21RMI56", "fac": hod_fac},
            {"day": "Thursday", "start": "12:15", "end": "13:15", "sub": "21CIV59", "fac": sneha_fac},
            {"day": "Thursday", "start": "14:00", "end": "16:00", "sub": "21CSL58", "fac": divya_fac},

            # Friday - Section A (CS-303)
            {"day": "Friday", "start": "09:00", "end": "10:00", "sub": "21CS51", "fac": ananya_fac},
            {"day": "Friday", "start": "10:00", "end": "11:00", "sub": "21CS53", "fac": hod_fac},
            {"day": "Friday", "start": "11:15", "end": "12:15", "sub": "21CS52", "fac": rajesh_fac},
            {"day": "Friday", "start": "12:15", "end": "13:15", "sub": "21RMI56", "fac": hod_fac},
            {"day": "Friday", "start": "14:00", "end": "15:00", "sub": "21NSS59", "fac": ramesh_fac},

            # Saturday - Section A (CS-303)
            {"day": "Saturday", "start": "09:00", "end": "10:00", "sub": "21CS55", "fac": ramesh_fac},
            {"day": "Saturday", "start": "10:00", "end": "11:00", "sub": "21CSP57", "fac": sneha_fac},
            {"day": "Saturday", "start": "11:15", "end": "12:15", "sub": "21CS51", "fac": ananya_fac},
        ]

        timetable_slots_b = [
            # Monday - Section B (CS-304)
            {"day": "Monday", "start": "09:00", "end": "10:00", "sub": "21CS52", "fac": rajesh_fac},
            {"day": "Monday", "start": "10:00", "end": "11:00", "sub": "21CS51", "fac": ananya_fac},
            {"day": "Monday", "start": "11:15", "end": "12:15", "sub": "21CS55", "fac": ramesh_fac},
            {"day": "Monday", "start": "12:15", "end": "13:15", "sub": "21CS53", "fac": hod_fac},
            {"day": "Monday", "start": "14:00", "end": "16:00", "sub": "21CSP57", "fac": sneha_fac},

            # Tuesday - Section B (CS-304)
            {"day": "Tuesday", "start": "09:00", "end": "10:00", "sub": "21CS51", "fac": ananya_fac},
            {"day": "Tuesday", "start": "10:00", "end": "11:00", "sub": "21CS52", "fac": rajesh_fac},
            {"day": "Tuesday", "start": "11:15", "end": "12:15", "sub": "21CS53", "fac": hod_fac},
            {"day": "Tuesday", "start": "12:15", "end": "13:15", "sub": "21RMI56", "fac": hod_fac},
            {"day": "Tuesday", "start": "14:00", "end": "16:00", "sub": "21CSL58", "fac": divya_fac},

            # Wednesday - Section B (CS-304)
            {"day": "Wednesday", "start": "09:00", "end": "10:00", "sub": "21CS53", "fac": hod_fac},
            {"day": "Wednesday", "start": "10:00", "end": "11:00", "sub": "21CS55", "fac": ramesh_fac},
            {"day": "Wednesday", "start": "11:15", "end": "12:15", "sub": "21CS52", "fac": rajesh_fac},
            {"day": "Wednesday", "start": "12:15", "end": "13:15", "sub": "21CS51", "fac": ananya_fac},
            {"day": "Wednesday", "start": "14:00", "end": "15:00", "sub": "21CIV59", "fac": sneha_fac},

            # Thursday - Section B (CS-304)
            {"day": "Thursday", "start": "09:00", "end": "10:00", "sub": "21CS55", "fac": ramesh_fac},
            {"day": "Thursday", "start": "10:00", "end": "11:00", "sub": "21CS51", "fac": ananya_fac},
            {"day": "Thursday", "start": "11:15", "end": "12:15", "sub": "21CS52", "fac": rajesh_fac},
            {"day": "Thursday", "start": "12:15", "end": "13:15", "sub": "21RMI56", "fac": hod_fac},
            {"day": "Thursday", "start": "14:00", "end": "15:00", "sub": "21NSS59", "fac": ramesh_fac},

            # Friday - Section B (CS-304)
            {"day": "Friday", "start": "09:00", "end": "10:00", "sub": "21CS52", "fac": rajesh_fac},
            {"day": "Friday", "start": "10:00", "end": "11:00", "sub": "21CS53", "fac": hod_fac},
            {"day": "Friday", "start": "11:15", "end": "12:15", "sub": "21CS51", "fac": ananya_fac},
            {"day": "Friday", "start": "12:15", "end": "13:15", "sub": "21CIV59", "fac": sneha_fac},
            {"day": "Friday", "start": "14:00", "end": "16:00", "sub": "21CSL58", "fac": divya_fac},

            # Saturday - Section B (CS-304)
            {"day": "Saturday", "start": "09:00", "end": "10:00", "sub": "21CS53", "fac": hod_fac},
            {"day": "Saturday", "start": "10:00", "end": "11:00", "sub": "21CS55", "fac": ramesh_fac},
            {"day": "Saturday", "start": "11:15", "end": "12:15", "sub": "21CSP57", "fac": sneha_fac},
        ]

        # Clear and insert timetable entries
        db.query(Timetable).delete()
        db.commit()

        # Insert Section A (Room CS-303)
        for slot in timetable_slots_a:
            subj = subject_map[slot["sub"]]
            tt_entry = Timetable(
                department_id=dept.id,
                semester=5,
                section="A",
                day=slot["day"],
                start_time=slot["start"],
                end_time=slot["end"],
                subject_id=subj.id,
                faculty_id=slot["fac"].id,
                room_number="CS-303"
            )
            db.add(tt_entry)

        # Insert Section B (Room CS-304)
        for slot in timetable_slots_b:
            subj = subject_map[slot["sub"]]
            tt_entry = Timetable(
                department_id=dept.id,
                semester=5,
                section="B",
                day=slot["day"],
                start_time=slot["start"],
                end_time=slot["end"],
                subject_id=subj.id,
                faculty_id=slot["fac"].id,
                room_number="CS-304"
            )
            db.add(tt_entry)

        db.commit()
        print(f"[+] Timetable imported: {len(timetable_slots_a)} slots for Section A (CS-303) and {len(timetable_slots_b)} slots for Section B (CS-304)")

        # 5. Seed Attendance Data
        students = db.query(Student).all()
        subjects = db.query(Subject).all()
        today = date.today()

        existing_attendance_count = db.query(Attendance).count()
        if existing_attendance_count < 10 and students and subjects:
            for s in students:
                for subj in subjects:
                    # Create 5 historical attendance records for each subject
                    for days_ago in range(1, 6):
                        d_str = (today - timedelta(days=days_ago)).isoformat()
                        status_val = "present" if days_ago % 5 != 0 else "absent"
                        att = Attendance(
                            student_id=s.id,
                            subject_id=subj.id,
                            faculty_id=subj.faculty_id or ananya_fac.id,
                            date=d_str,
                            status=status_val,
                            check_in_time=datetime.utcnow() - timedelta(days=days_ago),
                            latitude=settings.DEPARTMENT_LATITUDE + 0.0001,
                            longitude=settings.DEPARTMENT_LONGITUDE + 0.0001,
                            remarks="Verified on campus geofence"
                        )
                        db.add(att)
            db.commit()
            print(f"[+] Pre-seeded realistic student attendance records for percentage & statistics calculation")

        # 6. Seed Notices
        notices_to_seed = [
            {
                "title": "Odd Semester 2026–2027 Academic Schedule Released",
                "description": "Welcome to 5th Semester ODD SEM. Regular classes for Sections A (Room CS-303) and B (Room CS-304) commence as per the published department timetable.",
                "target_role": "all",
                "created_by": created_users["hod.cse@campus.edu"].id,
            },
            {
                "title": "Web Technology Lab (21CSL58) Batches & Setup",
                "description": "Students must bring their lab manuals and verify their local Node/Python environments for the upcoming practical sessions in Turing Lab.",
                "target_role": "student",
                "created_by": created_users["divya.menon@faculty.campus.edu"].id,
            },
            {
                "title": "Department Faculty Meeting - NAAC & Curriculum Review",
                "description": "All CSE department faculty members are requested to attend the meeting on Saturday at 03:00 PM in the Conference Hall.",
                "target_role": "faculty",
                "created_by": created_users["hod.cse@campus.edu"].id,
            },
        ]

        for ndata in notices_to_seed:
            existing_notice = db.query(Notice).filter(Notice.title == ndata["title"]).first()
            if not existing_notice:
                notice = Notice(
                    title=ndata["title"],
                    description=ndata["description"],
                    created_by=ndata["created_by"],
                    target_role=ndata["target_role"],
                )
                db.add(notice)
        db.commit()
        print(f"[+] Department announcements and notices seeded successfully")

        # 7. Seed Location Coordinates for users
        for u in db.query(User).filter(User.role == "student").all():
            loc = Location(
                user_id=u.id,
                latitude=settings.DEPARTMENT_LATITUDE,
                longitude=settings.DEPARTMENT_LONGITUDE,
                accuracy=5.0,
                timestamp=datetime.utcnow(),
                location_type="device"
            )
            db.add(loc)
        db.commit()
        print(f"[+] Live device locations initialized within campus geofence")

        print("=" * 60)
        print("DATABASE SEED COMPLETED SUCCESSFULLY!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"[-] Error while seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
