from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models import Room, User
from app.schemas import RoomCreate, RoomUpdate, RoomOut, ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role, get_client_ip
from app.utils import log_audit

router = APIRouter(prefix="/api/rooms", tags=["Room & Lab Management"])


@router.get("", response_model=Dict[str, Any])
def list_rooms(
    building: Optional[str] = None,
    room_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all rooms, lecture halls, and laboratories."""
    query = db.query(Room)
    if building:
        query = query.filter(Room.building == building)
    if room_type:
        query = query.filter(Room.room_type == room_type)
    rooms = query.all()

    results = [
        {
            "id": r.id,
            "room_number": r.room_number,
            "building": r.building,
            "floor": r.floor,
            "room_type": r.room_type,
            "capacity": r.capacity,
            "is_available": r.is_available,
            "status": r.status
        }
        for r in rooms
    ]
    return {"success": True, "count": len(results), "rooms": results}


@router.get("/available", response_model=Dict[str, Any])
def list_available_rooms(
    min_capacity: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List currently available facilities for instant scheduling or lab booking."""
    query = db.query(Room).filter(Room.is_available == True, Room.status == "Available")
    if min_capacity:
        query = query.filter(Room.capacity >= min_capacity)
    rooms = query.all()

    results = [
        {
            "id": r.id,
            "room_number": r.room_number,
            "building": r.building,
            "floor": r.floor,
            "room_type": r.room_type,
            "capacity": r.capacity
        }
        for r in rooms
    ]
    return {"success": True, "count": len(results), "available_rooms": results}


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    req: RoomCreate,
    request: Request,
    current_user: User = Depends(require_any_role("hod", "admin")),
    db: Session = Depends(get_db)
):
    """Register a new room or laboratory (HOD/Admin only)."""
    if db.query(Room).filter(Room.room_number == req.room_number.upper()).first():
        raise HTTPException(status_code=409, detail=f"Room {req.room_number} already exists.")

    new_room = Room(
        room_number=req.room_number.upper(),
        building=req.building,
        floor=req.floor,
        room_type=req.room_type,
        capacity=req.capacity,
        is_available=req.is_available,
        status=req.status
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    log_audit(
        db=db,
        action="CREATE_ROOM",
        module="Infrastructure",
        user_id=current_user.id,
        record_id=str(new_room.id),
        details=f"Created room {new_room.room_number} ({new_room.room_type})",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message=f"Room {new_room.room_number} created successfully.", data={"id": new_room.id})


@router.put("/{id}", response_model=ApiResponse)
def update_room(
    id: int,
    req: RoomUpdate,
    request: Request,
    current_user: User = Depends(require_any_role("hod", "admin")),
    db: Session = Depends(get_db)
):
    """Update room capacity, availability, or status."""
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    if req.room_number: room.room_number = req.room_number.upper()
    if req.building: room.building = req.building
    if req.floor: room.floor = req.floor
    if req.room_type: room.room_type = req.room_type
    if req.capacity is not None: room.capacity = req.capacity
    if req.is_available is not None: room.is_available = req.is_available
    if req.status: room.status = req.status

    db.commit()

    log_audit(
        db=db,
        action="UPDATE_ROOM",
        module="Infrastructure",
        user_id=current_user.id,
        record_id=str(room.id),
        details=f"Updated room {room.room_number} status to {room.status}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message="Room details updated successfully.")


@router.delete("/{id}", response_model=ApiResponse)
def delete_room(
    id: int,
    request: Request,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Delete room record (Admin only)."""
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    room_num = room.room_number
    db.delete(room)
    db.commit()

    log_audit(
        db=db,
        action="DELETE_ROOM",
        module="Infrastructure",
        user_id=current_user.id,
        record_id=str(id),
        details=f"Deleted room {room_num}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message=f"Room {room_num} deleted successfully.")
