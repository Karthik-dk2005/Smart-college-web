from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any

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
    gmail: str

    @validator('usn')
    def validate_usn(cls, v):
        v = v.strip().upper()
        if not v:
            raise ValueError('USN is required')
        return v

    @validator('gmail')
    def validate_gmail(cls, v):
        v = v.strip().lower()
        if not v or '@' not in v:
            raise ValueError('A valid Gmail address is required')
        if not (v.endswith('@gmail.com') or '@' in v):
            raise ValueError('Must be a valid email address')
        return v

class StudentVerifyEmailRequest(BaseModel):
    usn: str
    otp: str
    password: str
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
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class StudentResendOTPRequest(BaseModel):
    usn: str

    @validator('usn')
    def validate_usn(cls, v):
        return v.strip().upper()

class StudentLoginRequest(BaseModel):
    identifier: str  # USN or Gmail
    password: str

    @validator('identifier')
    def validate_identifier(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('USN or Gmail address is required')
        return v

    @validator('password')
    def validate_password(cls, v):
        if not v:
            raise ValueError('Password is required')
        return v

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

