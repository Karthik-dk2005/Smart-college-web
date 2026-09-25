from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester = Column(Integer, nullable=False, default=5)
    section = Column(String(10), nullable=False, default="A")
    day = Column(String(50), nullable=False)  # Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
    start_time = Column(String(50), nullable=False)  # e.g. 09:00
    end_time = Column(String(50), nullable=False)    # e.g. 10:00
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=False)
    room_number = Column(String(50), nullable=False)  # e.g. CS-303, CS-304

    # Relationships
    department = relationship("Department", back_populates="timetables")
    subject = relationship("Subject", back_populates="timetables")
    faculty = relationship("Faculty", back_populates="timetables")
