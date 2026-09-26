import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=True)  # Student ID / USN
    usn = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    semester = Column(Integer, nullable=False, default=5)
    section = Column(String(10), nullable=False, default="A")
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    admission_year = Column(Integer, nullable=True, default=2024)
    username = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="active")  # active, inactive
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    attendances = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    interval_attendances = relationship("StudentAttendance", back_populates="student", cascade="all, delete-orphan")

