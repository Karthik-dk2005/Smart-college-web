from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    username: Optional[str] = None
    email: EmailStr
    password: str
    role: str = "student"
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    usn_or_employee_id: Optional[str] = None
    department_id: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    designation: Optional[str] = None
    account_status: str = "Approved"
    is_active: bool = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    usn_or_employee_id: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    designation: Optional[str] = None
    account_status: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: Optional[str] = None
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: str
    role: str
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    usn_or_employee_id: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    designation: Optional[str] = None
    account_status: Optional[str] = "Approved"
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
