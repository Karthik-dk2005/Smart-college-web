from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    usn: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    semester: int = 5
    section: str = "A"
    department_id: int
    user_id: Optional[int] = None
    password: Optional[str] = "password123"


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    department_id: Optional[int] = None


class StudentOut(BaseModel):
    id: int
    usn: str
    name: str
    email: str
    phone: Optional[str] = None
    semester: int
    section: str
    department_id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
