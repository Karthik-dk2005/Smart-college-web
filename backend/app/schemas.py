from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


# ==========================================================
# 1. AUTH SCHEMAS
# ==========================================================
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "student"  # student, teacher, hod, admin
    department_id: Optional[int] = None
    teacher_id: Optional[int] = None
    semester: Optional[int] = 5
    section: Optional[str] = "A"
    phone: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department_id: Optional[int] = None
    teacher_id: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==========================================================
# 2. DEPARTMENT SCHEMAS
# ==========================================================
class DepartmentCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "active"


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "active"

    class Config:
        from_attributes = True


# ==========================================================
# 3. TEACHER SCHEMAS
# ==========================================================
class TeacherCreate(BaseModel):
    name: str
    employee_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = 1
    designation: Optional[str] = "Assistant Professor"
    username: Optional[str] = None
    password: Optional[str] = "password123"
    status: Optional[str] = "active"


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    employee_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    status: Optional[str] = None


class TeacherResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    employee_id: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    status: Optional[str] = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================================
# 4. SUBJECT SCHEMAS
# ==========================================================
class SubjectCreate(BaseModel):
    subject_code: Optional[str] = None
    subject_name: str
    department_id: Optional[int] = None
    semester: Optional[int] = None
    credits: Optional[int] = 4
    teacher_id: Optional[int] = None
    status: Optional[str] = "active"


class SubjectUpdate(BaseModel):
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    department_id: Optional[int] = None
    semester: Optional[int] = None
    credits: Optional[int] = None
    teacher_id: Optional[int] = None
    status: Optional[str] = None


class SubjectResponse(BaseModel):
    id: int
    subject_code: Optional[str] = None
    subject_name: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    semester: Optional[int] = None
    credits: Optional[int] = 4
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    status: Optional[str] = "active"

    class Config:
        from_attributes = True


# ==========================================================
# 5. ROOM SCHEMAS
# ==========================================================
class RoomCreate(BaseModel):
    room_name: str
    room_type: Optional[str] = "Classroom"
    capacity: Optional[int] = 60
    status: Optional[str] = "active"


class RoomUpdate(BaseModel):
    room_name: Optional[str] = None
    room_type: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None


class RoomResponse(BaseModel):
    id: int
    room_name: str
    room_type: Optional[str] = "Classroom"
    capacity: Optional[int] = 60
    status: Optional[str] = "active"

    class Config:
        from_attributes = True


# ==========================================================
# 6. TIMETABLE SCHEMAS
# ==========================================================
class TimetableCreate(BaseModel):
    department_id: int
    semester: Optional[int] = 5
    section: Optional[str] = "A"
    day: str
    period_number: Optional[int] = None
    start_time: str
    end_time: str
    subject_id: int
    teacher_id: Optional[int] = None
    faculty_id: Optional[int] = None
    room_id: Optional[int] = None
    room_number: Optional[str] = None
    timetable_type: Optional[str] = "regular"
    status: Optional[str] = "active"



class TimetableUpdate(BaseModel):
    department_id: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    day: Optional[str] = None
    period_number: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    faculty_id: Optional[int] = None
    room_id: Optional[int] = None
    room_number: Optional[str] = None
    timetable_type: Optional[str] = None
    status: Optional[str] = None



class TimetableResponse(BaseModel):
    id: int
    day: str
    period_number: Optional[int] = None
    start_time: str
    end_time: str
    subject_id: int
    subject_name: str
    subject_code: Optional[str] = None
    teacher_id: int
    teacher_name: str
    room_id: Optional[int] = None
    room_name: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    semester: Optional[int] = 5
    section: Optional[str] = "A"
    timetable_type: Optional[str] = "regular"
    status: Optional[str] = "active"
    attendance_completed: Optional[bool] = False
    attendance_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ==========================================================
# 8. FACE RECOGNITION SCHEMAS
# ==========================================================
class FaceRegisterRequest(BaseModel):
    image: str  # Base64 or DataURL


class FaceVerifyRequest(BaseModel):
    image: str  # Base64 or DataURL
    timetable_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    duration_number: Optional[int] = None
    interval_id: Optional[int] = None
    bypass_location: Optional[bool] = False


class FaceVerifyResponse(BaseModel):
    success: bool
    message: str
    student_id: int
    student_code: str
    student_name: str
    subject: str
    timetable_id: int
    duration_number: int
    duration_time: str
    status: str = "Present"
    attendance_method: str = "FACE"
    time: str
    marked_at: str


# ==========================================================
# 9. BIOMETRIC SCHEMAS
# ==========================================================
class BiometricRegisterRequest(BaseModel):
    biometric_token: Optional[str] = None
    device_id: Optional[str] = None


class BiometricVerifyRequest(BaseModel):
    timetable_id: int
    student_id: Optional[int] = None
    student_code: Optional[str] = None
    biometric_token: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    duration_number: Optional[int] = None
    interval_id: Optional[int] = None
    bypass_location: Optional[bool] = False


class BiometricVerifyResponse(BaseModel):
    success: bool
    message: str
    student_id: int
    student_code: str
    student_name: str
    subject: str
    timetable_id: int
    duration_number: int
    duration_time: str
    status: str = "Present"
    attendance_method: str = "BIOMETRIC"
    time: str
    marked_at: str
