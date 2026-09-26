import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(50), nullable=True)
    subject_name = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    semester = Column(Integer, nullable=True)
    credits = Column(Integer, default=4)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="subjects")
    teacher = relationship("Teacher", back_populates="subjects")
    timetables = relationship("Timetable", back_populates="subject", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="subject")
