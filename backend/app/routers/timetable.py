from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models import Timetable, Teacher, Subject, Room, Department, User, Attendance
from app.schemas import TimetableCreate, TimetableUpdate, TimetableResponse
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.response import success_response


router = APIRouter(prefix="/api/timetable", tags=["Timetable"])

VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


# ==========================================================
# CONFLICT VALIDATION HELPER
# ==========================================================
def check_timetable_conflicts(
    db: Session,
    day: str,
    start_time: str,
    end_time: str,
    teacher_id: int,
    room_id: Optional[int],
    department_id: int,
    semester: Optional[int],
    section: Optional[str],
    period_number: Optional[int] = None,
    exclude_id: Optional[int] = None
):
    """
    Validates:
    1. Time interval validity (start_time < end_time)
    2. Teacher conflict (overlapping time on same day) -> HTTP 409
    3. Room conflict (overlapping time on same day) -> HTTP 409
    4. Section conflict (same sem/sec overlapping time on same day) -> HTTP 409
    5. Duplicate period (same sem/sec/period_number on same day) -> HTTP 409
    """
    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid time: start_time ({start_time}) must be earlier than end_time ({end_time})."
        )

    def times_overlap(s1: str, e1: str, s2: str, e2: str) -> bool:
        return s1 < e2 and e1 > s2

    query = db.query(Timetable).options(
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.subject),
    ).filter(
        Timetable.day == day,
        Timetable.status == "active"
    )
    if exclude_id is not None:
        query = query.filter(Timetable.id != exclude_id)

    existing_slots = query.all()

    # 1. Teacher Conflict
    for slot in existing_slots:
        if slot.teacher_id == teacher_id and times_overlap(start_time, end_time, slot.start_time, slot.end_time):
            t_name = slot.teacher.name if slot.teacher else f"Teacher ID {teacher_id}"
            sub_name = slot.subject.subject_name if slot.subject else "Class"
            rm_name = slot.room.room_name if slot.room else "Room"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Teacher Conflict: {t_name} is already assigned to {sub_name} in {rm_name} from {slot.start_time} - {slot.end_time} on {day}. Cannot assign another class during this time."
            )

    # 2. Room Conflict
    if room_id:
        for slot in existing_slots:
            if slot.room_id == room_id and times_overlap(start_time, end_time, slot.start_time, slot.end_time):
                rm_name = slot.room.room_name if slot.room else f"Room ID {room_id}"
                t_name = slot.teacher.name if slot.teacher else "another teacher"
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Room Conflict: Room {rm_name} is already occupied by {t_name} from {slot.start_time} - {slot.end_time} on {day}. Cannot assign another class in this room during this time."
                )

    # 3. Section Conflict
    if semester and section:
        for slot in existing_slots:
            if (
                slot.department_id == department_id
                and slot.semester == semester
                and (slot.section or "").upper() == (section or "").upper()
                and times_overlap(start_time, end_time, slot.start_time, slot.end_time)
            ):
                sub_name = slot.subject.subject_name if slot.subject else "class"
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Section Conflict: Semester {semester} Section {section.upper()} already has a scheduled class ({sub_name}) from {slot.start_time} - {slot.end_time} on {day}."
                )

    # 4. Duplicate Period Conflict
    if period_number and semester and section:
        for slot in existing_slots:
            if (
                slot.department_id == department_id
                and slot.semester == semester
                and (slot.section or "").upper() == (section or "").upper()
                and slot.period_number == period_number
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Duplicate Period Conflict: Period {period_number} is already assigned for Semester {semester} Section {section.upper()} on {day}."
                )


def format_slot(slot: Timetable, db: Optional[Session] = None, check_date: Optional[str] = None) -> dict:
    attendance_completed = False
    attendance_count = 0
    if db is not None and check_date:
        cnt = db.query(Attendance).filter(
            Attendance.timetable_id == slot.id,
            Attendance.date == check_date
        ).count()
        if cnt > 0:
            attendance_completed = True
            attendance_count = cnt

    return {
        "id": slot.id,
        "day": slot.day,
        "period_number": slot.period_number,
        "start_time": slot.start_time,
        "end_time": slot.end_time,
        "subject_id": slot.subject_id,
        "subject_name": slot.subject.subject_name if slot.subject else "Unknown Subject",
        "subject_code": slot.subject.subject_code if slot.subject else None,
        "teacher_id": slot.teacher_id,
        "teacher_name": slot.teacher.name if slot.teacher else "Unknown Teacher",
        "room_id": slot.room_id,
        "room_name": slot.room.room_name if slot.room else None,
        "room_number": slot.room.room_name if slot.room else None,

        "department_id": slot.department_id,
        "department_name": slot.department.name if slot.department else None,
        "semester": slot.semester,
        "section": slot.section,
        "timetable_type": slot.timetable_type or "regular",
        "status": slot.status or "active",
        "attendance_completed": attendance_completed,
        "attendance_count": attendance_count,
    }


# ==========================================================
# 1. LIST TIMETABLES (GET /api/timetable)
# ==========================================================
@router.get("")
def get_timetables(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    teacher_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    day: Optional[str] = None,
    search: Optional[str] = None,
    my_timetable: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List timetable entries with rich filtering.
    Students automatically view their assigned section & semester.
    Teachers viewing 'my timetable' view slots assigned to them.
    """
    query = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    )

    # Role-based defaults
    if current_user.role == "student" and not semester and not section:
        if current_user.semester:
            query = query.filter(Timetable.semester == current_user.semester)
        if current_user.section:
            query = query.filter(Timetable.section == current_user.section.upper())
        if current_user.department_id and not department_id:
            query = query.filter(Timetable.department_id == current_user.department_id)

    if current_user.role == "teacher" and (my_timetable or not (department_id or semester or section)):
        if current_user.teacher_id:
            query = query.filter(Timetable.teacher_id == current_user.teacher_id)

    # Explicit Filters
    if department_id:
        query = query.filter(Timetable.department_id == department_id)
    if semester:
        query = query.filter(Timetable.semester == semester)
    if section and section.upper() != "ALL":
        query = query.filter(Timetable.section == section.upper())
    if teacher_id:
        query = query.filter(Timetable.teacher_id == teacher_id)
    if subject_id:
        query = query.filter(Timetable.subject_id == subject_id)
    if day and day.capitalize() != "All":
        query = query.filter(Timetable.day == day.capitalize())

    # Text Search (subject name, subject code, teacher name, room name)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.join(Timetable.subject).outerjoin(Timetable.teacher).outerjoin(Timetable.room).filter(
            (Subject.subject_name.ilike(search_term)) |
            (Subject.subject_code.ilike(search_term)) |
            (Teacher.name.ilike(search_term)) |
            (Room.room_name.ilike(search_term))
        )

    slots = query.order_by(Timetable.day, Timetable.start_time).all()
    data = [format_slot(s) for s in slots]
    return success_response(data=data, message=f"Retrieved {len(data)} timetable slots")



# ==========================================================
# 2. TODAY & ROLE-SPECIFIC TIMETABLES
# ==========================================================
@router.get("/today", response_model=List[TimetableResponse])
def get_today_timetable(
    day: Optional[str] = None,
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/timetable/today
    Returns timetable entries scheduled for today.
    The backend determines the current day and returns the scheduled entries.
    Includes attendance_completed indicator.
    """
    now = datetime.now()
    today_day = day.capitalize() if day else now.strftime("%A")
    today_date = now.strftime("%Y-%m-%d")

    query = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    ).filter(
        Timetable.day == today_day,
        Timetable.status == "active"
    )

    if current_user.role == "student" and not semester and not section:
        if current_user.semester:
            query = query.filter(Timetable.semester == current_user.semester)
        if current_user.section:
            query = query.filter(Timetable.section == current_user.section.upper())
        if current_user.department_id and not department_id:
            query = query.filter(Timetable.department_id == current_user.department_id)

    if department_id:
        query = query.filter(Timetable.department_id == department_id)
    if semester:
        query = query.filter(Timetable.semester == semester)
    if section and section.upper() != "ALL":
        query = query.filter(Timetable.section == section.upper())

    slots = query.order_by(Timetable.start_time).all()
    return [format_slot(s, db=db, check_date=today_date) for s in slots]


@router.get("/teacher/today", response_model=List[TimetableResponse])
def get_teacher_today_timetable(
    day: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/timetable/teacher/today
    Returns today's timetable entries assigned strictly to the logged-in teacher.
    """
    teacher_id = current_user.teacher_id
    if not teacher_id:
        teacher = db.query(Teacher).filter(
            (Teacher.email == current_user.email) | (Teacher.name == current_user.name)
        ).first()
        if teacher:
            teacher_id = teacher.id

    if not teacher_id:
        return []

    now = datetime.now()
    today_day = day.capitalize() if day else now.strftime("%A")
    today_date = now.strftime("%Y-%m-%d")

    slots = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    ).filter(
        Timetable.day == today_day,
        Timetable.teacher_id == teacher_id,
        Timetable.status == "active"
    ).order_by(Timetable.start_time).all()

    return [format_slot(s, db=db, check_date=today_date) for s in slots]
@router.get("/student", response_model=List[TimetableResponse])
def get_student_timetable(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get timetable slots for current student's class."""
    query = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    )
    if current_user.semester:
        query = query.filter(Timetable.semester == current_user.semester)
    if current_user.section:
        query = query.filter(Timetable.section == current_user.section.upper())
    if current_user.department_id:
        query = query.filter(Timetable.department_id == current_user.department_id)

    slots = query.order_by(Timetable.day, Timetable.start_time).all()
    return [format_slot(s) for s in slots]


@router.get("/teacher", response_model=List[TimetableResponse])
def get_teacher_timetable(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get timetable slots assigned to logged-in teacher."""
    teacher_id = current_user.teacher_id
    if not teacher_id:
        # Fallback by matching email or name
        teacher = db.query(Teacher).filter(
            (Teacher.email == current_user.email) | (Teacher.name == current_user.name)
        ).first()
        if teacher:
            teacher_id = teacher.id

    if not teacher_id:
        return []

    slots = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    ).filter(
        Timetable.teacher_id == teacher_id
    ).order_by(Timetable.day, Timetable.start_time).all()

    return [format_slot(s) for s in slots]


@router.get("/department/{dept_id}", response_model=List[TimetableResponse])
def get_department_timetable(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all timetable slots for a department."""
    slots = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    ).filter(
        Timetable.department_id == dept_id
    ).order_by(Timetable.day, Timetable.start_time).all()

    return [format_slot(s) for s in slots]


# ==========================================================
# 3. GET SINGLE TIMETABLE (GET /api/timetable/{id})
# ==========================================================
@router.get("/{slot_id}")
def get_timetable_by_id(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single timetable entry by ID."""
    slot = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    ).filter(Timetable.id == slot_id).first()

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timetable slot with ID {slot_id} not found."
        )
    return success_response(data=format_slot(slot))


# ==========================================================
# 4. CREATE TIMETABLE (POST /api/timetable)
# ==========================================================
@router.post("", status_code=status.HTTP_201_CREATED)
def create_timetable(
    payload: TimetableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Create a new timetable slot with strict conflict validation."""
    day_normalized = payload.day.capitalize()
    if day_normalized not in VALID_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid day: '{payload.day}'. Must be one of: {', '.join(VALID_DAYS)}"
        )

    teacher_id_val = payload.teacher_id or payload.faculty_id
    if not teacher_id_val:
        raise HTTPException(status_code=400, detail="teacher_id or faculty_id is required.")

    room_id_val = payload.room_id
    if not room_id_val and payload.room_number:
        rm = db.query(Room).filter(Room.room_name == payload.room_number).first()
        if rm:
            room_id_val = rm.id

    # Conflict check
    check_timetable_conflicts(
        db=db,
        day=day_normalized,
        start_time=payload.start_time,
        end_time=payload.end_time,
        teacher_id=teacher_id_val,
        room_id=room_id_val,
        department_id=payload.department_id,
        semester=payload.semester,
        section=payload.section,
        period_number=payload.period_number,
        exclude_id=None
    )

    new_slot = Timetable(
        department_id=payload.department_id,
        semester=payload.semester,
        section=payload.section.upper() if payload.section else None,
        day=day_normalized,
        period_number=payload.period_number,
        start_time=payload.start_time,
        end_time=payload.end_time,
        subject_id=payload.subject_id,
        teacher_id=teacher_id_val,
        room_id=room_id_val,
        timetable_type=payload.timetable_type or "regular",
        status=payload.status or "active"
    )

    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)

    # Reload relationships
    slot = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    ).filter(Timetable.id == new_slot.id).first()

    return success_response(data=format_slot(slot), message="Timetable slot created successfully", status_code=201)



# ==========================================================
# 5. UPDATE TIMETABLE (PUT /api/timetable/{id})
# ==========================================================
@router.put("/{slot_id}")
def update_timetable(
    slot_id: int,
    payload: TimetableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Update an existing timetable slot with strict conflict validation."""
    slot = db.query(Timetable).filter(Timetable.id == slot_id).first()
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timetable slot with ID {slot_id} not found."
        )

    # Compute prospective values for conflict checking
    day = payload.day.capitalize() if payload.day else slot.day
    if day not in VALID_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid day: '{payload.day}'. Must be one of: {', '.join(VALID_DAYS)}"
        )

    start_time = payload.start_time if payload.start_time is not None else slot.start_time
    end_time = payload.end_time if payload.end_time is not None else slot.end_time
    teacher_id = payload.teacher_id if payload.teacher_id is not None else slot.teacher_id
    room_id = payload.room_id if payload.room_id is not None else slot.room_id
    department_id = payload.department_id if payload.department_id is not None else slot.department_id
    semester = payload.semester if payload.semester is not None else slot.semester
    section = payload.section if payload.section is not None else slot.section
    period_number = payload.period_number if payload.period_number is not None else slot.period_number

    # Conflict check excluding this slot
    check_timetable_conflicts(
        db=db,
        day=day,
        start_time=start_time,
        end_time=end_time,
        teacher_id=teacher_id,
        room_id=room_id,
        department_id=department_id,
        semester=semester,
        section=section,
        period_number=period_number,
        exclude_id=slot_id
    )

    # Apply updates
    if payload.department_id is not None:
        slot.department_id = payload.department_id
    if payload.semester is not None:
        slot.semester = payload.semester
    if payload.section is not None:
        slot.section = payload.section.upper()
    if payload.day is not None:
        slot.day = day
    if payload.period_number is not None:
        slot.period_number = payload.period_number
    if payload.start_time is not None:
        slot.start_time = payload.start_time
    if payload.end_time is not None:
        slot.end_time = payload.end_time
    if payload.subject_id is not None:
        slot.subject_id = payload.subject_id
    if payload.teacher_id is not None:
        slot.teacher_id = payload.teacher_id
    elif payload.faculty_id is not None:
        slot.teacher_id = payload.faculty_id
    if payload.room_id is not None:
        slot.room_id = payload.room_id
    elif payload.room_number is not None:
        rm = db.query(Room).filter(Room.room_name == payload.room_number).first()
        if not rm:
            rm = Room(room_name=payload.room_number, room_type="Classroom", capacity=60, status="active")
            db.add(rm)
            db.commit()
            db.refresh(rm)
        slot.room_id = rm.id

    if payload.timetable_type is not None:
        slot.timetable_type = payload.timetable_type
    if payload.status is not None:
        slot.status = payload.status

    db.commit()

    slot = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    ).filter(Timetable.id == slot_id).first()

    return success_response(data=format_slot(slot), message="Timetable slot updated successfully")


# ==========================================================
# 6. DELETE TIMETABLE (DELETE /api/timetable/{id})
# ==========================================================
@router.delete("/{slot_id}")
def delete_timetable(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Delete a timetable entry."""
    slot = db.query(Timetable).filter(Timetable.id == slot_id).first()
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timetable slot with ID {slot_id} not found."
        )

    db.delete(slot)
    db.commit()
    return {"success": True, "message": f"Timetable entry #{slot_id} deleted successfully."}
