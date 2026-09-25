from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models.timetable import Timetable
from app.models.user import User
from app.schemas.timetable import TimetableCreate, TimetableUpdate, TimetableOut
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.response import success_response

router = APIRouter(prefix="/api/timetable", tags=["Timetable"])

VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_timetable_entry(
    payload: TimetableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Create a timetable slot."""
    day_normalized = payload.day.capitalize()
    if day_normalized not in VALID_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid day: '{payload.day}'. Must be one of: {', '.join(VALID_DAYS)}"
        )

    slot = Timetable(
        department_id=payload.department_id,
        semester=payload.semester,
        section=payload.section.upper(),
        day=day_normalized,
        start_time=payload.start_time,
        end_time=payload.end_time,
        subject_id=payload.subject_id,
        faculty_id=payload.faculty_id,
        room_number=payload.room_number.upper(),
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    # Load relationships for clean serialization
    slot = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.faculty)
    ).filter(Timetable.id == slot.id).first()

    data = TimetableOut.model_validate(slot).model_dump()
    return success_response(data=data, message="Timetable slot created successfully", status_code=status.HTTP_201_CREATED)


@router.get("")
def list_timetable(
    semester: Optional[int] = None,
    section: Optional[str] = None,
    department_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
    day: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List timetable slots with filters:
    - semester
    - section
    - department / department_id
    - faculty / faculty_id
    - day (Monday to Saturday)
    """
    query = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.faculty)
    )

    if semester is not None:
        query = query.filter(Timetable.semester == semester)
    if section:
        query = query.filter(Timetable.section == section.upper())
    if department_id:
        query = query.filter(Timetable.department_id == department_id)
    if faculty_id:
        query = query.filter(Timetable.faculty_id == faculty_id)
    if day:
        query = query.filter(Timetable.day == day.capitalize())

    # Role defaults if student or faculty hasn't supplied query params
    if current_user.role == "student" and current_user.student_profile and not semester and not section:
        query = query.filter(
            Timetable.semester == current_user.student_profile.semester,
            Timetable.section == current_user.student_profile.section
        )
    elif current_user.role == "faculty" and current_user.faculty_profile and not faculty_id and not semester:
        query = query.filter(Timetable.faculty_id == current_user.faculty_profile.id)

    slots = query.order_by(Timetable.day, Timetable.start_time).all()
    data = [TimetableOut.model_validate(s).model_dump() for s in slots]
    return success_response(data=data, message="Timetable retrieved successfully")


@router.get("/{slot_id}")
def get_timetable_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get timetable slot by ID."""
    slot = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.faculty)
    ).filter(Timetable.id == slot_id).first()

    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable slot not found")

    data = TimetableOut.model_validate(slot).model_dump()
    return success_response(data=data, message="Timetable slot retrieved")


@router.put("/{slot_id}")
def update_timetable_slot(
    slot_id: int,
    payload: TimetableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Update timetable slot."""
    slot = db.query(Timetable).filter(Timetable.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable slot not found")

    if payload.day is not None:
        day_normalized = payload.day.capitalize()
        if day_normalized not in VALID_DAYS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid day: '{payload.day}'. Must be one of: {', '.join(VALID_DAYS)}"
            )
        slot.day = day_normalized

    if payload.department_id is not None:
        slot.department_id = payload.department_id
    if payload.semester is not None:
        slot.semester = payload.semester
    if payload.section is not None:
        slot.section = payload.section.upper()
    if payload.start_time is not None:
        slot.start_time = payload.start_time
    if payload.end_time is not None:
        slot.end_time = payload.end_time
    if payload.subject_id is not None:
        slot.subject_id = payload.subject_id
    if payload.faculty_id is not None:
        slot.faculty_id = payload.faculty_id
    if payload.room_number is not None:
        slot.room_number = payload.room_number.upper()

    db.commit()
    db.refresh(slot)

    slot = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.faculty)
    ).filter(Timetable.id == slot.id).first()

    data = TimetableOut.model_validate(slot).model_dump()
    return success_response(data=data, message="Timetable slot updated successfully")


@router.delete("/{slot_id}")
def delete_timetable_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Delete a timetable slot."""
    slot = db.query(Timetable).filter(Timetable.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable slot not found")

    db.delete(slot)
    db.commit()
    return success_response(data={"id": slot_id}, message="Timetable slot deleted successfully")
