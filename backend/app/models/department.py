import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    hod_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    hod = relationship("User", foreign_keys=[hod_id])
    students = relationship("Student", back_populates="department")
    faculties = relationship("Faculty", back_populates="department")
    subjects = relationship("Subject", back_populates="department")
    timetables = relationship("Timetable", back_populates="department")
