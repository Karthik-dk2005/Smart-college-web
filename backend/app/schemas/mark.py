from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class MarkBase(BaseModel):
    usn: str
    subject_code: str
    ia_number: str = "IA-1"
    maximum_marks: float = 30.0
    obtained_marks: Optional[float] = None
    scaled_max_marks: Optional[float] = None
    scaled_marks: Optional[float] = None
    is_absent: bool = False
    section: Optional[str] = "A"
    semester: int = 5
    notes: Optional[str] = None


class MarkCreate(MarkBase):
    pass


class MarkUpdate(BaseModel):
    obtained_marks: Optional[float] = None
    is_absent: Optional[bool] = None
    maximum_marks: Optional[float] = None
    scaled_marks: Optional[float] = None
    notes: Optional[str] = None
    ia2_maximum_marks: Optional[float] = None
    ia2_obtained_marks: Optional[float] = None
    ia2_is_absent: Optional[bool] = None
    ia2_status: Optional[str] = None


class MarkItemOut(BaseModel):
    id: int
    sl_no: Optional[int] = None
    usn: str
    student_name: str
    section: str
    subject_name: str
    subject_code: str
    ia: str
    maximum_marks: float
    obtained_marks: Optional[float] = None
    obtained_marks_display: str
    status: str
    is_absent: bool
    scaled_marks: Optional[float] = None
    scaled_max_marks: Optional[float] = None
    scaled_marks_display: Optional[str] = None
    semester: int
    department: str
    academic_year: str
    assessment_name: str
    ia2_maximum_marks: Optional[float] = None
    ia2_obtained_marks: Optional[float] = None
    ia2_is_absent: Optional[bool] = False
    ia2_status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubjectDashboardCard(BaseModel):
    subject_code: str
    subject_name: str
    short_name: str
    maximum_marks: float
    scaled_max_marks: float
    total_students: int
    present_count: int
    absent_count: int
    avg_marks: float
    highest_marks: float
    lowest_marks: float
    pass_percentage: float
    section_a: Dict[str, Any]
    section_b: Dict[str, Any]


class StudentMarksProfile(BaseModel):
    student_name: str
    usn: str
    department: str
    semester: str
    section: str
    academic_year: str
    assessment_name: str
    subjects: List[Dict[str, Any]]

