import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    designation = Column(String(100), default="Assistant Professor")
    username = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=True)
    status = Column(String(50), default="active")  # active, inactive
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="teachers")
    subjects = relationship("Subject", back_populates="teacher")
    timetables = relationship("Timetable", back_populates="teacher", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="teacher", cascade="all, delete-orphan")
