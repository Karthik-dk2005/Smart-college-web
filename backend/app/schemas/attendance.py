from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class AttendanceCreate(BaseModel):
    student_id: int
    subject_id: int
    faculty_id: Optional[int] = None
    date: str  # YYYY-MM-DD
    status: str = "present"  # present, absent, late, leave
    check_in_time: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    remarks: Optional[str] = None


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    faculty_id: int
    date: str
    status: str
    check_in_time: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AttendancePercentageOut(BaseModel):
    student_id: int
    student_name: str
    usn: str
    total_classes: int
    present_classes: int
    absent_classes: int
    late_classes: int
    leave_classes: int
    percentage: float
