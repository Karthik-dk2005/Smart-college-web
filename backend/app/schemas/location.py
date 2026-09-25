from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    timestamp: Optional[datetime] = None
    location_type: Optional[str] = "device"


class LocationOut(BaseModel):
    id: int
    user_id: int
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    timestamp: datetime
    location_type: str

    model_config = ConfigDict(from_attributes=True)
