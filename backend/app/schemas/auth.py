from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re


class UserRegister(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None  # legacy support
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    mobile_number: Optional[str] = None
    phone: Optional[str] = None  # legacy support
    usn_or_employee_id: Optional[str] = None
    role: str = Field("student", description="admin, hod, teacher, student")
    department_id: Optional[int] = None
    semester: Optional[int] = Field(None, ge=1, le=8)
    section: Optional[str] = Field(None, max_length=10)
    designation: Optional[str] = None

    @field_validator("mobile_number", "phone", mode="before")
    @classmethod
    def validate_phone(cls, v):
        if not v:
            return None
        cleaned = re.sub(r"[\s\-\(\)\+]", "", str(v))
        if len(cleaned) < 10 or len(cleaned) > 15:
            raise ValueError("Mobile number must be between 10 and 15 digits.")
        return str(v).strip()

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, v):
        if not v:
            return None
        v_str = str(v).strip().lower()
        if not re.match(r"^[a-zA-Z0-9_\.\-]+$", v_str):
            raise ValueError("Username can only contain letters, numbers, dots, hyphens, and underscores.")
        return v_str


class UserLogin(BaseModel):
    # Can be username, email, USN, or Gmail
    email: Optional[str] = None
    username_or_email: Optional[str] = None
    username: Optional[str] = None
    identifier: Optional[str] = None
    usn: Optional[str] = None
    gmail: Optional[str] = None
    password: str
    remember_me: Optional[bool] = False

    def get_identifier(self) -> str:
        return (self.identifier or self.username_or_email or self.usn or self.gmail or self.email or self.username or "").strip()


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: Optional[str] = None
    identifier: Optional[str] = None
    usn: Optional[str] = None
    registered_gmail: Optional[str] = None

    @property
    def target_identifier(self) -> str:
        return (self.identifier or self.usn or self.email or self.registered_gmail or "").strip()


class ResetPasswordRequest(BaseModel):
    token: Optional[str] = None
    otp: Optional[str] = None
    identifier: Optional[str] = None
    usn: Optional[str] = None
    new_password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None


class SendOTPRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = "Registration"


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class StudentRoleRegister(BaseModel):
    usn: str
    name: Optional[str] = None
    gmail: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    otp: str = Field(..., min_length=6, max_length=6)


class TeacherRoleRegister(BaseModel):
    employee_id: str
    name: str
    department_id: Optional[int] = 1
    department: Optional[str] = "Computer Science and Engineering"
    gmail: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    otp: str = Field(..., min_length=6, max_length=6)


class HODRoleRegister(BaseModel):
    employee_id: str
    name: str
    department_id: Optional[int] = 1
    department: Optional[str] = "Computer Science and Engineering"
    gmail: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    otp: str = Field(..., min_length=6, max_length=6)


class UserApproveRequest(BaseModel):
    status: str = Field("Approved", description="Approved, Rejected, Suspended, Pending")
    reason: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: str
    account_status: str = "Approved"
    usn: Optional[str] = None
    gmail: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    department: Optional[str] = None
