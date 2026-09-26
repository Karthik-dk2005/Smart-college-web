import datetime
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AttendanceInterval(Base):
    __tablename__ = "attendance_intervals"

    id = Column(Integer, primary_key=True, index=True)
    attendance_session_id = Column(Integer, ForeignKey("attendance_sessions.id"), nullable=False, index=True)
    duration_number = Column(Integer, nullable=False)  # 1, 2, 3, 4
    start_time = Column(String(50), nullable=False)    # e.g. "09:00"
    end_time = Column(String(50), nullable=False)      # e.g. "09:30"
    duration_minutes = Column(Integer, default=30)     # e.g. 30

    # Relationships
    session = relationship("AttendanceSession", back_populates="intervals")
    student_attendances = relationship(
        "StudentAttendance",
        back_populates="interval",
        cascade="all, delete-orphan"
    )
