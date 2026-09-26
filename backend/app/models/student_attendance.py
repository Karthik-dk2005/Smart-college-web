import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class StudentAttendance(Base):
    __tablename__ = "student_attendance"

    id = Column(Integer, primary_key=True, index=True)
    attendance_session_id = Column(Integer, ForeignKey("attendance_sessions.id"), nullable=False, index=True)
    attendance_interval_id = Column(Integer, ForeignKey("attendance_intervals.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="Present")  # 'Present' or 'Absent'
    marked_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("attendance_interval_id", "student_id", name="uq_student_interval_attendance"),
    )

    # Relationships
    session = relationship("AttendanceSession", back_populates="student_attendances")
    interval = relationship("AttendanceInterval", back_populates="student_attendances")
    student = relationship("Student", back_populates="interval_attendances")
