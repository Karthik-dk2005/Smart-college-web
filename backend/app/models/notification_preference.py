import datetime
from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    
    # Granular email notification preferences
    email_attendance = Column(Boolean, default=True)
    email_marks = Column(Boolean, default=True)
    email_timetable = Column(Boolean, default=True)
    email_announcements = Column(Boolean, default=True)
    email_events = Column(Boolean, default=True)
    email_system = Column(Boolean, default=True)

    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationship
    user = relationship("User", foreign_keys=[user_id])
