import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    teachers = relationship("Teacher", back_populates="department", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="department", cascade="all, delete-orphan")
    timetables = relationship("Timetable", back_populates="department", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="department")
    faculties = relationship("Faculty", back_populates="department")
