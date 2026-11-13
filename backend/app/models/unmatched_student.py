import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base

class UnmatchedStudentRecord(Base):
    __tablename__ = "unmatched_student_records"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    excel_usn = Column(String(50), nullable=True)
    assigned_usn = Column(String(50), nullable=True)
    gmail = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    sheet_name = Column(String(50), nullable=True)
    reason = Column(String(255), nullable=False)
    status = Column(String(50), default="Pending")  # Pending, Resolved, Ignored
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

