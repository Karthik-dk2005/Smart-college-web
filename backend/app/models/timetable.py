import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester = Column(Integer, nullable=True)
    section = Column(String(50), nullable=True)
    day = Column(String(50), nullable=False)
    period_number = Column(Integer, nullable=True)
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    timetable_type = Column(String(50), default="regular")
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="timetables")
    subject = relationship("Subject", back_populates="timetables")
    teacher = relationship("Teacher", back_populates="timetables")
    room = relationship("Room", back_populates="timetables")
    attendances = relationship("Attendance", back_populates="timetable", cascade="all, delete-orphan")
    attendance_sessions = relationship("AttendanceSession", back_populates="timetable", cascade="all, delete-orphan")

