import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class StudentBusAssignment(Base):
    __tablename__ = "student_bus_assignments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False, index=True)
    route_id = Column(Integer, ForeignKey("bus_routes.id"), nullable=False, index=True)
    stop_id = Column(Integer, ForeignKey("bus_stops.id"), nullable=True, index=True)
    transport_status = Column(String(50), nullable=False, default="Using Bus")  # Using Bus, Cancelled
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="bus_assignment")
    route = relationship("BusRoute", back_populates="assignments")
    stop = relationship("BusStop", back_populates="assignments")
