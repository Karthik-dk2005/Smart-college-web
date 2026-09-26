from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    name: str
    usn: Optional[str] = None
    student_id: Optional[str] = None  # Accepts either student_id or usn
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[int] = 1
    semester: int = 5
    section: str = "A"
    admission_year: Optional[int] = 2024
    username: Optional[str] = None
    password: Optional[str] = "password123"
    status: Optional[str] = "active"


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
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
    phone: Optional[str] = None
    semester: int
    section: str
    department_id: int
    department_name: Optional[str] = None
    admission_year: Optional[int] = 2024
    username: Optional[str] = None
    status: Optional[str] = "active"
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
