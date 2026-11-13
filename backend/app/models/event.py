import datetime
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False, default="")
    category = Column(String(100), nullable=False)  # Academic, Technical, Cultural, Sports, Workshop, Seminar, Conference, Hackathon, Club Activity, Placement, Meeting, Other
    event_date = Column(Date, nullable=False)
    start_time = Column(String(50), nullable=False)  # e.g., "10:00 AM" or "10:00"
    end_time = Column(String(50), nullable=False)    # e.g., "01:00 PM" or "13:00"
    venue = Column(String(255), nullable=False)
    organizer = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    target_audience = Column(String(100), default="All Students")  # All Students, Students, Teachers, HOD, Specific Department, Specific Semester, Specific Section, All Users
    target_semester = Column(Integer, nullable=True)
    target_section = Column(String(50), nullable=True)
    registration_required = Column(Boolean, default=True)
    registration_deadline = Column(DateTime, nullable=True)
    max_participants = Column(Integer, default=100)
    status = Column(String(50), default="Upcoming")  # Upcoming, Ongoing, Completed, Cancelled
    is_published = Column(Boolean, default=True)
    image_url = Column(String(500), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    department = relationship("Department")
    creator = relationship("User", foreign_keys=[created_by])
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    registration_date = Column(DateTime, default=datetime.datetime.utcnow)
    registration_status = Column(String(50), default="Registered")  # Registered, Cancelled, Waitlisted
    attendance_status = Column(String(50), default="Not Marked")  # Not Marked, Present, Absent
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="registrations")
    user = relationship("User", foreign_keys=[user_id])
    student = relationship("Student", foreign_keys=[student_id])
