from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.dependencies import get_current_user
from app.services.bus_service import BusService
from app.schemas.bus import (
    BusRouteCreate,
    BusRouteUpdate,
    BusRouteOut,
    BusRouteDetailOut,
    BusStopCreate,
    BusStopUpdate,
    BusStopOut,
    StudentBusAssignCreate,
    StudentBusAssignmentOut,
)

router = APIRouter(prefix="/api/buses", tags=["Bus Routes & Transit"])


def require_bus_admin(current_user: User = Depends(get_current_user)) -> User:
    """Enforce that only administrators can modify bus routes and assignments."""
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )
    return current_user


# ----------------------------------------------------
# 1. BUS ROUTES ENDPOINTS
# ----------------------------------------------------
@router.get("", response_model=List[BusRouteOut])
def get_all_buses(
    search: Optional[str] = Query(None, description="Search route number, name, bus number, or driver"),
    status: Optional[str] = Query("all", description="Filter by status: all, active, inactive"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all bus routes (Routes 1–28) with optional search and status filter."""
    return BusService.get_all_routes(db, search=search, status_filter=status)


@router.get("/{route_id}", response_model=BusRouteDetailOut)
def get_bus_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve detailed information and ordered stops for a specific bus route."""
    return BusService.get_route_by_id(db, route_id=route_id)


@router.post("", response_model=BusRouteOut, status_code=status.HTTP_201_CREATED)
def create_bus_route(
    payload: BusRouteCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_bus_admin),
):
    """Add a new bus route (Admin only)."""
    return BusService.create_route(db, data=payload)


@router.put("/{route_id}", response_model=BusRouteOut)
def update_bus_route(
    route_id: int,
    payload: BusRouteUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_bus_admin),
):
    """Update bus route details (Admin only). Preserves route ID."""
    return BusService.update_route(db, route_id=route_id, data=payload)


@router.delete("/{route_id}")
def deactivate_bus_route(
    route_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_bus_admin),
):
    """Deactivate a bus route (Admin only). Sets status to inactive."""
    route = BusService.deactivate_route(db, route_id=route_id)
    return {
        "success": True,
        "message": f"Bus Route {route.route_number} deactivated successfully.",
        "data": {
            "id": route.id,
            "route_number": route.route_number,
            "status": route.status,
        },
    }


# ----------------------------------------------------
# 2. BUS STOPS ENDPOINTS
# ----------------------------------------------------
@router.get("/{route_id}/stops", response_model=List[BusStopOut])
def get_route_stops(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all stops assigned to a specific bus route."""
    return BusService.get_stops_for_route(db, route_id=route_id)


@router.post("/{route_id}/stops", response_model=BusStopOut, status_code=status.HTTP_201_CREATED)
def create_route_stop(
    route_id: int,
    payload: BusStopCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_bus_admin),
):
    """Add a new stop to a bus route (Admin only)."""
    return BusService.create_stop(db, route_id=route_id, data=payload)


@router.put("/stops/{stop_id}", response_model=BusStopOut)
def update_bus_stop(
    stop_id: int,
    payload: BusStopUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_bus_admin),
):
    """Update stop details (Admin only)."""
    return BusService.update_stop(db, stop_id=stop_id, data=payload)


@router.delete("/stops/{stop_id}")
def delete_bus_stop(
    stop_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_bus_admin),
):
    """Deactivate or remove a bus stop (Admin only)."""
    return BusService.delete_stop(db, stop_id=stop_id)


# ----------------------------------------------------
# 3. STUDENT BUS ASSIGNMENT ENDPOINTS
# ----------------------------------------------------
@router.get("/student/{student_id}", response_model=Optional[StudentBusAssignmentOut])
def get_student_bus_assignment(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a student's active bus assignment.
    - Admin: can view any student's assignment.
    - HOD: can view students in their own department only.
    - Student: can view only their own assignment.
    - Teacher: forbidden.
    """
    user_role = current_user.role.lower()

    if user_role == "student":
        # A student can only view their own bus assignment
        my_student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not my_student or (student_id != current_user.id and student_id != my_student.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        target_student = my_student
    elif user_role == "admin":
        target_student = db.query(Student).filter(
            (Student.id == student_id) | (Student.user_id == student_id)
        ).first()
        if not target_student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )
    elif user_role == "hod":
        target_student = db.query(Student).filter(
            (Student.id == student_id) | (Student.user_id == student_id)
        ).first()
        if not target_student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )
        if target_student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
    else:
        # Teachers / other roles
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )

    assignment = BusService.get_student_bus(db, student_id=target_student.id)
    return assignment


@router.post("/student/{student_id}/assign", response_model=StudentBusAssignmentOut)
def assign_student_bus(
    student_id: int,
    payload: StudentBusAssignCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_bus_admin),
):
    """Assign or update a student's bus route and stop (Admin only)."""
    target_student = db.query(Student).filter(
        (Student.id == student_id) | (Student.user_id == student_id)
    ).first()
    if not target_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )
    return BusService.assign_student_bus(db, student_id=target_student.id, data=payload)


@router.delete("/student/{student_id}/assign")
def remove_student_bus_assignment(
    student_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_bus_admin),
):
    """Remove a student's bus assignment (Admin only)."""
    target_student = db.query(Student).filter(
        (Student.id == student_id) | (Student.user_id == student_id)
    ).first()
    if not target_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )
    return BusService.remove_student_bus(db, student_id=target_student.id)
