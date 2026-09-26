"""
Smart Department Academic Management System - Seed Data Script
Master Source: Real 5th Semester ODD (2026-2027) Timetable & Academic Records
Department: Computer Science and Engineering (CSE)
Sections: 5A (CS-303) and 5B (CS-304)
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models import (
    Department, Teacher, Subject, Room, Timetable, User, Student,
    Attendance, AttendanceSession, AttendanceInterval, StudentAttendance,
    StudentFace, StudentBiometric
)
from app.auth import get_password_hash
import json
import hashlib



def seed_database():
    print("=" * 60)
    print("[*] SEEDING REAL TIMETABLE DATA INTO SMART DEPARTMENT DATABASE")
    print("=" * 60)

    # 1. Cleanly recreate the tables with the updated schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 2. Seed Department
        dept = db.query(Department).filter(Department.code == "CSE").first()
        if not dept:
            dept = Department(
                name="Computer Science and Engineering",
                code="CSE",
                description="Department of Computer Science and Engineering, Academic Year 2026-2027",
                status="active"
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            print(f"[+] Department: {dept.name} ({dept.code}) [ID: {dept.id}]")
        else:
            dept.name = "Computer Science and Engineering"
            dept.status = "active"
            db.commit()
            print(f"[*] Department exists: {dept.name} ({dept.code}) [ID: {dept.id}]")

        # 3. Seed Rooms
        rooms_data = [
            {"room_name": "CS-303", "room_type": "Classroom", "capacity": 65},
            {"room_name": "CS-304", "room_type": "Classroom", "capacity": 65},
            {"room_name": "WT-LAB", "room_type": "Laboratory", "capacity": 40},
            {"room_name": "MP-LAB", "room_type": "Laboratory", "capacity": 40},
            {"room_name": "AUD-01", "room_type": "Auditorium", "capacity": 120},
        ]
        room_map = {}
        for rdata in rooms_data:
            room = db.query(Room).filter(Room.room_name == rdata["room_name"]).first()
            if not room:
                room = Room(
                    room_name=rdata["room_name"],
                    room_type=rdata["room_type"],
                    capacity=rdata["capacity"],
                    status="active"
                )
                db.add(room)
                db.commit()
                db.refresh(room)
                print(f"[+] Room: {room.room_name} ({room.room_type}) [ID: {room.id}]")
            else:
                room.room_type = rdata["room_type"]
                room.capacity = rdata["capacity"]
                room.status = "active"
                db.commit()
            room_map[rdata["room_name"]] = room

        # 4. Seed Real Teachers
        teachers_data = [
            {
                "name": "Dr. Vikramaditya Sen",
                "email": "hod.cse@campus.edu",
                "employee_id": "FAC-CSE-000",
                "designation": "Professor & Head of Department",
                "phone": "+91 98765 00002"
            },
            {
                "name": "Prof. Ananya Iyer",
                "email": "ananya.iyer@faculty.campus.edu",
                "employee_id": "FAC-CSE-001",
                "designation": "Associate Professor",
                "phone": "+91 98765 10001"
            },
            {
                "name": "Dr. Rajesh Kumar",
                "email": "rajesh.kumar@faculty.campus.edu",
                "employee_id": "FAC-CSE-002",
                "designation": "Professor",
                "phone": "+91 98765 10002"
            },
            {
                "name": "Prof. Divya Menon",
                "email": "divya.menon@faculty.campus.edu",
                "employee_id": "FAC-CSE-003",
                "designation": "Assistant Professor",
                "phone": "+91 98765 10003"
            },
            {
                "name": "Prof. Ramesh Kulkarni",
                "email": "ramesh.kulkarni@faculty.campus.edu",
                "employee_id": "FAC-CSE-004",
                "designation": "Associate Professor",
                "phone": "+91 98765 10004"
            },
            {
                "name": "Prof. Sneha Reddy",
                "email": "sneha.reddy@faculty.campus.edu",
                "employee_id": "FAC-CSE-005",
                "designation": "Assistant Professor",
                "phone": "+91 98765 10005"
            },
        ]
        teacher_map = {}
        for tdata in teachers_data:
            teacher = db.query(Teacher).filter(
                (Teacher.employee_id == tdata["employee_id"]) | (Teacher.name == tdata["name"])
            ).first()
            if not teacher:
                teacher = Teacher(
                    name=tdata["name"],
                    email=tdata["email"],
                    employee_id=tdata["employee_id"],
                    department_id=dept.id,
                    designation=tdata["designation"],
                    phone=tdata["phone"],
                    status="active"
                )
                db.add(teacher)
                db.commit()
                db.refresh(teacher)
                print(f"[+] Teacher: {teacher.name} ({teacher.employee_id}) [ID: {teacher.id}]")
            else:
                teacher.name = tdata["name"]
                teacher.email = tdata["email"]
                teacher.employee_id = tdata["employee_id"]
                teacher.department_id = dept.id
                teacher.designation = tdata["designation"]
                teacher.status = "active"
                db.commit()
            teacher_map[tdata["name"]] = teacher
            teacher_map[tdata["employee_id"]] = teacher

        # 5. Seed Real 5th Semester Subjects
        subjects_data = [
            {
                "code": "21CS51",
                "name": "Software Engineering & Project Management",
                "credits": 4,
                "semester": 5,
                "teacher": teacher_map["Prof. Ananya Iyer"]
            },
            {
                "code": "21CS52",
                "name": "Computer Networks",
                "credits": 4,
                "semester": 5,
                "teacher": teacher_map["Dr. Rajesh Kumar"]
            },
            {
                "code": "21CS53",
                "name": "Theory of Computation",
                "credits": 4,
                "semester": 5,
                "teacher": teacher_map["Dr. Vikramaditya Sen"]
            },
            {
                "code": "21CSL58",
                "name": "Web Technology Lab",
                "credits": 2,
                "semester": 5,
                "teacher": teacher_map["Prof. Divya Menon"]
            },
            {
                "code": "21CS55",
                "name": "Unix System Programming",
                "credits": 3,
                "semester": 5,
                "teacher": teacher_map["Prof. Ramesh Kulkarni"]
            },
            {
                "code": "21CSP57",
                "name": "Mini Project",
                "credits": 2,
                "semester": 5,
                "teacher": teacher_map["Prof. Sneha Reddy"]
            },
            {
                "code": "21RMI56",
                "name": "Research Methodology and IPR",
                "credits": 3,
                "semester": 5,
                "teacher": teacher_map["Dr. Vikramaditya Sen"]
            },
            {
                "code": "21CIV59",
                "name": "Environmental Studies and E-waste Management",
                "credits": 2,
                "semester": 5,
                "teacher": teacher_map["Prof. Sneha Reddy"]
            },
            {
                "code": "21NSS59",
                "name": "National Service Scheme",
                "credits": 1,
                "semester": 5,
                "teacher": teacher_map["Prof. Ramesh Kulkarni"]
            },
        ]
        subject_map = {}
        for sdata in subjects_data:
            subject = db.query(Subject).filter(
                (Subject.subject_code == sdata["code"]) | (Subject.subject_name == sdata["name"])
            ).first()
            if not subject:
                subject = Subject(
                    subject_code=sdata["code"],
                    subject_name=sdata["name"],
                    department_id=dept.id,
                    semester=sdata["semester"],
                    credits=sdata["credits"],
                    teacher_id=sdata["teacher"].id if sdata["teacher"] else None,
                    status="active"
                )
                db.add(subject)
                db.commit()
                db.refresh(subject)
                print(f"[+] Subject: {subject.subject_code} - {subject.subject_name} [ID: {subject.id}]")
            else:
                subject.subject_code = sdata["code"]
                subject.subject_name = sdata["name"]
                subject.department_id = dept.id
                subject.semester = sdata["semester"]
                subject.credits = sdata["credits"]
                subject.teacher_id = sdata["teacher"].id if sdata["teacher"] else None
                subject.status = "active"
                db.commit()
            subject_map[sdata["code"]] = subject
            subject_map[sdata["name"]] = subject

        # 6. Seed Users for Auth & Role-based Access
        hashed_pwd = get_password_hash("password123")
        users_to_seed = [
            # Admin
            {
                "email": "admin@campus.edu",
                "name": "System Administrator",
                "role": "admin",
                "department_id": dept.id,
                "teacher_id": None,
                "semester": None,
                "section": None,
                "phone": "+91 98765 00001",
            },
            # HOD
            {
                "email": "hod.cse@campus.edu",
                "name": "Dr. Vikramaditya Sen",
                "role": "hod",
                "department_id": dept.id,
                "teacher_id": teacher_map["Dr. Vikramaditya Sen"].id,
                "semester": None,
                "section": None,
                "phone": "+91 98765 00002",
            },
            # Teachers
            {
                "email": "ananya.iyer@faculty.campus.edu",
                "name": "Prof. Ananya Iyer",
                "role": "teacher",
                "department_id": dept.id,
                "teacher_id": teacher_map["Prof. Ananya Iyer"].id,
                "semester": None,
                "section": None,
                "phone": "+91 98765 10001",
            },
            {
                "email": "rajesh.kumar@faculty.campus.edu",
                "name": "Dr. Rajesh Kumar",
                "role": "teacher",
                "department_id": dept.id,
                "teacher_id": teacher_map["Dr. Rajesh Kumar"].id,
                "semester": None,
                "section": None,
                "phone": "+91 98765 10002",
            },
            {
                "email": "divya.menon@faculty.campus.edu",
                "name": "Prof. Divya Menon",
                "role": "teacher",
                "department_id": dept.id,
                "teacher_id": teacher_map["Prof. Divya Menon"].id,
                "semester": None,
                "section": None,
                "phone": "+91 98765 10003",
            },
            {
                "email": "ramesh.kulkarni@faculty.campus.edu",
                "name": "Prof. Ramesh Kulkarni",
                "role": "teacher",
                "department_id": dept.id,
                "teacher_id": teacher_map["Prof. Ramesh Kulkarni"].id,
                "semester": None,
                "section": None,
                "phone": "+91 98765 10004",
            },
            {
                "email": "sneha.reddy@faculty.campus.edu",
                "name": "Prof. Sneha Reddy",
                "role": "teacher",
                "department_id": dept.id,
                "teacher_id": teacher_map["Prof. Sneha Reddy"].id,
                "semester": None,
                "section": None,
                "phone": "+91 98765 10005",
            },
            # Students (Section A)
            {"email": "aarav.sharma@college.edu", "name": "Aarav Sharma", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS001", "phone": "+91 98765 20001"},
            {"email": "aditi.rao@college.edu", "name": "Aditi Rao", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS002", "phone": "+91 98765 20002"},
            {"email": "ananya.sen@college.edu", "name": "Ananya Sen", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS003", "phone": "+91 98765 20003"},
            {"email": "bhavya.nair@college.edu", "name": "Bhavya Nair", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS004", "phone": "+91 98765 20004"},
            {"email": "chethan.gowda@college.edu", "name": "Chethan Gowda", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS005", "phone": "+91 98765 20005"},
            {"email": "deepa.joshi@college.edu", "name": "Deepa Joshi", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS006", "phone": "+91 98765 20006"},
            {"email": "harshitha.k@college.edu", "name": "Harshitha K", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS007", "phone": "+91 98765 20007"},
            {"email": "karthik.dk@college.edu", "name": "Karthik D K", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS008", "phone": "+91 98765 20008"},
            {"email": "amulya.h.s@mitt.ac.in", "name": "Amulya H S", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS015", "phone": "+91 98765 20015"},
            {"email": "mohammed.farhan@college.edu", "name": "Mohammed Farhan", "role": "student", "department_id": dept.id, "semester": 5, "section": "A", "usn": "4MT22CS018", "phone": "+91 98765 20018"},

            # Students (Section B)
            {"email": "priya.patel@college.edu", "name": "Priya Patel", "role": "student", "department_id": dept.id, "semester": 5, "section": "B", "usn": "4MT22CS031", "phone": "+91 98765 20031"},
            {"email": "rohan.gupta@college.edu", "name": "Rohan Gupta", "role": "student", "department_id": dept.id, "semester": 5, "section": "B", "usn": "4MT22CS032", "phone": "+91 98765 20032"},
            {"email": "sanjana.hegde@college.edu", "name": "Sanjana Hegde", "role": "student", "department_id": dept.id, "semester": 5, "section": "B", "usn": "4MT22CS033", "phone": "+91 98765 20033"},
            {"email": "tarun.bhat@college.edu", "name": "Tarun Bhat", "role": "student", "department_id": dept.id, "semester": 5, "section": "B", "usn": "4MT22CS034", "phone": "+91 98765 20034"},
            {"email": "varun.prabhu@college.edu", "name": "Varun Prabhu", "role": "student", "department_id": dept.id, "semester": 5, "section": "B", "usn": "4MT22CS035", "phone": "+91 98765 20035"},
            {"email": "yashaswini.m@college.edu", "name": "Yashaswini M", "role": "student", "department_id": dept.id, "semester": 5, "section": "B", "usn": "4MT22CS036", "phone": "+91 98765 20036"},
            {"email": "abhishek.jain@college.edu", "name": "Abhishek Jain", "role": "student", "department_id": dept.id, "semester": 5, "section": "B", "usn": "4MT22CS037", "phone": "+91 98765 20037"},
            {"email": "meera.pillai@college.edu", "name": "Meera Pillai", "role": "student", "department_id": dept.id, "semester": 5, "section": "B", "usn": "4MT22CS038", "phone": "+91 98765 20038"},
        ]

        for udata in users_to_seed:
            user = db.query(User).filter(User.email == udata["email"]).first()
            if not user:
                user = User(
                    email=udata["email"],
                    password_hash=hashed_pwd,
                    name=udata["name"],
                    role=udata["role"],
                    department_id=udata.get("department_id"),
                    teacher_id=udata.get("teacher_id"),
                    semester=udata.get("semester"),
                    section=udata.get("section"),
                    phone=udata.get("phone"),
                    is_active=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"[+] User: {user.name} ({user.email}) -> Role: {user.role}")
            else:
                user.name = udata["name"]
                user.role = udata["role"]
                user.password_hash = hashed_pwd
                user.department_id = udata.get("department_id")
                user.teacher_id = udata.get("teacher_id")
                user.semester = udata.get("semester")
                user.section = udata.get("section")
                user.is_active = True
                db.commit()

            # Create or update Student record if student role
            if udata["role"] == "student" and "usn" in udata:
                student = db.query(Student).filter(Student.usn == udata["usn"]).first()
                if not student:
                    student = Student(
                        usn=udata["usn"],
                        name=udata["name"],
                        email=udata["email"],
                        phone=udata.get("phone"),
                        semester=udata["semester"],
                        section=udata["section"],
                        department_id=dept.id,
                        user_id=user.id,
                    )
                    db.add(student)
                    db.commit()
                    print(f"  [+] Student: {student.name} ({student.usn}) 5{student.section}")
                else:
                    student.name = udata["name"]
                    student.semester = udata["semester"]
                    student.section = udata["section"]
                    student.user_id = user.id
                    db.commit()

        # 7. Seed Real Timetable Entries (5th Semester ODD, Sections 5A & 5B)
        # Period Schedule:
        # P1: 09:00 - 10:00
        # P2: 10:00 - 11:00
        # TEA BREAK: 11:00 - 11:15
        # P3: 11:15 - 12:15
        # P4: 12:15 - 13:15
        # LUNCH BREAK: 13:15 - 14:00
        # P5: 14:00 - 15:00
        # P6: 15:00 - 16:00 (or Lab 14:00 - 16:00)

        raw_timetable_a = [
            # Monday - Section A (Room CS-303)
            {"day": "Monday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-303", "type": "regular"},
            {"day": "Monday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-303", "type": "regular"},
            {"day": "Monday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CS53", "teacher": "Dr. Vikramaditya Sen", "room": "CS-303", "type": "regular"},
            {"day": "Monday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21CS55", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-303", "type": "regular"},
            {"day": "Monday", "period": 5, "start": "14:00", "end": "16:00", "sub": "21CSL58", "teacher": "Prof. Divya Menon", "room": "WT-LAB", "type": "lab"},

            # Tuesday - Section A (Room CS-303)
            {"day": "Tuesday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS53", "teacher": "Dr. Vikramaditya Sen", "room": "CS-303", "type": "regular"},
            {"day": "Tuesday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-303", "type": "regular"},
            {"day": "Tuesday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21RMI56", "teacher": "Dr. Vikramaditya Sen", "room": "CS-303", "type": "regular"},
            {"day": "Tuesday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-303", "type": "regular"},
            {"day": "Tuesday", "period": 5, "start": "14:00", "end": "16:00", "sub": "21CSP57", "teacher": "Prof. Sneha Reddy", "room": "MP-LAB", "type": "practical"},

            # Wednesday - Section A (Room CS-303)
            {"day": "Wednesday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS55", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-303", "type": "regular"},
            {"day": "Wednesday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS53", "teacher": "Dr. Vikramaditya Sen", "room": "CS-303", "type": "regular"},
            {"day": "Wednesday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-303", "type": "regular"},
            {"day": "Wednesday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21CIV59", "teacher": "Prof. Sneha Reddy", "room": "CS-303", "type": "regular"},
            {"day": "Wednesday", "period": 5, "start": "14:00", "end": "15:00", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-303", "type": "regular"},

            # Thursday - Section A (Room CS-303)
            {"day": "Thursday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-303", "type": "regular"},
            {"day": "Thursday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS55", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-303", "type": "regular"},
            {"day": "Thursday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21RMI56", "teacher": "Dr. Vikramaditya Sen", "room": "CS-303", "type": "regular"},
            {"day": "Thursday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21CIV59", "teacher": "Prof. Sneha Reddy", "room": "CS-303", "type": "regular"},
            {"day": "Thursday", "period": 5, "start": "14:00", "end": "16:00", "sub": "21CSL58", "teacher": "Prof. Divya Menon", "room": "WT-LAB", "type": "lab"},

            # Friday - Section A (Room CS-303)
            {"day": "Friday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-303", "type": "regular"},
            {"day": "Friday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS53", "teacher": "Dr. Vikramaditya Sen", "room": "CS-303", "type": "regular"},
            {"day": "Friday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-303", "type": "regular"},
            {"day": "Friday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21RMI56", "teacher": "Dr. Vikramaditya Sen", "room": "CS-303", "type": "regular"},
            {"day": "Friday", "period": 5, "start": "14:00", "end": "15:00", "sub": "21NSS59", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-303", "type": "regular"},

            # Saturday - Section A (Room CS-303)
            {"day": "Saturday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS55", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-303", "type": "regular"},
            {"day": "Saturday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CSP57", "teacher": "Prof. Sneha Reddy", "room": "MP-LAB", "type": "practical"},
            {"day": "Saturday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-303", "type": "regular"},
        ]

        raw_timetable_b = [
            # Monday - Section B (Room CS-304)
            {"day": "Monday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-304", "type": "regular"},
            {"day": "Monday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-304", "type": "regular"},
            {"day": "Monday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CS55", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-304", "type": "regular"},
            {"day": "Monday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21CS53", "teacher": "Dr. Vikramaditya Sen", "room": "CS-304", "type": "regular"},
            {"day": "Monday", "period": 5, "start": "14:00", "end": "16:00", "sub": "21CSP57", "teacher": "Prof. Sneha Reddy", "room": "MP-LAB", "type": "practical"},

            # Tuesday - Section B (Room CS-304)
            {"day": "Tuesday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-304", "type": "regular"},
            {"day": "Tuesday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-304", "type": "regular"},
            {"day": "Tuesday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CS53", "teacher": "Dr. Vikramaditya Sen", "room": "CS-304", "type": "regular"},
            {"day": "Tuesday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21RMI56", "teacher": "Dr. Vikramaditya Sen", "room": "CS-304", "type": "regular"},
            {"day": "Tuesday", "period": 5, "start": "14:00", "end": "16:00", "sub": "21CSL58", "teacher": "Prof. Divya Menon", "room": "WT-LAB", "type": "lab"},

            # Wednesday - Section B (Room CS-304)
            {"day": "Wednesday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS53", "teacher": "Dr. Vikramaditya Sen", "room": "CS-304", "type": "regular"},
            {"day": "Wednesday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS55", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-304", "type": "regular"},
            {"day": "Wednesday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-304", "type": "regular"},
            {"day": "Wednesday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-304", "type": "regular"},
            {"day": "Wednesday", "period": 5, "start": "14:00", "end": "15:00", "sub": "21CIV59", "teacher": "Prof. Sneha Reddy", "room": "CS-304", "type": "regular"},

            # Thursday - Section B (Room CS-304)
            {"day": "Thursday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS55", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-304", "type": "regular"},
            {"day": "Thursday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-304", "type": "regular"},
            {"day": "Thursday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-304", "type": "regular"},
            {"day": "Thursday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21RMI56", "teacher": "Dr. Vikramaditya Sen", "room": "CS-304", "type": "regular"},
            {"day": "Thursday", "period": 5, "start": "14:00", "end": "15:00", "sub": "21NSS59", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-304", "type": "regular"},

            # Friday - Section B (Room CS-304)
            {"day": "Friday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS52", "teacher": "Dr. Rajesh Kumar", "room": "CS-304", "type": "regular"},
            {"day": "Friday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS53", "teacher": "Dr. Vikramaditya Sen", "room": "CS-304", "type": "regular"},
            {"day": "Friday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CS51", "teacher": "Prof. Ananya Iyer", "room": "CS-304", "type": "regular"},
            {"day": "Friday", "period": 4, "start": "12:15", "end": "13:15", "sub": "21CIV59", "teacher": "Prof. Sneha Reddy", "room": "CS-304", "type": "regular"},
            {"day": "Friday", "period": 5, "start": "14:00", "end": "16:00", "sub": "21CSL58", "teacher": "Prof. Divya Menon", "room": "WT-LAB", "type": "lab"},

            # Saturday - Section B (Room CS-304)
            {"day": "Saturday", "period": 1, "start": "09:00", "end": "10:00", "sub": "21CS53", "teacher": "Dr. Vikramaditya Sen", "room": "CS-304", "type": "regular"},
            {"day": "Saturday", "period": 2, "start": "10:00", "end": "11:00", "sub": "21CS55", "teacher": "Prof. Ramesh Kulkarni", "room": "CS-304", "type": "regular"},
            {"day": "Saturday", "period": 3, "start": "11:15", "end": "12:15", "sub": "21CSP57", "teacher": "Prof. Sneha Reddy", "room": "MP-LAB", "type": "practical"},
        ]

        # Clear existing timetables before clean seed
        deleted_count = db.query(Timetable).delete()
        db.commit()
        print(f"[*] Cleared {deleted_count} previous timetable records.")

        total_inserted = 0

        # Insert Section A
        for slot in raw_timetable_a:
            subj = subject_map[slot["sub"]]
            teach = teacher_map[slot["teacher"]]
            rm = room_map[slot["room"]]

            tt_entry = Timetable(
                department_id=dept.id,
                semester=5,
                section="A",
                day=slot["day"],
                period_number=slot["period"],
                start_time=slot["start"],
                end_time=slot["end"],
                subject_id=subj.id,
                teacher_id=teach.id,
                room_id=rm.id,
                timetable_type=slot["type"],
                status="active"
            )
            db.add(tt_entry)
            total_inserted += 1

        # Insert Section B
        for slot in raw_timetable_b:
            subj = subject_map[slot["sub"]]
            teach = teacher_map[slot["teacher"]]
            rm = room_map[slot["room"]]

            tt_entry = Timetable(
                department_id=dept.id,
                semester=5,
                section="B",
                day=slot["day"],
                period_number=slot["period"],
                start_time=slot["start"],
                end_time=slot["end"],
                subject_id=subj.id,
                teacher_id=teach.id,
                room_id=rm.id,
                timetable_type=slot["type"],
                status="active"
            )
            db.add(tt_entry)
            total_inserted += 1

        db.commit()
        print(f"\n[+] SUCCESS: Inserted {total_inserted} real timetable slots for 5th Sem ODD (Sections A & B)!")

        # 8. Seed Realistic Timetable Attendance for past days (strictly derived from timetable entries)
        print("[*] Pre-seeding historical attendance strictly derived from timetable sessions with 30-minute intervals...")
        past_dates = [
            ("2026-09-21", "Monday"),
            ("2026-09-22", "Tuesday"),
            ("2026-09-23", "Wednesday"),
        ]
        att_count = 0
        session_count = 0
        interval_count = 0

        def parse_time(t_str):
            try:
                return datetime.strptime(t_str.strip(), "%H:%M")
            except Exception:
                return datetime.strptime("09:00", "%H:%M")

        for p_date, p_day in past_dates:
            slots_for_day = db.query(Timetable).filter(Timetable.day == p_day, Timetable.status == "active").all()
            for s in slots_for_day:
                students_in_slot = db.query(Student).filter(
                    Student.semester == s.semester,
                    Student.section == s.section
                ).all()

                # 1. Create AttendanceSession
                att_session = AttendanceSession(
                    timetable_id=s.id,
                    date=p_date,
                    start_time=s.start_time,
                    end_time=s.end_time,
                    created_at=datetime.utcnow()
                )
                db.add(att_session)
                db.flush()
                session_count += 1

                # 2. Split into 30-minute intervals
                t_start = parse_time(s.start_time)
                t_end = parse_time(s.end_time)
                curr = t_start
                dur_num = 1
                intervals_for_slot = []

                while curr < t_end:
                    nxt = curr + timedelta(minutes=30)
                    step_end = min(nxt, t_end)
                    dur_m = max(1, int((step_end - curr).total_seconds() / 60))

                    interval_obj = AttendanceInterval(
                        attendance_session_id=att_session.id,
                        duration_number=dur_num,
                        start_time=curr.strftime("%H:%M"),
                        end_time=step_end.strftime("%H:%M"),
                        duration_minutes=dur_m
                    )
                    db.add(interval_obj)
                    db.flush()
                    intervals_for_slot.append(interval_obj)
                    interval_count += 1
                    curr = nxt
                    dur_num += 1

                # 3. For each interval, mark each student Present or Absent
                for int_obj in intervals_for_slot:
                    for idx, std in enumerate(students_in_slot):
                        status_val = "Absent" if (idx + len(p_day) + int_obj.duration_number) % 7 == 0 else "Present"
                        methods_cycle = ["FACE", "BIOMETRIC", "MANUAL", "FACE"]
                        method_val = methods_cycle[(idx + int_obj.duration_number) % len(methods_cycle)] if status_val == "Present" else "MANUAL"
                        st_att = StudentAttendance(
                            attendance_session_id=att_session.id,
                            attendance_interval_id=int_obj.id,
                            student_id=std.id,
                            status=status_val,
                            attendance_method=method_val,
                            marked_at=datetime.utcnow()
                        )
                        db.add(st_att)
                        att_count += 1

                # 4. Legacy Attendance record for backwards compatibility
                for idx, std in enumerate(students_in_slot):
                    legacy_status = "Absent" if (idx + len(p_day)) % 7 == 0 else "Present"
                    leg_method = "FACE" if (idx % 2 == 0) else "BIOMETRIC" if legacy_status == "Present" else "MANUAL"
                    att = Attendance(
                        student_id=std.id,
                        timetable_id=s.id,
                        teacher_id=s.teacher_id,
                        subject_id=s.subject_id,
                        date=p_date,
                        start_time=s.start_time,
                        end_time=s.end_time,
                        status=legacy_status,
                        attendance_method=leg_method if legacy_status == "Present" else "MANUAL",
                        marked_at=datetime.utcnow()
                    )
                    db.add(att)

        # 5. Seed Student Face and Biometric Profiles
        all_students = db.query(Student).all()
        for idx, stu in enumerate(all_students):
            # Deterministic distinct 128-dimensional embedding for testing
            v = [float((((idx + 1) * (i + 1) * 31) % 100) / 100.0) for i in range(128)]
            norm = sum(x * x for x in v) ** 0.5 or 1.0
            norm_v = [round(x / norm, 6) for x in v]

            face = StudentFace(
                student_id=stu.id,
                embedding=json.dumps(norm_v),
                quality_score="high"
            )
            db.add(face)

            bio_hash = hashlib.sha256(f"BIOMETRIC_TEMPLATE_STUDENT_{stu.id}_{stu.usn}".encode("utf-8")).hexdigest()
            bio = StudentBiometric(
                student_id=stu.id,
                template_hash=bio_hash,
                provider="DEVELOPMENT_MOCK",
                status="active"
            )
            db.add(bio)

        db.commit()
        print(f"[+] Inserted {session_count} attendance sessions, {interval_count} 30-min intervals, and {att_count} student attendance records!")
        print(f"[+] Seeded Face and Biometric profiles for {len(all_students)} students.")
        print("=" * 60)


    except Exception as e:
        db.rollback()
        print(f"[!] Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
