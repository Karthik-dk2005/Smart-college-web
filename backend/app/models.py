import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # student, teacher, hod, admin
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    usn = Column(String(50), unique=True, index=True, nullable=False)
    roll_no = Column(String(50), nullable=True)
    department = Column(String(100), default="Computer Science & Engineering")
    semester = Column(Integer, default=1)
    section = Column(String(10), default="A")
    academic_year = Column(String(50), default="2024-2025")
    admission_number = Column(String(50), nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, INACTIVE, GRADUATED, SUSPENDED
    cgpa = Column(Float, default=0.0)
    date_of_birth = Column(String(50), nullable=True)
    blood_group = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    guardian_name = Column(String(255), nullable=True)
    guardian_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    attendances = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("AssignmentSubmission", back_populates="student", cascade="all, delete-orphan")
    academic_records = relationship("AcademicRecord", back_populates="student", cascade="all, delete-orphan")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    faculty_id = Column(String(50), unique=True, index=True, nullable=False)
    department = Column(String(100), default="Computer Science & Engineering")
    designation = Column(String(100), default="Assistant Professor")
    qualification = Column(String(255), nullable=True)
    specialization = Column(String(255), nullable=True)
    office_location = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, INACTIVE
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="teacher_profile")
    subjects = relationship("Subject", back_populates="teacher")
    sessions = relationship("Session", back_populates="teacher")
    timetables = relationship("Timetable", foreign_keys="[Timetable.teacher_id]", back_populates="teacher")
    assignments = relationship("Assignment", back_populates="teacher")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(100), default="Computer Science & Engineering")
    semester = Column(Integer, nullable=False)
    credits = Column(Integer, default=4)
    type = Column(String(50), default="Theory")  # Theory, Lab, Elective, Project
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    teacher = relationship("Teacher", back_populates="subjects")
    sessions = relationship("Session", back_populates="subject")
    timetables = relationship("Timetable", back_populates="subject")
    exams = relationship("Exam", back_populates="subject")
    marks = relationship("Mark", back_populates="subject")
    materials = relationship("StudyMaterial", back_populates="subject")
    assignments = relationship("Assignment", back_populates="subject")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, index=True, nullable=False)
    building = Column(String(100), default="Turing Block")
    floor = Column(String(50), default="2nd Floor")
    room_type = Column(String(50), default="Classroom")  # Classroom, Laboratory, Seminar Hall, Auditorium
    capacity = Column(Integer, default=60)
    is_available = Column(Boolean, default=True)
    status = Column(String(50), default="Available")  # Available, Occupied, Maintenance
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sessions = relationship("Session", back_populates="room")
    timetables = relationship("Timetable", back_populates="room")
    exams = relationship("Exam", back_populates="room")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)  # e.g. SESSION-2026-000001
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    date = Column(String(20), default=lambda: datetime.date.today().isoformat())
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=False)
    status = Column(String(50), default="ACTIVE")  # SCHEDULED, ACTIVE, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="sessions")
    teacher = relationship("Teacher", back_populates="sessions")
    room = relationship("Room", back_populates="sessions")
    attendances = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    status = Column(String(50), default="PRESENT")  # PRESENT, ABSENT, LATE
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    distance_meters = Column(Float, nullable=True)
    device_verified = Column(Boolean, default=False)
    verification_hash = Column(String(255), nullable=True)
    verification_method = Column(String(100), default="LIVE_GPS_GEOFENCE_VERIFIED")
    check_in_time = Column(DateTime, default=datetime.datetime.utcnow)
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    session = relationship("Session", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    department = Column(String(100), default="Computer Science & Engineering")
    semester = Column(Integer, nullable=False)
    section = Column(String(10), default="A")
    day_of_week = Column(String(50), nullable=False)  # Monday, Tuesday, ...
    start_time = Column(String(50), nullable=False)   # e.g. 09:00
    end_time = Column(String(50), nullable=False)     # e.g. 10:00
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    is_temporary_change = Column(Boolean, default=False)
    substitute_teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    change_reason = Column(String(255), nullable=True)
    approved_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="timetables")
    teacher = relationship("Teacher", foreign_keys=[teacher_id], back_populates="timetables")
    substitute_teacher = relationship("Teacher", foreign_keys=[substitute_teacher_id])
    room = relationship("Room", back_populates="timetables")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    exam_title = Column(String(255), nullable=False)
    exam_type = Column(String(50), default="Internal Assessment 1")  # Internal Assessment 1, 2, Semester End Exam, Lab Exam
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    date = Column(String(50), nullable=False)
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    max_marks = Column(Integer, default=50)
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="exams")
    room = relationship("Room", back_populates="exams")


class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    exam_type = Column(String(50), default="Internal Assessment 1")
    ia1_score = Column(Float, default=0.0)
    ia2_score = Column(Float, default=0.0)
    assignment_score = Column(Float, default=0.0)
    test_score = Column(Float, default=0.0)
    quiz_score = Column(Float, default=0.0)
    semester_exam_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    max_total = Column(Float, default=100.0)
    grade_letter = Column(String(10), default="F")  # O, A+, A, B+, B, C, F
    status = Column(String(50), default="DRAFT")    # DRAFT, SUBMITTED, FINALIZED
    evaluated_by_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    finalized_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    deadline = Column(String(50), nullable=False)
    max_marks = Column(Integer, default=20)
    attachment_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="assignments")
    teacher = relationship("Teacher", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    submission_text = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String(50), default="SUBMITTED")  # SUBMITTED, EVALUATED, LATE

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="submissions")


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    unit = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    material_type = Column(String(50), default="PDF Notes")  # PDF Notes, Lecture Slides, Question Bank, Lab Manual
    file_url = Column(String(500), nullable=False)
    important_questions_attached = Column(Boolean, default=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="materials")


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="Academic")  # Academic, Administrative, Examination, Event
    priority = Column(String(50), default="Normal")    # Normal, Important, Urgent
    department = Column(String(100), default="All")
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    attachment_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="general")  # attendance, timetable, exams, marks, notices, room
    read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class BusRoute(Base):
    __tablename__ = "bus_routes"

    id = Column(Integer, primary_key=True, index=True)
    bus_number = Column(String(50), unique=True, index=True, nullable=False)
    route_number = Column(String(50), unique=True, index=True, nullable=False)
    route_name = Column(String(255), nullable=False)
    driver_name = Column(String(100), nullable=True)
    driver_phone = Column(String(50), nullable=True)
    capacity = Column(Integer, default=50)
    stops = Column(Text, nullable=False)
    morning_timing = Column(String(100), nullable=False)
    evening_timing = Column(String(100), nullable=False)
    weekday_schedule = Column(String(255), default="Active Mon-Fri")
    weekend_schedule = Column(String(255), default="Saturday Morning Only")
    holiday_schedule = Column(String(255), default="No Service")
    special_schedule = Column(String(255), default="Special Exam Service on request")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AcademicRecord(Base):
    __tablename__ = "academic_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(50), default="2024-2025")
    sgpa = Column(Float, default=0.0)
    credits_earned = Column(Integer, default=24)
    attendance_percentage = Column(Float, default=90.0)
    result_status = Column(String(50), default="PASSED")  # PASSED, WITH_DISTINCTION, BACKLOGS, PURSUING
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="academic_records")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    module = Column(String(100), nullable=False)
    record_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
