import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class BusStop(Base):
    __tablename__ = "bus_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("bus_routes.id"), nullable=False, index=True)
    stop_order = Column(Integer, nullable=False, default=1)
    stop_name = Column(String(150), nullable=False)
    latitude = Column(String(50), nullable=True, default="Not provided")
    longitude = Column(String(50), nullable=True, default="Not provided")
    pickup_time = Column(String(50), nullable=True, default="Not provided")
    drop_time = Column(String(50), nullable=True, default="Not provided")
    status = Column(String(50), default="active")  # active, inactive
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    route = relationship("BusRoute", back_populates="stops")
    assignments = relationship("StudentBusAssignment", back_populates="stop")
