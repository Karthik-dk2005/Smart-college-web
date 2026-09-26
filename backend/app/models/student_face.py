import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class StudentFace(Base):
    __tablename__ = "student_faces"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False, index=True)
    # Face embedding representation serialized as JSON list of floats (128-d vector)
    embedding = Column(Text, nullable=False)
    # Metadata such as sample quality score, liveness check status
    quality_score = Column(String(50), nullable=True, default="high")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationship
    student = relationship("Student", back_populates="face_profile")
