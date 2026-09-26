import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_name = Column(String(100), nullable=False)
    room_type = Column(String(50), nullable=True, default="Classroom")
    capacity = Column(Integer, default=60)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    timetables = relationship("Timetable", back_populates="room")
