from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class AnnouncementBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content: str = Field(..., description="Announcement content/body")
    category: Optional[str] = "General"  # Academic, Examination, Placement, Sports, Cultural, Administration, General
    priority: Optional[str] = "Normal"    # Normal, Important, Urgent
    target_audience: Optional[str] = "All Users"  # All Students, Students, Teachers, HOD, Specific Department, All Users
    department_id: Optional[int] = None
    publish_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: Optional[str] = "Active"      # Active, Inactive, Archived


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    target_audience: Optional[str] = None
    department_id: Optional[int] = None
    publish_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: Optional[str] = None


class AnnouncementOut(AnnouncementBase):
    id: int
    created_by: int
    creator_name: Optional[str] = None
    department_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
