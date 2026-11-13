import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)  # legacy compatibility
    username = Column(String(100), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    mobile_number = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)  # legacy compatibility
    usn_or_employee_id = Column(String(100), index=True, nullable=True)
    role = Column(String(50), nullable=False)  # admin, hod, teacher, student
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    semester = Column(Integer, nullable=True)
    section = Column(String(50), nullable=True)
    designation = Column(String(100), nullable=True)
    account_status = Column(String(50), default="Approved", nullable=False)  # Pending, Approved, Rejected, Suspended
    is_active = Column(Boolean, default=True)
    reset_token = Column(String(255), nullable=True, index=True)
    reset_token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    department = relationship("Department")
    teacher = relationship("Teacher")
    student_profile = relationship("Student", back_populates="user", uselist=False)
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False)
    locations = relationship("Location", back_populates="user", cascade="all, delete-orphan")
    notices_created = relationship("Notice", back_populates="creator")

    def __init__(self, **kwargs):
        # Sync full_name <-> name
        if "full_name" in kwargs and "name" not in kwargs:
            kwargs["name"] = kwargs["full_name"]
        elif "name" in kwargs and "full_name" not in kwargs:
            kwargs["full_name"] = kwargs["name"]

        # Sync mobile_number <-> phone
        if "mobile_number" in kwargs and "phone" not in kwargs:
            kwargs["phone"] = kwargs["mobile_number"]
        elif "phone" in kwargs and "mobile_number" not in kwargs:
            kwargs["mobile_number"] = kwargs["phone"]

        # Default account_status
        if "account_status" not in kwargs:
            role = (kwargs.get("role") or "").lower()
            # New students registered publicly default to Pending, others to Approved
            kwargs["account_status"] = "Pending" if role == "student" else "Approved"

        super().__init__(**kwargs)
