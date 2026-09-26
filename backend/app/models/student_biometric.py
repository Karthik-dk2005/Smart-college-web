import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class StudentBiometric(Base):
    __tablename__ = "student_biometrics"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False, index=True)
    # Encrypted/hashed minutiae template token or provider hardware template ID (Never raw image)
    template_hash = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=False, default="DEVELOPMENT_MOCK")
    status = Column(String(50), nullable=False, default="active")
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationship
    student = relationship("Student", back_populates="biometric_profile")
