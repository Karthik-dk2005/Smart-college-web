from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class NotificationCreate(BaseModel):
    user_id: Optional[int] = None
    title: str
    message: str
    category: Optional[str] = "general"
    notification_type: Optional[str] = "general"
    link: Optional[str] = None
    recipient_email: Optional[str] = None


class NotificationSendRequest(BaseModel):
    user_id: Optional[int] = None
    target_role: Optional[str] = None  # student, teacher, hod, admin, all
    title: str
    message: str
    category: Optional[str] = "general"
    notification_type: Optional[str] = "general"
    link: Optional[str] = None
    recipient_email: Optional[str] = None


class NotificationOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    message: str
    category: str
    link: Optional[str] = None
    read: bool
    recipient_email: Optional[str] = None
    delivery_status: Optional[str] = "pending"
    notification_type: Optional[str] = "general"
    error_log: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationPreferenceSchema(BaseModel):
    email_attendance: bool = True
    email_marks: bool = True
    email_timetable: bool = True
    email_announcements: bool = True
    email_events: bool = True
    email_system: bool = True


class TestSMTPRequest(BaseModel):
    test_email: Optional[EmailStr] = None
    subject: Optional[str] = "MITT SmartDept SMTP Test Email"
    message: Optional[str] = "This is a test notification confirming that Gmail SMTP is operating properly."
