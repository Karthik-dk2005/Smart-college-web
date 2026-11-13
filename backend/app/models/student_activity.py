import datetime
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class StudentActivity(Base):
    __tablename__ = "student_activities"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    activity_type = Column(String(100), nullable=False)  # Academic, Technical, Sports, Cultural, Competition, Workshop, Seminar, Internship, Project, Hackathon, Certification, Volunteering, Club Activity, Other
    description = Column(Text, nullable=True)
    activity_date = Column(Date, nullable=True)
    organizing_institution = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    level = Column(String(100), nullable=True)  # College, Department, University, District, State, National, International
    position_award = Column(String(100), nullable=True)  # Winner, Runner-up, First Place, Participant, etc.
    location = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="PENDING")  # PENDING, VERIFIED, REJECTED
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    student = relationship("Student", backref="activities")
    files = relationship("StudentActivityFile", back_populates="activity", cascade="all, delete-orphan")
    verifications = relationship(
        "StudentActivityVerification",
        back_populates="activity",
        cascade="all, delete-orphan",
        order_by="desc(StudentActivityVerification.verified_at)"
    )


class StudentActivityFile(Base):
    __tablename__ = "student_activity_files"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("student_activities.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)  # e.g., "application/pdf", "image/png"
    file_size = Column(Integer, nullable=True)      # size in bytes
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    activity = relationship("StudentActivity", back_populates="files")


class StudentActivityVerification(Base):
    __tablename__ = "student_activity_verifications"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("student_activities.id", ondelete="CASCADE"), nullable=False, index=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verification_role = Column(String(50), nullable=True)  # admin, hod
    status = Column(String(50), nullable=False)            # VERIFIED, REJECTED
    rejection_reason = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    activity = relationship("StudentActivity", back_populates="verifications")
    verifier = relationship("User", foreign_keys=[verified_by])
