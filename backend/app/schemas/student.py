from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
import re


def validate_usn_str(v: str) -> str:
    clean = str(v).strip().upper()
    if not clean or len(clean) < 3:
        raise ValueError("USN must be at least 3 characters long and non-empty.")
    # Check alphanumeric characters
    if not re.match(r"^[A-Z0-9_-]+$", clean):
        raise ValueError("USN must contain only letters, numbers, hyphens or underscores.")
    return clean


class StudentCreate(BaseModel):
    name: str
    usn: str
    student_id: Optional[str] = None
    email: Optional[str] = None
    gmail: Optional[str] = None
    phone: Optional[str] = None
    father_phone: Optional[str] = None
    mother_phone: Optional[str] = None
    department_id: Optional[int] = 1
    semester: int = 5
    section: str = "A"
    admission_year: Optional[int] = 2024
    username: Optional[str] = None
    password: Optional[str] = "password123"
    status: Optional[str] = "active"

    @field_validator("usn")
    @classmethod
    def validate_usn(cls, v: str) -> str:
        return validate_usn_str(v)

    @field_validator("section")
    @classmethod
    def validate_section(cls, v: str) -> str:
        s = v.strip().upper()
        if not s:
            return "A"
        return s


class BulkStudentItem(BaseModel):
    usn: str
    name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = 1
    semester: int = 5
    section: str = "A"

    @field_validator("usn")
    @classmethod
    def validate_usn(cls, v: str) -> str:
        return validate_usn_str(v)


class BulkImportRequest(BaseModel):
    students: List[BulkStudentItem]


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    admission_year: Optional[int] = None
    status: Optional[str] = None  # active, inactive
    username: Optional[str] = None
    password: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    student_id: Optional[str] = None
    usn: str
    name: str
    email: str
    gmail: Optional[str] = None
    phone: Optional[str] = None
    father_phone: Optional[str] = None
    mother_phone: Optional[str] = None
    semester: int
    section: str
    department_id: int
    department_name: Optional[str] = None
    admission_year: Optional[int] = 2024
    username: Optional[str] = None
    status: Optional[str] = "active"
    registration_status: Optional[str] = "Unregistered"
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
