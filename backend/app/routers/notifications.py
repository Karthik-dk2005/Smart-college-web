from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from typing import List, Optional, Dict, Any
import datetime

from app.database import get_db
from app.models import Notification, User
from app.models.notification_preference import NotificationPreference
from app.schemas.notification import (
    NotificationCreate,
    NotificationSendRequest,
    NotificationOut,
    NotificationPreferenceSchema,
    TestSMTPRequest,
)
from app.schemas.auth import ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role
from app.services.email_notification_service import EmailNotificationService

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut])
def get_user_notifications(
    unread_only: bool = Query(False, description="Filter unread notifications only"),
    category: Optional[str] = Query(None, description="Filter by category"),
    notification_type: Optional[str] = Query(None, description="Filter by notification type"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve notification inbox for the authenticated user.
    Students see only their own notifications.
    Staff see their targeted notifications and broadcasts.
    """
    query = db.query(Notification).filter(
        or_(Notification.user_id == current_user.id, Notification.user_id == None)
    )

    if unread_only:
        query = query.filter(Notification.read == False)
    if category:
        query = query.filter(Notification.category == category)
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)

    return query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Quick endpoint for notification bell badge count."""
    count = db.query(func.count(Notification.id)).filter(
        or_(Notification.user_id == current_user.id, Notification.user_id == None),
        Notification.read == False
    ).scalar() or 0

    return {"unread_count": count}


@router.get("/history", response_model=List[NotificationOut])
def get_notification_history(
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "hod", "teacher"])),
):
    """
    View complete system notification dispatch history, delivery status,
    and timestamps (accessible by Admin, HOD, and Teachers).
    """
    query = db.query(Notification)
    if current_user.role == "teacher":
        query = query.filter(
            or_(Notification.user_id == current_user.id, Notification.category.in_(["academic", "announcement", "event"]))
        )
    return query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()


@router.post("/send", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def send_custom_notification(
    payload: NotificationSendRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "hod", "teacher"])),
):
    """
    Dispatch custom notification via Gmail SMTP and in-app system.
    Supports specific user targeting or role-based broadcasting.
    Runs in background task for high-throughput responses.
    """
    # 1. Target individual user
    if payload.user_id:
        target = db.query(User).filter(User.id == payload.user_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="Target user not found")

        notif = EmailNotificationService.create_and_send_notification(
            db=db,
            user_id=target.id,
            title=payload.title,
            message=payload.message,
            notification_type=payload.notification_type or "general",
            category=payload.category or "general",
            link=payload.link,
            recipient_email=payload.recipient_email
        )
        return {
            "success": True,
            "message": "Notification dispatched successfully",
            "notification_id": notif.id,
            "delivery_status": notif.delivery_status
        }

    # 2. Target specific recipient email directly
    elif payload.recipient_email:
        notif = EmailNotificationService.create_and_send_notification(
            db=db,
            user_id=None,
            title=payload.title,
            message=payload.message,
            notification_type=payload.notification_type or "general",
            category=payload.category or "general",
            link=payload.link,
            direct_email=payload.recipient_email
        )
        return {
            "success": True,
            "message": f"Email notification sent to {payload.recipient_email}",
            "notification_id": notif.id,
            "delivery_status": notif.delivery_status
        }

    # 3. Broadcast to a role or all
    elif payload.target_role:
        role_target = payload.target_role.lower()
        if role_target == "event":
            count = EmailNotificationService.notify_event_broadcast(
                db=db,
                title=payload.title,
                description=payload.message,
                event_date="Scheduled",
                venue="Campus",
                target_role="all"
            )
        else:
            count = EmailNotificationService.notify_announcement_broadcast(
                db=db,
                title=payload.title,
                content=payload.message,
                target_role=role_target
            )
        return {
            "success": True,
            "message": f"Broadcast notification sent to {count} recipient(s)",
            "recipients_count": count
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either user_id, recipient_email, or target_role must be provided"
        )


@router.post("/test-smtp")
def test_smtp_configuration(
    payload: TestSMTPRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "hod"])),
):
    """
    Test Gmail SMTP delivery with active settings.
    Dispatches a live test email and reports immediate connection/handshake status.
    """
    target_email = payload.test_email or current_user.email
    cfg = EmailNotificationService.get_smtp_config()

    html_content = EmailNotificationService.build_branded_html(
        title=payload.subject or "SmartDept Gmail SMTP Test",
        message=payload.message or "This test email confirms that your Gmail SMTP configuration is operational.",
        badge_text="SMTP TEST VERIFICATION",
        details={
            "SMTP Host": cfg["host"],
            "SMTP Port": str(cfg["port"]),
            "Sender Email": cfg["from_email"],
            "Test Recipient": target_email,
            "Initiated By": f"{current_user.full_name or current_user.name} ({current_user.role.upper()})",
            "Timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        }
    )

    success, error_msg = EmailNotificationService.send_smtp_email(
        to_email=target_email,
        subject=payload.subject or "SmartDept Gmail SMTP Test Verification",
        html_content=html_content,
        text_content=payload.message or "Test email confirmation."
    )

    # Log in database as system notification
    notif = Notification(
        user_id=current_user.id,
        title=payload.subject or "SMTP Test Verification",
        message=payload.message or "Test email dispatched.",
        category="system",
        notification_type="system",
        recipient_email=target_email,
        delivery_status="sent" if success else "failed",
        error_log=error_msg,
        sent_at=datetime.datetime.utcnow() if success else None,
        read=False
    )
    db.add(notif)
    db.commit()

    if not success:
        return {
            "success": False,
            "message": f"SMTP test failed: {error_msg}",
            "error": error_msg,
            "config": {
                "host": cfg["host"],
                "port": cfg["port"],
                "username_configured": bool(cfg["username"]),
                "sender": cfg["from_email"]
            }
        }

    return {
        "success": True,
        "message": f"Test email successfully dispatched to {target_email}",
        "config": {
            "host": cfg["host"],
            "port": cfg["port"],
            "sender": cfg["from_email"],
            "is_real_smtp": EmailNotificationService.is_real_smtp_configured()
        }
    }


@router.get("/preferences", response_model=NotificationPreferenceSchema)
def get_user_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve notification preferences for the logged-in user."""
    pref = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()

    if not pref:
        # Create default all True
        pref = NotificationPreference(
            user_id=current_user.id,
            email_attendance=True,
            email_marks=True,
            email_timetable=True,
            email_announcements=True,
            email_events=True,
            email_system=True
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return pref


@router.put("/preferences", response_model=NotificationPreferenceSchema)
def update_user_preferences(
    payload: NotificationPreferenceSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update notification preferences for the logged-in user."""
    pref = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()

    if not pref:
        pref = NotificationPreference(user_id=current_user.id)
        db.add(pref)

    pref.email_attendance = payload.email_attendance
    pref.email_marks = payload.email_marks
    pref.email_timetable = payload.email_timetable
    pref.email_announcements = payload.email_announcements
    pref.email_events = payload.email_events
    pref.email_system = payload.email_system

    db.commit()
    db.refresh(pref)
    return pref


@router.put("/read-all", response_model=ApiResponse)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications of the authenticated user as read."""
    unread_count = (
        db.query(Notification)
        .filter(or_(Notification.user_id == current_user.id, Notification.user_id == None), Notification.read == False)
        .update({Notification.read: True}, synchronize_session=False)
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


@router.delete("/{id}", response_model=ApiResponse)
def delete_notification(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a notification from user inbox."""
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notif.user_id is not None and notif.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Cannot delete other users' notifications")

    db.delete(notif)
    db.commit()
    return ApiResponse(success=True, message="Notification deleted successfully")
