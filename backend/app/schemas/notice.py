from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class NoticeCreate(BaseModel):
    title: str
    description: str
    target_role: Optional[str] = "all"


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_role: Optional[str] = None


class NoticeOut(BaseModel):
    id: int
    title: str
    description: str
    created_by: int
    target_role: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
