from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import BusRoute, User
from app.schemas import BusRouteCreate, BusRouteUpdate, BusRouteOut, ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role, get_client_ip
from app.utils import log_audit_event

router = APIRouter(prefix="/api/bus", tags=["College Bus Transit"])


@router.get("", response_model=List[BusRouteOut])
def get_bus_routes(
    active_only: bool = Query(True, description="Filter active routes only"),
    search: Optional[str] = Query(None, description="Search route name, stops, or route number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all college transit bus routes, stops, and schedules."""
    query = db.query(BusRoute)
    if active_only:
        query = query.filter(BusRoute.is_active == True)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (BusRoute.route_name.ilike(search_filter))
            | (BusRoute.route_number.ilike(search_filter))
            | (BusRoute.stops.ilike(search_filter))
            | (BusRoute.bus_number.ilike(search_filter))
        )

    return query.order_by(BusRoute.route_number.asc()).all()


@router.get("/{id}", response_model=BusRouteOut)
def get_bus_route_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full details of a specific bus route."""
    route = db.query(BusRoute).filter(BusRoute.id == id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bus route with ID {id} not found",
        )
    return route


@router.post("", response_model=BusRouteOut, status_code=status.HTTP_201_CREATED)
def create_bus_route(
    payload: BusRouteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "hod"])),
):
    """Create a new college transit bus route (Admin or HOD)."""
    # Check for duplicate bus_number or route_number
    existing_bus = db.query(BusRoute).filter(
        (BusRoute.bus_number == payload.bus_number) | (BusRoute.route_number == payload.route_number)
    ).first()
    if existing_bus:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A bus route with this bus number or route number already exists",
        )

    route = BusRoute(
        bus_number=payload.bus_number,
        route_number=payload.route_number,
        route_name=payload.route_name,
        driver_name=payload.driver_name,
        driver_phone=payload.driver_phone,
        capacity=payload.capacity,
        stops=payload.stops,
        morning_timing=payload.morning_timing,
        evening_timing=payload.evening_timing,
        weekday_schedule=payload.weekday_schedule,
        weekend_schedule=payload.weekend_schedule,
        holiday_schedule=payload.holiday_schedule,
        special_schedule=payload.special_schedule,
        is_active=True,
    )
    db.add(route)
    db.commit()
    db.refresh(route)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="CREATE_BUS_ROUTE",
        module="bus",
        record_id=str(route.id),
        details=f"Created route {route.route_number}: {route.route_name}",
        ip_address=get_client_ip(request),
    )

    return route


@router.put("/{id}", response_model=BusRouteOut)
def update_bus_route(
    id: int,
    payload: BusRouteUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["admin", "hod"])),
):
    """Update bus route schedules or details (Admin or HOD)."""
    route = db.query(BusRoute).filter(BusRoute.id == id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bus route with ID {id} not found",
        )

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(route, field, value)

    db.commit()
    db.refresh(route)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="UPDATE_BUS_ROUTE",
        module="bus",
        record_id=str(route.id),
        details=f"Updated route {route.route_number}",
        ip_address=get_client_ip(request),
    )

    return route


@router.delete("/{id}", response_model=ApiResponse)
def delete_bus_route(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Delete a bus route (Admin only)."""
    route = db.query(BusRoute).filter(BusRoute.id == id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bus route with ID {id} not found",
        )

    route_num = route.route_number
    db.delete(route)
    db.commit()

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="DELETE_BUS_ROUTE",
        module="bus",
        record_id=str(id),
        details=f"Deleted bus route {route_num}",
        ip_address=get_client_ip(request),
    )

    return ApiResponse(
        success=True,
        message=f"Bus route {route_num} deleted successfully",
    )
