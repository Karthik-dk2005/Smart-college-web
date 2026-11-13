from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationCreate(BaseModel):
    user_id: Optional[int] = None
    title: str
    message: str
    category: Optional[str] = "general"
    link: Optional[str] = None


class NotificationOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    message: str
    category: str
    link: Optional[str] = None
    read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
