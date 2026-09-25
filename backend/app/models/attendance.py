import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=False)
    date = Column(String(50), nullable=False)  # YYYY-MM-DD
    status = Column(String(50), nullable=False, default="present")  # present, absent, late, leave
    check_in_time = Column(DateTime, default=datetime.datetime.utcnow)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    remarks = Column(String(255), nullable=True)

    # Relationships
    student = relationship("Student", back_populates="attendances")
    subject = relationship("Subject", back_populates="attendances")
    faculty = relationship("Faculty", back_populates="attendances")
