from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any, List

class CheckUSNRequest(BaseModel):
    usn: str

    @validator('usn')
    def validate_usn(cls, v):
        v = v.strip().upper()
        if not v:
            raise ValueError('USN is required')
        return v

class CheckUSNResponse(BaseModel):
    usn: str
    name: str
    gmail: Optional[str] = None
    masked_gmail: Optional[str] = None
    department: str
    semester: int
    section: str
    is_registered: bool
    has_gmail: bool
    can_register: bool
    message: Optional[str] = None

class VerifyUSNResponse(BaseModel):
    usn: str
    name: str
    semester: int
    section: str
    department: str
    masked_gmail: Optional[str] = None
    has_gmail: bool
    is_registered: bool
    can_register: bool
    message: Optional[str] = None

class StudentRegisterRequest(BaseModel):
    usn: str
    password: Optional[str] = None
    confirm_password: Optional[str] = None
    gmail: Optional[str] = None

    @validator('usn')
    def validate_usn(cls, v):
        v = v.strip().upper()
        if not v:
            raise ValueError('USN is required')
        return v

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and values['password'] and v != values['password']:
            raise ValueError('Passwords do not match')
        if v and len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class VerifyOTPRequest(BaseModel):
    usn: str
    otp: str

    @validator('usn')
    def validate_usn(cls, v):
        return v.strip().upper()

    @validator('otp')
    def validate_otp(cls, v):
        v = v.strip()
        if not v or len(v) != 6 or not v.isdigit():
            raise ValueError('OTP must be a 6-digit number')
        return v

class StudentVerifyEmailRequest(BaseModel):
    usn: str
    otp: str
    password: Optional[str] = None
    confirm_password: Optional[str] = None

    @validator('usn')
    def validate_usn(cls, v):
        return v.strip().upper()

    @validator('otp')
    def validate_otp(cls, v):
        v = v.strip()
        if not v or len(v) != 6 or not v.isdigit():
            raise ValueError('OTP must be a 6-digit number')
        return v

class StudentResendOTPRequest(BaseModel):
    usn: str

    @validator('usn')
    def validate_usn(cls, v):
        return v.strip().upper()

class StudentLoginRequest(BaseModel):
    usn: Optional[str] = None
    identifier: Optional[str] = None
    username_or_email: Optional[str] = None
    password: str

    @property
    def login_usn(self) -> str:
        return (self.usn or self.identifier or self.username_or_email or "").strip()

class StudentProfileOut(BaseModel):
    id: int
    name: str
    usn: str
    gmail: Optional[str] = None
    email: Optional[str] = None
    semester: int
    section: str
    department: str
    role: str = "student"
    registration_status: str
    email_verification_status: str

class StudentAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class StudentDashboardProfile(BaseModel):
    name: str
    usn: str
    gmail: Optional[str] = None
    department: str
    semester: int
    section: str
    timetable: List[Dict[str, Any]] = []
    attendance: Dict[str, Any] = {}
    ia_marks: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []
    activities: List[Dict[str, Any]] = []
    bus_route: Optional[Dict[str, Any]] = None

class StudentForgotPasswordRequest(BaseModel):
    usn: str

    @validator('usn')
    def validate_usn(cls, v):
        v = v.strip().upper()
        if not v:
            raise ValueError('USN is required')
        return v

class StudentVerifyRecoveryOTPRequest(BaseModel):
    usn: str
    otp: str

    @validator('usn')
    def validate_usn(cls, v):
        return v.strip().upper()

    @validator('otp')
    def validate_otp(cls, v):
        v = v.strip()
        if not v or len(v) != 6 or not v.isdigit():
            raise ValueError('OTP must be a 6-digit number')
        return v

class StudentResetPasswordRequest(BaseModel):
    usn: str
    otp: str
    new_password: str
    confirm_password: str

    @validator('usn')
    def validate_usn(cls, v):
        return v.strip().upper()

    @validator('otp')
    def validate_otp(cls, v):
        v = v.strip()
        if not v or len(v) != 6 or not v.isdigit():
            raise ValueError('OTP must be a 6-digit number')
        return v

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and values['new_password'] and v != values['new_password']:
            raise ValueError('Passwords do not match')
        if v and len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v
