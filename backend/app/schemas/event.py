from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date, datetime


class EventBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field("", description="Detailed event information")
    category: str = Field(..., description="Academic, Technical, Cultural, Sports, Workshop, Seminar, Conference, Hackathon, Club Activity, Placement, Meeting, Other")
    event_date: date
    start_time: str = Field(..., description="e.g. 10:00 AM or 10:00")
    end_time: str = Field(..., description="e.g. 01:00 PM or 13:00")
    venue: str = Field(..., min_length=2, max_length=255)
    organizer: str = Field(..., min_length=2, max_length=255)
    department_id: Optional[int] = None
    target_audience: Optional[str] = "All Students"  # All Students, Students, Teachers, HOD, Specific Department, Specific Semester, Specific Section, All Users
    target_semester: Optional[int] = None
    target_section: Optional[str] = None
    registration_required: Optional[bool] = True
    registration_deadline: Optional[datetime] = None
    max_participants: Optional[int] = 100
    status: Optional[str] = "Upcoming"  # Upcoming, Ongoing, Completed, Cancelled
    is_published: Optional[bool] = True
    image_url: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: Optional[str] = None
    organizer: Optional[str] = None
    department_id: Optional[int] = None
    target_audience: Optional[str] = None
    target_semester: Optional[int] = None
    target_section: Optional[str] = None
    registration_required: Optional[bool] = None
    registration_deadline: Optional[datetime] = None
    max_participants: Optional[int] = None
    status: Optional[str] = None
    is_published: Optional[bool] = None
    image_url: Optional[str] = None


class EventOut(EventBase):
    id: int
    created_by: int
    creator_name: Optional[str] = None
    department_name: Optional[str] = None
    current_participants: int = 0
    is_registered: bool = False
    user_registration_status: Optional[str] = None
    user_attendance_status: Optional[str] = None
    computed_status: str = "Upcoming"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EventRegistrationOut(BaseModel):
    id: int
    event_id: int
    user_id: int
    student_id: Optional[int] = None
    registration_date: Optional[datetime] = None
    registration_status: str = "Registered"  # Registered, Cancelled, Waitlisted
    attendance_status: str = "Not Marked"   # Not Marked, Present, Absent
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    student_usn: Optional[str] = None
    department_name: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None

    class Config:
        from_attributes = True


class EventAttendanceItem(BaseModel):
    registration_id: Optional[int] = None
    user_id: Optional[int] = None
    attendance_status: str  # Present, Absent, Not Marked


class EventAttendanceUpdate(BaseModel):
    attendance: Optional[List[EventAttendanceItem]] = None
    user_id: Optional[int] = None
    attendance_status: Optional[str] = None
