from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


# Standard API Response wrapper
class ApiResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None


# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = "student"  # student, teacher, hod, admin
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    email: str
    full_name: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- STUDENT SCHEMAS ---
class StudentCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = "password123"
    full_name: str
    usn: str
    roll_no: Optional[str] = None
    department: str = "Computer Science & Engineering"
    semester: int = 1
    section: str = "A"
    academic_year: str = "2024-2025"
    admission_number: Optional[str] = None
    cgpa: Optional[float] = 0.0
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    status: Optional[str] = None
    cgpa: Optional[float] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    user_id: int
    usn: str
    roll_no: Optional[str] = None
    department: str
    semester: int
    section: str
    academic_year: str
    admission_number: Optional[str] = None
    status: str
    cgpa: float
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# --- TEACHER SCHEMAS ---
class TeacherCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = "password123"
    full_name: str
    faculty_id: str
    department: str = "Computer Science & Engineering"
    designation: str = "Assistant Professor"
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    office_location: Optional[str] = None
    phone: Optional[str] = None


class TeacherUpdate(BaseModel):
    full_name: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    office_location: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None


class TeacherOut(BaseModel):
    id: int
    user_id: int
    faculty_id: str
    department: str
    designation: str
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    office_location: Optional[str] = None
    phone: Optional[str] = None
    status: str
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# --- SUBJECT SCHEMAS ---
class SubjectCreate(BaseModel):
    code: str
    name: str
    department: str = "Computer Science & Engineering"
    semester: int
    credits: int = 4
    type: str = "Theory"
    teacher_id: Optional[int] = None


class SubjectOut(BaseModel):
    id: int
    code: str
    name: str
    department: str
    semester: int
    credits: int
    type: str
    teacher_id: Optional[int] = None

    class Config:
        from_attributes = True


# --- ROOM SCHEMAS ---
class RoomCreate(BaseModel):
    room_number: str
    building: str = "Turing Block"
    floor: str = "2nd Floor"
    room_type: str = "Classroom"
    capacity: int = 60
    is_available: bool = True
    status: str = "Available"


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room_type: Optional[str] = None
    capacity: Optional[int] = None
    is_available: Optional[bool] = None
    status: Optional[str] = None


class RoomOut(BaseModel):
    id: int
    room_number: str
    building: str
    floor: str
    room_type: str
    capacity: int
    is_available: bool
    status: str

    class Config:
        from_attributes = True


# --- SESSION SCHEMAS ---
class SessionCreate(BaseModel):
    subject_id: int
    room_id: int
    start_time: str
    end_time: str
    date: Optional[str] = None


class SessionOut(BaseModel):
    id: int
    session_id: str
    subject_id: int
    teacher_id: int
    room_id: int
    date: str
    start_time: str
    end_time: str
    status: str
    created_at: datetime
    subject: Optional[SubjectOut] = None
    room: Optional[RoomOut] = None

    class Config:
        from_attributes = True


# --- ATTENDANCE SCHEMAS ---
class AttendanceMarkRequest(BaseModel):
    session_id: int
    student_id: Optional[int] = None
    latitude: float
    longitude: float
    device_verified: bool = True
    client_timestamp: Optional[str] = None


class AttendanceUpdate(BaseModel):
    status: str  # PRESENT, ABSENT, LATE
    remarks: Optional[str] = None


class AttendanceOut(BaseModel):
    id: int
    session_id: int
    student_id: int
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_meters: Optional[float] = None
    device_verified: bool
    verification_hash: Optional[str] = None
    check_in_time: datetime
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class AttendanceReport(BaseModel):
    total_classes: int
    attended_classes: int
    absent_classes: int
    attendance_percentage: float
    records: List[AttendanceOut] = []


# --- TIMETABLE SCHEMAS ---
class TimetableCreate(BaseModel):
    department: str = "Computer Science & Engineering"
    semester: int
    section: str = "A"
    day_of_week: str
    start_time: str
    end_time: str
    subject_id: int
    teacher_id: int
    room_id: int


class TimetableUpdate(BaseModel):
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    room_id: Optional[int] = None
    is_temporary_change: Optional[bool] = None
    substitute_teacher_id: Optional[int] = None
    change_reason: Optional[str] = None
    approved_by: Optional[str] = None


class TimetableOut(BaseModel):
    id: int
    department: str
    semester: int
    section: str
    day_of_week: str
    start_time: str
    end_time: str
    subject_id: int
    teacher_id: int
    room_id: int
    is_temporary_change: bool
    substitute_teacher_id: Optional[int] = None
    change_reason: Optional[str] = None
    approved_by: Optional[str] = None
    subject: Optional[SubjectOut] = None
    room: Optional[RoomOut] = None

    class Config:
        from_attributes = True


# --- EXAM SCHEMAS ---
class ExamCreate(BaseModel):
    exam_title: str
    exam_type: str = "Internal Assessment 1"
    subject_id: int
    semester: int
    date: str
    start_time: str
    end_time: str
    room_id: Optional[int] = None
    max_marks: int = 50
    instructions: Optional[str] = None


class ExamUpdate(BaseModel):
    exam_title: Optional[str] = None
    exam_type: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room_id: Optional[int] = None
    max_marks: Optional[int] = None
    instructions: Optional[str] = None


class ExamOut(BaseModel):
    id: int
    exam_title: str
    exam_type: str
    subject_id: int
    semester: int
    date: str
    start_time: str
    end_time: str
    room_id: Optional[int] = None
    max_marks: int
    instructions: Optional[str] = None
    subject: Optional[SubjectOut] = None
    room: Optional[RoomOut] = None

    class Config:
        from_attributes = True


# --- MARKS SCHEMAS ---
class MarkCreate(BaseModel):
    student_id: int
    subject_id: int
    exam_type: str = "Internal Assessment 1"
    ia1_score: Optional[float] = 0.0
    ia2_score: Optional[float] = 0.0
    assignment_score: Optional[float] = 0.0
    test_score: Optional[float] = 0.0
    quiz_score: Optional[float] = 0.0
    semester_exam_score: Optional[float] = 0.0


class MarkUpdate(BaseModel):
    ia1_score: Optional[float] = None
    ia2_score: Optional[float] = None
    assignment_score: Optional[float] = None
    test_score: Optional[float] = None
    quiz_score: Optional[float] = None
    semester_exam_score: Optional[float] = None


class MarkOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    exam_type: str
    ia1_score: float
    ia2_score: float
    assignment_score: float
    test_score: float
    quiz_score: float
    semester_exam_score: float
    total_score: float
    max_total: float
    grade_letter: str
    status: str
    subject: Optional[SubjectOut] = None

    class Config:
        from_attributes = True


# --- ASSIGNMENT SCHEMAS ---
class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: int
    deadline: str
    max_marks: int = 20
    attachment_url: Optional[str] = None


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    max_marks: Optional[int] = None
    attachment_url: Optional[str] = None


class AssignmentSubmitRequest(BaseModel):
    submission_text: Optional[str] = None
    file_url: Optional[str] = None


class AssignmentSubmissionOut(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    submission_text: Optional[str] = None
    file_url: Optional[str] = None
    submitted_at: datetime
    score: Optional[float] = None
    feedback: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class AssignmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    subject_id: int
    teacher_id: int
    deadline: str
    max_marks: int
    attachment_url: Optional[str] = None
    created_at: datetime
    submissions: List[AssignmentSubmissionOut] = []

    class Config:
        from_attributes = True


# --- STUDY MATERIALS SCHEMAS ---
class MaterialCreate(BaseModel):
    subject_id: int
    unit: str
    title: str
    description: Optional[str] = None
    material_type: str = "PDF Notes"
    file_url: str
    important_questions_attached: bool = True


class MaterialUpdate(BaseModel):
    unit: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    material_type: Optional[str] = None
    file_url: Optional[str] = None
    important_questions_attached: Optional[bool] = None


class MaterialOut(BaseModel):
    id: int
    subject_id: int
    unit: str
    title: str
    description: Optional[str] = None
    material_type: str
    file_url: str
    important_questions_attached: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- NOTICE SCHEMAS ---
class NoticeCreate(BaseModel):
    title: str
    description: str
    category: str = "Academic"
    priority: str = "Normal"
    department: str = "All"
    attachment_url: Optional[str] = None


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    department: Optional[str] = None
    attachment_url: Optional[str] = None
    is_active: Optional[bool] = None


class NoticeOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    department: str
    created_by_id: int
    attachment_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- NOTIFICATION SCHEMAS ---
class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    category: str = "general"
    link: Optional[str] = None


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    category: str
    read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- BUS ROUTE SCHEMAS ---
class BusRouteCreate(BaseModel):
    bus_number: str
    route_number: str
    route_name: str
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    capacity: int = 50
    stops: str
    morning_timing: str
    evening_timing: str
    weekday_schedule: str = "Active Mon-Fri"
    weekend_schedule: str = "Saturday Morning Only"
    holiday_schedule: str = "No Service"
    special_schedule: str = "Special Exam Service on request"


class BusRouteUpdate(BaseModel):
    bus_number: Optional[str] = None
    route_number: Optional[str] = None
    route_name: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    capacity: Optional[int] = None
    stops: Optional[str] = None
    morning_timing: Optional[str] = None
    evening_timing: Optional[str] = None
    weekday_schedule: Optional[str] = None
    weekend_schedule: Optional[str] = None
    holiday_schedule: Optional[str] = None
    special_schedule: Optional[str] = None
    is_active: Optional[bool] = None


class BusRouteOut(BaseModel):
    id: int
    bus_number: str
    route_number: str
    route_name: str
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    capacity: int
    stops: str
    morning_timing: str
    evening_timing: str
    weekday_schedule: str
    weekend_schedule: str
    holiday_schedule: str
    special_schedule: str
    is_active: bool

    class Config:
        from_attributes = True


# --- AUDIT LOG SCHEMA ---
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    module: str
    record_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: str
    timestamp: datetime

    class Config:
        from_attributes = True
