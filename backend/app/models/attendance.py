import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    timetable_id = Column(Integer, ForeignKey("timetables.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(String(50), nullable=False)  # YYYY-MM-DD
    start_time = Column(String(50), nullable=True)
    end_time = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="Present")  # Present, Absent
    marked_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("student_id", "timetable_id", "date", name="uq_student_timetable_date"),
    )

    # Relationships
    student = relationship("Student", back_populates="attendances")
    timetable = relationship("Timetable", back_populates="attendances")
    teacher = relationship("Teacher", back_populates="attendances")
    subject = relationship("Subject", back_populates="attendances")
