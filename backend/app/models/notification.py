import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="general")  # event, announcement, urgent, general
    link = Column(String(255), nullable=True)
    read = Column(Boolean, default=False)

    # SMTP Email Notification tracking
    recipient_email = Column(String(255), nullable=True, index=True)
    delivery_status = Column(String(50), default="pending")  # sent, failed, pending, in-app
    notification_type = Column(String(50), default="general")  # attendance, marks, timetable, event, announcement, user_account, system
    error_log = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
