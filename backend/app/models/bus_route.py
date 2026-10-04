import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class BusRoute(Base):
    __tablename__ = "bus_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_number = Column(Integer, unique=True, index=True, nullable=False)
    route_name = Column(String(100), nullable=False)
    bus_number = Column(String(50), nullable=True, default="Not provided")
    driver_name = Column(String(100), nullable=True, default="Not provided")
    driver_phone = Column(String(50), nullable=True, default="Not provided")
    start_point = Column(String(150), nullable=True, default="Not provided")
    end_point = Column(String(150), nullable=True, default="Not provided")
    departure_time = Column(String(50), nullable=True, default="Not provided")
    arrival_time = Column(String(50), nullable=True, default="Not provided")
    status = Column(String(50), default="active")  # active, inactive
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    stops = relationship(
        "BusStop",
        back_populates="route",
        cascade="all, delete-orphan",
        order_by="BusStop.stop_order",
    )
    assignments = relationship(
        "StudentBusAssignment",
        back_populates="route",
        cascade="all, delete-orphan",
    )
