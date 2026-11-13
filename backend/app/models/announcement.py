import datetime
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), default="General")  # Academic, Examination, Placement, Sports, Cultural, Administration, General
    priority = Column(String(50), default="Normal")    # Normal, Important, Urgent
    target_audience = Column(String(100), default="All Users")  # All Students, Students, Teachers, HOD, Specific Department, Specific Semester, Specific Section, All Users
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    publish_date = Column(Date, default=datetime.date.today)
    expiry_date = Column(Date, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="Active")  # Active, Inactive, Archived
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    department = relationship("Department")
    creator = relationship("User", foreign_keys=[created_by])
