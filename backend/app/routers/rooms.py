from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Room, User
from app.schemas import RoomCreate, RoomUpdate, RoomResponse
from app.dependencies import get_current_user, require_any_role

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])


def format_room(r: Room) -> dict:
    return {
        "id": r.id,
        "room_name": r.room_name,
        "room_type": r.room_type or "Classroom",
        "capacity": r.capacity or 60,
        "status": r.status or "active",
    }


@router.get("", response_model=List[RoomResponse])
def list_rooms(
    room_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all rooms."""
    query = db.query(Room)
    if room_type:
        query = query.filter(Room.room_type == room_type)
    rooms = query.order_by(Room.room_name).all()
    return [format_room(r) for r in rooms]


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single room details."""
    r = db.query(Room).filter(Room.id == room_id).first()
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID {room_id} not found."
        )
    return format_room(r)


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Create a new room."""
    existing = db.query(Room).filter(Room.room_name == payload.room_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Room '{payload.room_name}' already exists."
        )

    room = Room(
        room_name=payload.room_name,
        room_type=payload.room_type or "Classroom",
        capacity=payload.capacity or 60,
        status=payload.status or "active"
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return format_room(room)


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Update a room."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID {room_id} not found."
        )

    if payload.room_name and payload.room_name != room.room_name:
        existing = db.query(Room).filter(
            Room.room_name == payload.room_name,
            Room.id != room_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Another room already has name '{payload.room_name}'."
            )

    if payload.room_name is not None:
        room.room_name = payload.room_name
    if payload.room_type is not None:
        room.room_type = payload.room_type
    if payload.capacity is not None:
        room.capacity = payload.capacity
    if payload.status is not None:
        room.status = payload.status

    db.commit()
    db.refresh(room)
    return format_room(room)


@router.delete("/{room_id}")
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Delete a room."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID {room_id} not found."
        )
    db.delete(room)
    db.commit()
    return {"success": True, "message": f"Room #{room_id} deleted successfully."}
