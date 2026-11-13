import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models import Event, EventRegistration, User, Student, Department, Notification
from app.schemas import (
    EventCreate, EventUpdate, EventOut, EventRegistrationOut,
    EventAttendanceUpdate, ApiResponse
)
from app.dependencies import get_current_user, require_role, require_any_role

router = APIRouter(prefix="/api/events", tags=["Events"])

# Ensure uploads directory exists
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads/events"
else:
    UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "events"))
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except Exception:
    pass


def compute_event_status(event: Event) -> str:
    """Automatically determine event status based on event_date, start_time, and end_time."""
    if event.status == "Cancelled":
        return "Cancelled"
    try:
        now = datetime.datetime.now()
        date_part = event.event_date
        if isinstance(date_part, str):
            date_part = datetime.datetime.strptime(date_part, "%Y-%m-%d").date()

        def parse_time(t_str: str) -> datetime.time:
            t_str = str(t_str).strip().upper()
            for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M:%S", "%H:%M"):
                try:
                    return datetime.datetime.strptime(t_str, fmt).time()
                except ValueError:
                    pass
            return datetime.time(9, 0)

        start_t = parse_time(event.start_time)
        end_t = parse_time(event.end_time)

        start_dt = datetime.datetime.combine(date_part, start_t)
        end_dt = datetime.datetime.combine(date_part, end_t)

        if now < start_dt:
            return "Upcoming"
        elif start_dt <= now <= end_dt:
            return "Ongoing"
        else:
            return "Completed"
    except Exception:
        return event.status or "Upcoming"


def format_event_out(event: Event, current_user: Optional[User] = None, db: Optional[Session] = None) -> dict:
    """Serialize Event instance into dictionary conforming to EventOut schema with computed attributes."""
    computed_stat = compute_event_status(event)

    # Count active participants
    reg_count = 0
    is_reg = False
    user_reg_status = None
    user_att_status = None

    if db:
        registrations = db.query(EventRegistration).filter(
            EventRegistration.event_id == event.id
        ).all()
        reg_count = sum(1 for r in registrations if r.registration_status == "Registered")
        if current_user:
            user_reg = next((r for r in registrations if r.user_id == current_user.id), None)
            if user_reg:
                is_reg = (user_reg.registration_status == "Registered")
                user_reg_status = user_reg.registration_status
                user_att_status = user_reg.attendance_status
    else:
        reg_count = len([r for r in (event.registrations or []) if r.registration_status == "Registered"])
        if current_user:
            for r in (event.registrations or []):
                if r.user_id == current_user.id:
                    is_reg = (r.registration_status == "Registered")
                    user_reg_status = r.registration_status
                    user_att_status = r.attendance_status
                    break

    dept_name = event.department.name if event.department else "All Departments"
    creator_name = event.creator.name if event.creator else "System Admin"

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description or "",
        "category": event.category,
        "event_date": event.event_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "venue": event.venue,
        "organizer": event.organizer,
        "department_id": event.department_id,
        "target_audience": event.target_audience or "All Students",
        "target_semester": event.target_semester,
        "target_section": event.target_section,
        "registration_required": bool(event.registration_required),
        "registration_deadline": event.registration_deadline,
        "max_participants": event.max_participants or 100,
        "status": event.status,
        "is_published": bool(event.is_published),
        "image_url": event.image_url,
        "created_by": event.created_by,
        "creator_name": creator_name,
        "department_name": dept_name,
        "current_participants": reg_count,
        "is_registered": is_reg,
        "user_registration_status": user_reg_status,
        "user_attendance_status": user_att_status,
        "computed_status": computed_stat,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
    }


# ==========================================================
# 1. LIST EVENTS (WITH SEARCH & FILTERS)
# ==========================================================
@router.get("", response_model=List[EventOut])
def get_events(
    search: Optional[str] = Query(None, description="Search by title, venue, organizer"),
    category: Optional[str] = Query(None, description="Filter by event category"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status (Upcoming, Ongoing, Completed, Cancelled)"),
    date: Optional[str] = Query(None, description="Filter by exact date YYYY-MM-DD"),
    target_audience: Optional[str] = Query(None, description="Filter by target audience"),
    upcoming_only: bool = Query(False, description="Filter only upcoming/ongoing events"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all published events with flexible search and filtering."""
    query = db.query(Event)

    # Non-admins and non-HODs only see published events
    if current_user.role not in ["admin", "hod"]:
        query = query.filter(Event.is_published == True)

    # Search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Event.title.ilike(search_pattern),
                Event.venue.ilike(search_pattern),
                Event.organizer.ilike(search_pattern),
                Event.category.ilike(search_pattern),
                Event.description.ilike(search_pattern),
            )
        )

    # Category filter
    if category and category != "All":
        query = query.filter(Event.category == category)

    # Department filter
    if department_id:
        query = query.filter(or_(Event.department_id == department_id, Event.department_id == None))

    # Date filter
    if date:
        try:
            filter_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(Event.event_date == filter_date)
        except ValueError:
            pass

    # Status filter
    if status and status != "All":
        if status == "Cancelled":
            query = query.filter(Event.status == "Cancelled")
        elif status == "Upcoming":
            today = datetime.date.today()
            query = query.filter(and_(Event.status != "Cancelled", Event.event_date >= today))
        elif status == "Completed":
            today = datetime.date.today()
            query = query.filter(and_(Event.status != "Cancelled", Event.event_date < today))

    if upcoming_only:
        today = datetime.date.today()
        query = query.filter(and_(Event.status != "Cancelled", Event.event_date >= today))

    events = query.order_by(Event.event_date.asc(), Event.start_time.asc()).all()

    return [format_event_out(ev, current_user, db) for ev in events]


# ==========================================================
# 2. IMAGE UPLOAD FOR EVENTS
# ==========================================================
@router.post("/upload-image", response_model=ApiResponse)
async def upload_event_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_any_role(["admin", "hod"])),
):
    """Upload an event banner/poster with file validation."""
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPG, PNG, WEBP, and GIF images are permitted.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size exceeds maximum limit of 5MB.",
        )

    # Save to disk
    unique_name = f"{uuid.uuid4().hex[:12]}_{os.path.basename(filename)}"
    dest_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(dest_path, "wb") as f:
        f.write(content)

    image_url = f"/uploads/events/{unique_name}"
    return ApiResponse(
        success=True,
        message="Event image uploaded successfully",
        data={"image_url": image_url},
    )


# ==========================================================
# 3. GET SINGLE EVENT DETAILS
# ==========================================================
@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full details of a specific event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )
    return format_event_out(event, current_user, db)


# ==========================================================
# 4. CREATE EVENT (ADMIN & HOD)
# ==========================================================
@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new event.
    - Admin can create for any department.
    - HOD can create ONLY for their own department.
    - Teachers and students cannot create events (HTTP 403 Forbidden).
    """
    if current_user.role not in ["admin", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create events. Only Admin and HOD can create events.",
        )

    dept_id = payload.department_id
    if current_user.role == "hod":
        # Strictly enforce HOD's own department
        if current_user.department_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOD is not assigned to a department.",
            )
        if dept_id is not None and dept_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOD can create events only for their own department.",
            )
        dept_id = current_user.department_id

    new_event = Event(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        event_date=payload.event_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        venue=payload.venue,
        organizer=payload.organizer,
        department_id=dept_id,
        target_audience=payload.target_audience or "All Students",
        target_semester=payload.target_semester,
        target_section=payload.target_section,
        registration_required=payload.registration_required if payload.registration_required is not None else True,
        registration_deadline=payload.registration_deadline,
        max_participants=payload.max_participants or 100,
        status=payload.status or "Upcoming",
        is_published=payload.is_published if payload.is_published is not None else True,
        image_url=payload.image_url,
        created_by=current_user.id,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    # Automatically broadcast notification to users
    try:
        notif = Notification(
            user_id=None,  # Campus-wide / all users notification
            title=f"New Event: {new_event.title}",
            message=f"{new_event.category} event scheduled on {new_event.event_date} at {new_event.venue}. Organized by {new_event.organizer}.",
            category="event",
            link=f"/events/{new_event.id}",
        )
        db.add(notif)
        db.commit()
    except Exception:
        pass

    return format_event_out(new_event, current_user, db)


# ==========================================================
# 5. UPDATE EVENT (ADMIN & HOD STRICT SCOPING)
# ==========================================================
@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an event.
    - Admin can update any event.
    - HOD must NOT manage events belonging to another department (HTTP 403 Forbidden).
    - Teachers and students cannot edit events (HTTP 403 Forbidden).
    """
    if current_user.role not in ["admin", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit events.",
        )

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )

    # Strictly enforce HOD department check
    if current_user.role == "hod":
        if event.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOD cannot manage events belonging to another department.",
            )
        if payload.department_id is not None and payload.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot transfer event to another department.",
            )

    # Apply updates
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    event.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(event)
    return format_event_out(event, current_user, db)


# ==========================================================
# 6. DELETE / CANCEL EVENT (ADMIN & HOD STRICT SCOPING)
# ==========================================================
@router.delete("/{event_id}", response_model=ApiResponse)
def delete_event(
    event_id: int,
    permanent: bool = Query(False, description="Hard delete event or cancel it"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete or cancel an event.
    - Admin can delete/cancel any event.
    - HOD must NOT delete/cancel events belonging to another department (HTTP 403 Forbidden).
    - Teachers and students cannot delete events (HTTP 403 Forbidden).
    """
    if current_user.role not in ["admin", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete or cancel events.",
        )

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )

    # Strictly enforce HOD department boundary
    if current_user.role == "hod" and event.department_id != current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HOD cannot delete or cancel events belonging to another department.",
        )

    title = event.title
    if permanent and current_user.role == "admin":
        db.delete(event)
        db.commit()
        return ApiResponse(success=True, message=f"Event '{title}' deleted permanently.")
    else:
        event.status = "Cancelled"
        event.updated_at = datetime.datetime.utcnow()
        db.commit()
        return ApiResponse(success=True, message=f"Event '{title}' has been cancelled.")


# ==========================================================
# 7. EVENT REGISTRATION (STUDENT, TEACHER, ANY USER)
# ==========================================================
@router.post("/{event_id}/register", response_model=ApiResponse)
def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Register current authenticated user for an event.
    - Prevents duplicate registration.
    - Checks registration deadline.
    - Enforces maximum participant capacity.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )

    if event.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot register for a cancelled event.",
        )

    # 1. Registration Deadline Check
    if event.registration_deadline:
        now = datetime.datetime.now()
        deadline = event.registration_deadline
        if now > deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration Closed: The registration deadline for this event has passed.",
            )

    # 2. Maximum Participants Limit Check
    active_regs_count = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.registration_status == "Registered",
    ).count()

    if event.max_participants and active_regs_count >= event.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event Full: Maximum participant capacity has been reached.",
        )

    # 3. Duplicate Registration Prevention
    existing_reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.user_id == current_user.id,
    ).first()

    if existing_reg:
        if existing_reg.registration_status == "Registered":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate Registration: A user cannot register twice for the same event.",
            )
        else:
            # Reactivate cancelled registration
            existing_reg.registration_status = "Registered"
            existing_reg.registration_date = datetime.datetime.utcnow()
            existing_reg.updated_at = datetime.datetime.utcnow()
            db.commit()
            return ApiResponse(
                success=True,
                message=f"Registration successfully reactivated for '{event.title}'.",
                data={"registration_id": existing_reg.id, "status": "Registered"},
            )

    # Determine student record if role is student
    student_id = None
    if current_user.role == "student":
        student_obj = db.query(Student).filter(
            or_(Student.user_id == current_user.id, Student.email == current_user.email)
        ).first()
        if student_obj:
            student_id = student_obj.id

    new_reg = EventRegistration(
        event_id=event.id,
        user_id=current_user.id,
        student_id=student_id,
        registration_date=datetime.datetime.utcnow(),
        registration_status="Registered",
        attendance_status="Not Marked",
    )
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)

    return ApiResponse(
        success=True,
        message=f"Successfully registered for '{event.title}'!",
        data={"registration_id": new_reg.id, "status": "Registered"},
    )


# ==========================================================
# 8. CANCEL REGISTRATION
# ==========================================================
@router.delete("/{event_id}/register", response_model=ApiResponse)
def cancel_registration(
    event_id: int,
    user_id: Optional[int] = Query(None, description="Admin/HOD can specify user to cancel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel registration for an event.
    - Students and Teachers can cancel their own registration.
    - Admin and HOD can cancel participants' registration.
    """
    target_user_id = current_user.id
    if user_id and current_user.role in ["admin", "hod"]:
        target_user_id = user_id

    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == target_user_id,
    ).first()

    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration record not found for this event.",
        )

    reg.registration_status = "Cancelled"
    reg.updated_at = datetime.datetime.utcnow()
    db.commit()

    return ApiResponse(
        success=True,
        message="Registration successfully cancelled.",
        data={"registration_id": reg.id, "status": "Cancelled"},
    )


# ==========================================================
# 9. GET EVENT PARTICIPANTS (ADMIN & HOD)
# ==========================================================
@router.get("/{event_id}/participants", response_model=List[EventRegistrationOut])
def get_event_participants(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    View registered participants for an event.
    - Admin can view for any event.
    - HOD can view ONLY for their own department events.
    - Teachers and students cannot access (HTTP 403 Forbidden).
    """
    if current_user.role not in ["admin", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin and HOD can view event participants.",
        )

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )

    if current_user.role == "hod" and event.department_id != current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HOD cannot view participants for events belonging to another department.",
        )

    registrations = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id
    ).order_by(EventRegistration.registration_date.asc()).all()

    result = []
    for r in registrations:
        u = r.user
        s = r.student
        dept = u.department.name if (u and u.department) else (s.department.name if (s and s.department) else "General")
        result.append({
            "id": r.id,
            "event_id": r.event_id,
            "user_id": r.user_id,
            "student_id": r.student_id,
            "registration_date": r.registration_date,
            "registration_status": r.registration_status,
            "attendance_status": r.attendance_status,
            "user_name": u.name if u else (s.name if s else "Unknown"),
            "user_email": u.email if u else (s.email if s else ""),
            "user_role": u.role if u else "student",
            "student_usn": s.usn if s else (u.email if u else "N/A"),
            "department_name": dept,
            "semester": s.semester if s else (u.semester if u else None),
            "section": s.section if s else (u.section if u else None),
        })

    return result


# ==========================================================
# 10. MARK EVENT ATTENDANCE (ADMIN & HOD)
# ==========================================================
@router.post("/{event_id}/attendance", response_model=ApiResponse)
def mark_event_attendance(
    event_id: int,
    payload: EventAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark attendance for registered event participants.
    - Admin can mark attendance for any event.
    - HOD can mark attendance ONLY for their own department events.
    - Flow: Present / Absent
    """
    if current_user.role not in ["admin", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin and HOD can mark event attendance.",
        )

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID {event_id} not found",
        )

    if current_user.role == "hod" and event.department_id != current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HOD cannot mark attendance for events belonging to another department.",
        )

    updated_count = 0

    # 1. Batch Attendance Updates
    if payload.attendance:
        for item in payload.attendance:
            query = db.query(EventRegistration).filter(EventRegistration.event_id == event_id)
            if item.registration_id:
                reg = query.filter(EventRegistration.id == item.registration_id).first()
            elif item.user_id:
                reg = query.filter(EventRegistration.user_id == item.user_id).first()
            else:
                continue

            if reg:
                reg.attendance_status = item.attendance_status
                reg.updated_at = datetime.datetime.utcnow()
                updated_count += 1

    # 2. Single item update
    elif payload.user_id and payload.attendance_status:
        reg = db.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == payload.user_id,
        ).first()
        if reg:
            reg.attendance_status = payload.attendance_status
            reg.updated_at = datetime.datetime.utcnow()
            updated_count += 1

    db.commit()

    return ApiResponse(
        success=True,
        message=f"Attendance updated successfully for {updated_count} participants.",
        data={"updated_count": updated_count},
    )


# ==========================================================
# 11. MY REGISTRATIONS & MY EVENTS
# ==========================================================
@router.get("/my-registrations", response_model=List[EventOut])
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all events the authenticated user has registered for."""
    user_regs = db.query(EventRegistration).filter(
        EventRegistration.user_id == current_user.id,
        EventRegistration.registration_status == "Registered",
    ).all()

    event_ids = [r.event_id for r in user_regs]
    if not event_ids:
        return []

    events = db.query(Event).filter(Event.id.in_(event_ids)).order_by(Event.event_date.asc()).all()
    return [format_event_out(ev, current_user, db) for ev in events]


@router.get("/my-events", response_model=List[EventOut])
def get_my_created_or_dept_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve events managed or created by the authenticated user."""
    query = db.query(Event)
    if current_user.role == "admin":
        events = query.order_by(Event.event_date.desc()).all()
    elif current_user.role == "hod":
        events = query.filter(
            or_(Event.created_by == current_user.id, Event.department_id == current_user.department_id)
        ).order_by(Event.event_date.desc()).all()
    else:
        # For teachers/students, return events created by them or registered by them
        user_regs = db.query(EventRegistration).filter(
            EventRegistration.user_id == current_user.id,
            EventRegistration.registration_status == "Registered",
        ).all()
        event_ids = [r.event_id for r in user_regs]
        events = query.filter(
            or_(Event.created_by == current_user.id, Event.id.in_(event_ids))
        ).order_by(Event.event_date.desc()).all()

    return [format_event_out(ev, current_user, db) for ev in events]
