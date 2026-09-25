from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class FacultyCreate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: int
    user_id: Optional[int] = None
    designation: str = "Assistant Professor"
    password: Optional[str] = "password123"


class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None


class FacultyOut(BaseModel):
    id: int
    employee_id: str
    name: str
    email: str
    phone: Optional[str] = None
    department_id: int
    user_id: int
    designation: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
