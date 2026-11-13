from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Notification, User
from app.schemas import NotificationCreate, NotificationOut, ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut])
def get_user_notifications(
    unread_only: bool = Query(False, description="Filter unread notifications only"),
    category: Optional[str] = Query(None, description="Filter by notification category"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all notifications for the authenticated user."""
    from sqlalchemy import or_
    query = db.query(Notification).filter(
        or_(Notification.user_id == current_user.id, Notification.user_id == None)
    )
    if unread_only:
        query = query.filter(Notification.read == False)
    if category is not None:
        query = query.filter(Notification.category == category)

    return query.order_by(Notification.created_at.desc()).limit(limit).all()


@router.post("", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["teacher", "hod", "admin"])),
):
    """Dispatch a custom notification to a specific user (Faculty, HOD, or Admin)."""
    target_user = db.query(User).filter(User.id == payload.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target user with ID {payload.user_id} not found",
        )

    notif = Notification(
        user_id=payload.user_id,
        title=payload.title,
        message=payload.message,
        category=payload.category,
        link=payload.link,
        read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/read-all", response_model=ApiResponse)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications of the authenticated user as read."""
    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.read == False)
        .update({Notification.read: True})
    )
    db.commit()
    return ApiResponse(
        success=True,
        message=f"{unread_count} notifications marked as read",
    )


@router.put("/{id}/read", response_model=NotificationOut)
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a specific notification as read."""
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {id} not found",
        )
    if notif.user_id is not None and notif.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot mark other users' notifications as read",
        )

    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif
