from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.schemas.subject import SubjectOut
from app.schemas.faculty import FacultyOut


class TimetableCreate(BaseModel):
    department_id: int
    semester: int = 5
    section: str = "A"
    day: str  # Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
    start_time: str  # e.g. 09:00
    end_time: str    # e.g. 10:00
    subject_id: int
    faculty_id: int
    room_number: str  # e.g. CS-303, CS-304


class TimetableUpdate(BaseModel):
    department_id: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    day: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    room_number: Optional[str] = None


class TimetableOut(BaseModel):
    id: int
    department_id: int
    semester: int
    section: str
    day: str
    start_time: str
    end_time: str
    subject_id: int
    faculty_id: int
    room_number: str
    subject: Optional[SubjectOut] = None
    faculty: Optional[FacultyOut] = None

    model_config = ConfigDict(from_attributes=True)
