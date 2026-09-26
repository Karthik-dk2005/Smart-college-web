from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
import json

from app.database import get_db, SessionLocal
from app.models.location import Location
from app.models.user import User
from app.schemas.location import LocationUpdate, LocationOut
from app.dependencies import get_current_user, require_any_role
from app.utils.geofence import verify_location_in_department
from app.utils.response import success_response
from app.utils.security import decode_token

router = APIRouter(prefix="/api/location", tags=["Locations"])


class LocationConnectionManager:
    """Manages real-time WebSocket connections for live location feeds."""
    def __init__(self):
        # Map user_id to list of active WebSockets listening to that user
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_location(self, user_id: int, data: dict):
        if user_id in self.active_connections:
            message = json.dumps(data)
            dead_sockets = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead_sockets.append(ws)
            for ws in dead_sockets:
                self.disconnect(user_id, ws)


manager = LocationConnectionManager()


@router.post("/update", status_code=status.HTTP_201_CREATED)
async def update_location(
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update real-time GPS coordinates for current user.
    Evaluates department geofence (DEPARTMENT_LATITUDE, DEPARTMENT_LONGITUDE, DEPARTMENT_RADIUS_METERS)
    and broadcasts to WebSocket subscribers.
    """
    in_geofence, distance = verify_location_in_department(payload.latitude, payload.longitude)

    loc = Location(
        user_id=current_user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy=payload.accuracy,
        timestamp=payload.timestamp or datetime.utcnow(),
        location_type=payload.location_type or "device"
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)

    loc_dict = LocationOut.model_validate(loc).model_dump()
    loc_dict["in_geofence"] = in_geofence
    loc_dict["distance_meters"] = distance
    loc_dict["user_name"] = current_user.name
    loc_dict["timestamp"] = loc.timestamp.isoformat()

    # Broadcast to active WebSocket listeners
    await manager.broadcast_location(current_user.id, loc_dict)

    return success_response(
        data=loc_dict,
        message="Location updated successfully",
        status_code=status.HTTP_201_CREATED
    )


@router.get("/current/{user_id}")
def get_current_location(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the latest recorded GPS location for a specific user."""


    loc = db.query(Location).filter(Location.user_id == user_id).order_by(Location.timestamp.desc()).first()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No location recorded for this user")

    in_geofence, distance = verify_location_in_department(loc.latitude, loc.longitude)
    data = LocationOut.model_validate(loc).model_dump()
    data["in_geofence"] = in_geofence
    data["distance_meters"] = distance

    return success_response(data=data, message="Current location retrieved successfully")


@router.get("/history/{user_id}")
def get_location_history(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chronological location history for a user."""


    locations = db.query(Location).filter(
        Location.user_id == user_id
    ).order_by(Location.timestamp.desc()).limit(limit).all()

    data = [LocationOut.model_validate(l).model_dump() for l in locations]
    return success_response(data=data, message="Location history retrieved successfully")


@router.websocket("/ws/{user_id}")
async def location_websocket_endpoint(websocket: WebSocket, user_id: int, token: Optional[str] = Query(None)):
    """
    Live WebSocket feed for user location updates.
    Authentication can be provided via query param `?token=...`.
    """
    # Verify token if passed
    if token:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep socket alive and allow incoming client location pings if sent over WS
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                if "latitude" in msg and "longitude" in msg:
                    # Save incoming socket ping to db
                    with SessionLocal() as db:
                        in_geo, dist = verify_location_in_department(msg["latitude"], msg["longitude"])
                        loc = Location(
                            user_id=user_id,
                            latitude=msg["latitude"],
                            longitude=msg["longitude"],
                            accuracy=msg.get("accuracy"),
                            timestamp=datetime.utcnow(),
                            location_type="websocket"
                        )
                        db.add(loc)
                        db.commit()
                        db.refresh(loc)
                        broadcast_data = LocationOut.model_validate(loc).model_dump()
                        broadcast_data["in_geofence"] = in_geo
                        broadcast_data["distance_meters"] = dist
                        broadcast_data["timestamp"] = loc.timestamp.isoformat()
                        await manager.broadcast_location(user_id, broadcast_data)
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
