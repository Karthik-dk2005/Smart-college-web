from fastapi import HTTPException, status
from app.config import settings
from app.utils import haversine_distance
from typing import Optional, Tuple


class GeofenceService:
    @staticmethod
    def verify_location(
        latitude: Optional[float],
        longitude: Optional[float],
        required: bool = True
    ) -> Tuple[bool, float, str]:
        """
        Verifies if coordinates are inside the official institution campus geofence.
        If outside and required=True, raises HTTP 403 with:
        {"detail": "You are outside the college campus."}
        """
        # If coordinates omitted
        if latitude is None or longitude is None:
            if required:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Campus GPS location required to verify attendance."
                )
            return False, 999999.0, "Coordinates not provided"

        # Calculate haversine distance to college coordinates
        distance_meters = haversine_distance(
            latitude,
            longitude,
            settings.COLLEGE_LAT,
            settings.COLLEGE_LON
        )

        is_inside = distance_meters <= settings.ATTENDANCE_RADIUS_METERS

        if not is_inside and required:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are outside the college campus."
            )

        msg = "Inside campus geofence" if is_inside else "Outside campus geofence"
        return is_inside, distance_meters, msg


geofence_service = GeofenceService()
