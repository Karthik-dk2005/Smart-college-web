import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    sl_no = Column(Integer, nullable=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True, index=True)
    usn = Column(String(50), nullable=False, index=True)
    student_name = Column(String(255), nullable=False)
    section = Column(String(10), nullable=False, index=True)  # 'A' or 'B'
    semester = Column(Integer, nullable=False, default=5, index=True)
    department = Column(String(100), default="Computer Science and Engineering")
    academic_year = Column(String(50), default="2024-2025")
    assessment_name = Column(String(100), default="First Internal Assessment")
    ia_number = Column(String(20), default="IA-1", index=True)

    # Subject details
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True, index=True)
    subject_code = Column(String(50), nullable=False, index=True)
    subject_name = Column(String(255), nullable=False)
    short_name = Column(String(50), nullable=True)

    # IA-1 Assessment Marks
    maximum_marks = Column(Float, nullable=False, default=30.0)
    obtained_marks = Column(Float, nullable=True)  # None if Absent (AB), preserves decimals like 27.5
    scaled_max_marks = Column(Float, nullable=True)
    scaled_marks = Column(Float, nullable=True)
    is_absent = Column(Boolean, default=False)
    status = Column(String(20), default="Present")  # 'Present' or 'Absent'

    # IA-2 Assessment Marks (Only populated when IA-2 data is explicitly entered)
    ia2_maximum_marks = Column(Float, nullable=True)
    ia2_obtained_marks = Column(Float, nullable=True)
    ia2_scaled_max_marks = Column(Float, nullable=True)
    ia2_scaled_marks = Column(Float, nullable=True)
    ia2_is_absent = Column(Boolean, default=False)
    ia2_status = Column(String(20), nullable=True)

    # Additional audit & evaluation metadata
    evaluated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    student = relationship("Student", foreign_keys=[student_id])
    subject = relationship("Subject", foreign_keys=[subject_id])

