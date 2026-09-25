from sqlalchemy.orm import Session
from app.models import Notification, User
from typing import List, Optional


class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        category: str = "general",
        link: Optional[str] = None
    ) -> Notification:
        """Create and persist an individual user notification."""
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            link=link
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def broadcast_to_role(
        db: Session,
        role: str,
        title: str,
        message: str,
        category: str = "general",
        link: Optional[str] = None
    ) -> int:
        """Broadcast notification to all users belonging to a specific role."""
        users = db.query(User).filter(User.role == role.lower(), User.is_active == True).all()
        count = 0
        for u in users:
            notif = Notification(
                user_id=u.id,
                title=title,
                message=message,
                category=category,
                link=link
            )
            db.add(notif)
            count += 1
        db.commit()
        return count
