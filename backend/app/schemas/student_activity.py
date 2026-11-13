from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class StudentActivityFileOut(BaseModel):
    id: int
    activity_id: int
    file_name: str
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: datetime
    download_url: Optional[str] = None
    view_url: Optional[str] = None

    class Config:
        from_attributes = True


class StudentActivityVerificationOut(BaseModel):
    id: int
    activity_id: int
    verified_by: Optional[int] = None
    verifier_name: Optional[str] = None
    verification_role: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    verified_at: datetime

    class Config:
        from_attributes = True


class StudentActivityBase(BaseModel):
    title: str = Field(..., max_length=255)
    activity_type: str = Field(..., max_length=100)
    description: Optional[str] = None
    activity_date: Optional[date] = None
    organizing_institution: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=100)
    level: Optional[str] = Field(None, max_length=100)
    position_award: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    remarks: Optional[str] = None


class StudentActivityCreate(StudentActivityBase):
    pass


class StudentActivityUpdate(BaseModel):
    title: Optional[str] = None
    activity_type: Optional[str] = None
    description: Optional[str] = None
    activity_date: Optional[date] = None
    organizing_institution: Optional[str] = None
    department: Optional[str] = None
    level: Optional[str] = None
    position_award: Optional[str] = None
    location: Optional[str] = None
    remarks: Optional[str] = None


class StudentActivityOut(StudentActivityBase):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_usn: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    files: List[StudentActivityFileOut] = []
    verifications: List[StudentActivityVerificationOut] = []
    latest_verification: Optional[StudentActivityVerificationOut] = None

    class Config:
        from_attributes = True


class VerifyActivityRequest(BaseModel):
    remarks: Optional[str] = None


class RejectActivityRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=2, max_length=1000)


class ActivityStatsOut(BaseModel):
    total_activities: int = 0
    total_achievements: int = 0
    verified_achievements: int = 0
    pending_verification: int = 0
    rejected: int = 0
    certificates_count: int = 0
    awards_count: int = 0
    competitions: int = 0
    sports: int = 0
    cultural: int = 0
    technical: int = 0
    workshops: int = 0
    seminars: int = 0
    internships: int = 0
    projects: int = 0
    other_activities: int = 0
