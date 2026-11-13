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
    # Can be username, email, or USN/Employee ID
    email: Optional[str] = None
    username_or_email: Optional[str] = None
    username: Optional[str] = None
    password: str
    remember_me: Optional[bool] = False

    @property
    def identifier(self) -> str:
        return (self.username_or_email or self.email or self.username or "").strip()


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None


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
