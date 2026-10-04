from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ----------------------------------------------------
# Bus Stop Schemas
# ----------------------------------------------------
class BusStopBase(BaseModel):
    stop_order: int = 1
    stop_name: str
    latitude: Optional[str] = "Not provided"
    longitude: Optional[str] = "Not provided"
    pickup_time: Optional[str] = "Not provided"
    drop_time: Optional[str] = "Not provided"
    status: Optional[str] = "active"


class BusStopCreate(BusStopBase):
    pass


class BusStopUpdate(BaseModel):
    stop_order: Optional[int] = None
    stop_name: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    pickup_time: Optional[str] = None
    drop_time: Optional[str] = None
    status: Optional[str] = None


class BusStopOut(BusStopBase):
    id: int
    route_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Bus Route Schemas
# ----------------------------------------------------
class BusRouteBase(BaseModel):
    route_number: int
    route_name: str
    bus_number: Optional[str] = "Not provided"
    driver_name: Optional[str] = "Not provided"
    driver_phone: Optional[str] = "Not provided"
    start_point: Optional[str] = "Not provided"
    end_point: Optional[str] = "Not provided"
    departure_time: Optional[str] = "Not provided"
    arrival_time: Optional[str] = "Not provided"
    status: Optional[str] = "active"


class BusRouteCreate(BusRouteBase):
    pass


class BusRouteUpdate(BaseModel):
    route_name: Optional[str] = None
    bus_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    start_point: Optional[str] = None
    end_point: Optional[str] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    status: Optional[str] = None


class BusRouteOut(BusRouteBase):
    id: int
    stops_count: Optional[int] = 0
    assigned_students_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class BusRouteDetailOut(BusRouteOut):
    stops: List[BusStopOut] = []


# ----------------------------------------------------
# Student Bus Assignment Schemas
# ----------------------------------------------------
class StudentBusAssignCreate(BaseModel):
    route_id: int
    stop_id: Optional[int] = None
    transport_status: Optional[str] = "Using Bus"


class StudentBusAssignmentOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_usn: Optional[str] = None
    student_department: Optional[str] = None
    route_id: int
    route_number: Optional[int] = None
    route_name: Optional[str] = None
    bus_number: Optional[str] = "Not provided"
    driver_name: Optional[str] = "Not provided"
    driver_phone: Optional[str] = "Not provided"
    stop_id: Optional[int] = None
    stop_name: Optional[str] = "Not provided"
    pickup_time: Optional[str] = "Not provided"
    drop_time: Optional[str] = "Not provided"
    transport_status: str = "Using Bus"
    assigned_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
