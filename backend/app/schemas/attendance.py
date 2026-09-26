from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class StudentAttendanceItem(BaseModel):
    student_id: int
    status: str = "Present"  # Present, Absent
    attendance_method: Optional[str] = "MANUAL"  # FACE, BIOMETRIC, MANUAL
    interval_id: Optional[int] = None
    duration_number: Optional[int] = None


class IntervalSubmission(BaseModel):
    interval_id: Optional[int] = None
    duration_number: Optional[int] = None
    attendance: List[StudentAttendanceItem]


class SessionAttendanceSubmit(BaseModel):
    attendance: Optional[List[StudentAttendanceItem]] = None
    intervals: Optional[List[IntervalSubmission]] = None
    date: Optional[str] = None  # YYYY-MM-DD, defaults to today
    attendance_method: Optional[str] = "MANUAL"


class StudentSessionItem(BaseModel):
    id: int  # student id
    student_id: int
    roll_no: str
    name: str
    status: str = "Present"
    attendance_method: Optional[str] = "MANUAL"
    time: Optional[str] = None
    attendance_id: Optional[int] = None
    interval_statuses: Optional[Dict[str, str]] = None
    interval_methods: Optional[Dict[str, str]] = None


class IntervalStudentItem(BaseModel):
    id: int
    student_id: int
    roll_no: str
    name: str
    status: str = "Present"
    attendance_method: Optional[str] = "MANUAL"
    time: Optional[str] = None
    marked_at: Optional[datetime] = None


class AttendanceIntervalOut(BaseModel):
    id: int
    attendance_session_id: Optional[int] = None
    duration_number: int
    start_time: str
    end_time: str
    duration_minutes: int = 30
    present_count: Optional[int] = 0
    absent_count: Optional[int] = 0
    students: Optional[List[IntervalStudentItem]] = None


class SessionDetailsResponse(BaseModel):
    timetable_id: int
    session_id: Optional[int] = None
    subject_id: int
    subject_name: str
    subject_code: Optional[str] = None
    teacher_id: int
    teacher_name: str
    semester: int
    section: str
    room_name: Optional[str] = None
    date: str
    time: str
    start_time: str
    end_time: str
    day: str
    attendance_completed: bool
    total_students: int
    present_count: Optional[int] = None
    absent_count: Optional[int] = None
    conducted_minutes: Optional[int] = 60
    present_minutes: Optional[int] = 0
    absent_minutes: Optional[int] = 0
    attendance_percentage: Optional[float] = 0.0
    intervals: Optional[List[AttendanceIntervalOut]] = None
    students: List[StudentSessionItem]


class SessionAttendanceResponse(BaseModel):
    success: bool
    message: str
    timetable_id: int
    subject: str
    teacher: str
    semester: int
    section: str
    room: Optional[str] = None
    date: str
    time: str
    present: int
    absent: int
    total: int
    conducted_minutes: Optional[int] = 0
    present_minutes: Optional[int] = 0
    absent_minutes: Optional[int] = 0
    attendance_percentage: Optional[float] = 0.0


class AttendanceCreate(BaseModel):
    student_id: int
    timetable_id: int
    date: Optional[str] = None
    status: str = "Present"


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    timetable_id: Optional[int] = None
    teacher_id: Optional[int] = None
    subject_id: Optional[int] = None
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: str
    marked_at: Optional[datetime] = None
    student_name: Optional[str] = None
    student_usn: Optional[str] = None
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SubjectAttendanceStat(BaseModel):
    subject_id: int
    subject_code: Optional[str] = None
    subject_name: str
    teacher_name: Optional[str] = None
    scheduled_sessions: int
    present: int
    absent: int
    percentage: float
    conducted_minutes: Optional[int] = 0
    present_minutes: Optional[int] = 0
    absent_minutes: Optional[int] = 0
    intervals: Optional[List[Dict[str, Any]]] = None


class StudentAttendanceSummary(BaseModel):
    student_id: int
    student_name: str
    usn: str
    semester: int
    section: str
    department_name: Optional[str] = None
    total_sessions: int
    present_sessions: int
    absent_sessions: int
    conducted_minutes: int
    present_minutes: int
    absent_minutes: int
    attendance_percentage: float
    overall_percentage: float
    subjects: List[SubjectAttendanceStat]


class AttendancePercentageOut(BaseModel):
    student_id: int
    student_name: str
    usn: str
    total_classes: int
    present_classes: int
    absent_classes: int
    late_classes: int = 0
    leave_classes: int = 0
    percentage: float
    conducted_minutes: Optional[int] = 0
    present_minutes: Optional[int] = 0
