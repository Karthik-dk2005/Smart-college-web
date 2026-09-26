import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id"), nullable=False, index=True)
    date = Column(String(50), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    timetable = relationship("Timetable", back_populates="attendance_sessions")
    intervals = relationship(
        "AttendanceInterval",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="AttendanceInterval.duration_number"
    )
    student_attendances = relationship(
        "StudentAttendance",
        back_populates="session",
        cascade="all, delete-orphan"
    )
