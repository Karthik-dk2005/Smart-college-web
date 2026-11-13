import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models import Announcement, User, Notification
from app.schemas import (
    AnnouncementCreate, AnnouncementUpdate, AnnouncementOut, ApiResponse
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/announcements", tags=["Announcements"])


def format_announcement_out(ann: Announcement) -> dict:
    dept_name = ann.department.name if ann.department else "All Departments"
    creator_name = ann.creator.name if ann.creator else "System Administrator"

    return {
        "id": ann.id,
        "title": ann.title,
        "content": ann.content,
        "category": ann.category or "General",
        "priority": ann.priority or "Normal",
        "target_audience": ann.target_audience or "All Users",
        "department_id": ann.department_id,
        "publish_date": ann.publish_date,
        "expiry_date": ann.expiry_date,
        "status": ann.status or "Active",
        "created_by": ann.created_by,
        "creator_name": creator_name,
        "department_name": dept_name,
        "created_at": ann.created_at,
        "updated_at": ann.updated_at,
    }


# ==========================================================
# 1. LIST ANNOUNCEMENTS
# ==========================================================
@router.get("", response_model=List[AnnouncementOut])
def get_announcements(
    priority: Optional[str] = Query(None, description="Filter by priority: Normal, Important, Urgent"),
    category: Optional[str] = Query(None, description="Filter by category"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    search: Optional[str] = Query(None, description="Search announcement title/content"),
    active_only: bool = Query(True, description="Only active announcements"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all announcements matching criteria."""
    query = db.query(Announcement)

    # Active status filter
    if active_only and current_user.role not in ["admin", "hod"]:
        query = query.filter(Announcement.status == "Active")

    if priority and priority != "All":
        query = query.filter(Announcement.priority == priority)

    if category and category != "All":
        query = query.filter(Announcement.category == category)

    if department_id:
        query = query.filter(
            or_(Announcement.department_id == department_id, Announcement.department_id == None)
        )

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Announcement.title.ilike(search_pattern),
                Announcement.content.ilike(search_pattern),
                Announcement.category.ilike(search_pattern),
            )
        )

    announcements = query.order_by(
        Announcement.publish_date.desc(), Announcement.created_at.desc()
    ).all()

    return [format_announcement_out(a) for a in announcements]


# ==========================================================
# 2. GET SINGLE ANNOUNCEMENT
# ==========================================================
@router.get("/{id}", response_model=AnnouncementOut)
def get_announcement(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single announcement by ID."""
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Announcement with ID {id} not found",
        )
    return format_announcement_out(ann)


# ==========================================================
# 3. CREATE ANNOUNCEMENT (ADMIN & HOD)
# ==========================================================
@router.post("", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new announcement.
    - Admin has full announcement management.
    - HOD can create announcements for their own department.
    - Teachers and students cannot create announcements (HTTP 403 Forbidden).
    """
    if current_user.role not in ["admin", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to post announcements.",
        )

    dept_id = payload.department_id
    if current_user.role == "hod":
        dept_id = current_user.department_id

    new_ann = Announcement(
        title=payload.title,
        content=payload.content,
        category=payload.category or "General",
        priority=payload.priority or "Normal",
        target_audience=payload.target_audience or "All Users",
        department_id=dept_id,
        publish_date=payload.publish_date or datetime.date.today(),
        expiry_date=payload.expiry_date,
        created_by=current_user.id,
        status=payload.status or "Active",
    )

    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)

    # Automatically broadcast notification to users
    try:
        notif = Notification(
            user_id=None,
            title=f"New Announcement: {new_ann.title}",
            message=new_ann.content[:150] + ("..." if len(new_ann.content) > 150 else ""),
            category="announcement",
            link="/announcements",
        )
        db.add(notif)
        db.commit()
    except Exception:
        pass

    return format_announcement_out(new_ann)


# ==========================================================
# 4. UPDATE ANNOUNCEMENT (ADMIN & HOD)
# ==========================================================
@router.put("/{id}", response_model=AnnouncementOut)
def update_announcement(
    id: int,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an announcement.
    - Admin can update any announcement.
    - HOD can only update announcements belonging to their department.
    - Teachers and students cannot update announcements (HTTP 403 Forbidden).
    """
    if current_user.role not in ["admin", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update announcements.",
        )

    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Announcement with ID {id} not found",
        )

    if current_user.role == "hod" and ann.department_id != current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HOD cannot update announcements belonging to another department.",
        )

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(ann, field, val)

    ann.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(ann)

    return format_announcement_out(ann)


# ==========================================================
# 5. DELETE ANNOUNCEMENT (ADMIN & HOD)
# ==========================================================
@router.delete("/{id}", response_model=ApiResponse)
def delete_announcement(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an announcement.
    - Admin can delete any announcement.
    - HOD can only delete announcements belonging to their department.
    - Teachers and students cannot delete announcements (HTTP 403 Forbidden).
    """
    if current_user.role not in ["admin", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete announcements.",
        )

    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Announcement with ID {id} not found",
        )

    if current_user.role == "hod" and ann.department_id != current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HOD cannot delete announcements belonging to another department.",
        )

    title = ann.title
    db.delete(ann)
    db.commit()

    return ApiResponse(
        success=True,
        message=f"Announcement '{title}' deleted successfully.",
    )
