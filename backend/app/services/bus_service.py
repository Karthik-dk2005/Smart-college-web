from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status

from app.models.bus_route import BusRoute
from app.models.bus_stop import BusStop
from app.models.student_bus_assignment import StudentBusAssignment
from app.models.student import Student
from app.schemas.bus import (
    BusRouteCreate,
    BusRouteUpdate,
    BusStopCreate,
    BusStopUpdate,
    StudentBusAssignCreate,
)


class BusService:
    @staticmethod
    def ensure_28_routes(db: Session):
        """Ensure all 28 bus routes exist in the database."""
        for num in range(1, 29):
            route = db.query(BusRoute).filter(BusRoute.route_number == num).first()
            if not route:
                new_route = BusRoute(
                    route_number=num,
                    route_name=f"Route {num}",
                    bus_number="Not provided",
                    driver_name="Not provided",
                    driver_phone="Not provided",
                    start_point="Not provided",
                    end_point="Not provided",
                    departure_time="Not provided",
                    arrival_time="Not provided",
                    status="active",
                )
                db.add(new_route)
        db.commit()

    @staticmethod
    def get_all_routes(
        db: Session,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
    ) -> List[dict]:
        BusService.ensure_28_routes(db)
        query = db.query(BusRoute)

        if status_filter and status_filter.lower() != "all":
            query = query.filter(BusRoute.status == status_filter.lower())

        if search and search.strip():
            term = f"%{search.strip()}%"
            # Attempt to match numeric route number as well
            route_num_match = None
            if search.strip().isdigit():
                route_num_match = int(search.strip())

            conditions = [
                BusRoute.route_name.ilike(term),
                BusRoute.bus_number.ilike(term),
                BusRoute.driver_name.ilike(term),
                BusRoute.start_point.ilike(term),
                BusRoute.end_point.ilike(term),
            ]
            if route_num_match is not None:
                conditions.append(BusRoute.route_number == route_num_match)

            query = query.filter(or_(*conditions))

        routes = query.order_by(BusRoute.route_number.asc()).all()

        results = []
        for r in routes:
            stops_count = len(r.stops) if r.stops else 0
            assignments_count = len(r.assignments) if r.assignments else 0
            results.append({
                "id": r.id,
                "route_number": r.route_number,
                "route_name": r.route_name,
                "bus_number": r.bus_number or "Not provided",
                "driver_name": r.driver_name or "Not provided",
                "driver_phone": r.driver_phone or "Not provided",
                "start_point": r.start_point or "Not provided",
                "end_point": r.end_point or "Not provided",
                "departure_time": r.departure_time or "Not provided",
                "arrival_time": r.arrival_time or "Not provided",
                "status": r.status or "active",
                "stops_count": stops_count,
                "assigned_students_count": assignments_count,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            })
        return results

    @staticmethod
    def get_route_by_id(db: Session, route_id: int) -> dict:
        route = db.query(BusRoute).filter(BusRoute.id == route_id).first()
        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus route with ID {route_id} not found.",
            )

        stops = []
        if route.stops:
            for s in sorted(route.stops, key=lambda x: x.stop_order):
                stops.append({
                    "id": s.id,
                    "route_id": s.route_id,
                    "stop_order": s.stop_order,
                    "stop_name": s.stop_name,
                    "latitude": s.latitude or "Not provided",
                    "longitude": s.longitude or "Not provided",
                    "pickup_time": s.pickup_time or "Not provided",
                    "drop_time": s.drop_time or "Not provided",
                    "status": s.status or "active",
                    "created_at": s.created_at,
                    "updated_at": s.updated_at,
                })

        return {
            "id": route.id,
            "route_number": route.route_number,
            "route_name": route.route_name,
            "bus_number": route.bus_number or "Not provided",
            "driver_name": route.driver_name or "Not provided",
            "driver_phone": route.driver_phone or "Not provided",
            "start_point": route.start_point or "Not provided",
            "end_point": route.end_point or "Not provided",
            "departure_time": route.departure_time or "Not provided",
            "arrival_time": route.arrival_time or "Not provided",
            "status": route.status or "active",
            "stops_count": len(stops),
            "assigned_students_count": len(route.assignments) if route.assignments else 0,
            "stops": stops,
            "created_at": route.created_at,
            "updated_at": route.updated_at,
        }

    @staticmethod
    def create_route(db: Session, data: BusRouteCreate) -> BusRoute:
        existing = db.query(BusRoute).filter(BusRoute.route_number == data.route_number).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Bus Route {data.route_number} already exists.",
            )

        route = BusRoute(
            route_number=data.route_number,
            route_name=data.route_name or f"Route {data.route_number}",
            bus_number=data.bus_number or "Not provided",
            driver_name=data.driver_name or "Not provided",
            driver_phone=data.driver_phone or "Not provided",
            start_point=data.start_point or "Not provided",
            end_point=data.end_point or "Not provided",
            departure_time=data.departure_time or "Not provided",
            arrival_time=data.arrival_time or "Not provided",
            status=data.status or "active",
        )
        db.add(route)
        db.commit()
        db.refresh(route)
        return route

    @staticmethod
    def update_route(db: Session, route_id: int, data: BusRouteUpdate) -> BusRoute:
        route = db.query(BusRoute).filter(BusRoute.id == route_id).first()
        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus route with ID {route_id} not found.",
            )

        update_dict = data.model_dump(exclude_unset=True) if hasattr(data, "model_dump") else data.dict(exclude_unset=True)
        # Prevent accidental change of route ID
        update_dict.pop("id", None)
        update_dict.pop("route_id", None)

        for k, v in update_dict.items():
            if v is not None:
                setattr(route, k, v)

        db.commit()
        db.refresh(route)
        return route

    @staticmethod
    def deactivate_route(db: Session, route_id: int) -> BusRoute:
        route = db.query(BusRoute).filter(BusRoute.id == route_id).first()
        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus route with ID {route_id} not found.",
            )

        route.status = "inactive"
        db.commit()
        db.refresh(route)
        return route

    @staticmethod
    def get_stops_for_route(db: Session, route_id: int) -> List[BusStop]:
        route = db.query(BusRoute).filter(BusRoute.id == route_id).first()
        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus route with ID {route_id} not found.",
            )
        return db.query(BusStop).filter(BusStop.route_id == route_id).order_by(BusStop.stop_order.asc()).all()

    @staticmethod
    def create_stop(db: Session, route_id: int, data: BusStopCreate) -> BusStop:
        route = db.query(BusRoute).filter(BusRoute.id == route_id).first()
        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus route with ID {route_id} not found.",
            )

        stop = BusStop(
            route_id=route_id,
            stop_order=data.stop_order or 1,
            stop_name=data.stop_name,
            latitude=data.latitude or "Not provided",
            longitude=data.longitude or "Not provided",
            pickup_time=data.pickup_time or "Not provided",
            drop_time=data.drop_time or "Not provided",
            status=data.status or "active",
        )
        db.add(stop)
        db.commit()
        db.refresh(stop)
        return stop

    @staticmethod
    def update_stop(db: Session, stop_id: int, data: BusStopUpdate) -> BusStop:
        stop = db.query(BusStop).filter(BusStop.id == stop_id).first()
        if not stop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus stop with ID {stop_id} not found.",
            )

        update_dict = data.model_dump(exclude_unset=True) if hasattr(data, "model_dump") else data.dict(exclude_unset=True)
        update_dict.pop("id", None)
        update_dict.pop("route_id", None)

        for k, v in update_dict.items():
            if v is not None:
                setattr(stop, k, v)

        db.commit()
        db.refresh(stop)
        return stop

    @staticmethod
    def delete_stop(db: Session, stop_id: int):
        stop = db.query(BusStop).filter(BusStop.id == stop_id).first()
        if not stop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus stop with ID {stop_id} not found.",
            )
        stop.status = "inactive"
        db.commit()
        return {"success": True, "message": "Bus stop deactivated successfully."}

    @staticmethod
    def get_student_bus(db: Session, student_id: int) -> Optional[dict]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )

        assignment = (
            db.query(StudentBusAssignment)
            .filter(StudentBusAssignment.student_id == student_id)
            .first()
        )
        if not assignment:
            return None

        route = assignment.route
        stop = assignment.stop

        return {
            "id": assignment.id,
            "student_id": student.id,
            "student_name": student.name,
            "student_usn": student.student_id or student.usn,
            "student_department": student.department.name if student.department else "CSE",
            "route_id": route.id if route else assignment.route_id,
            "route_number": route.route_number if route else None,
            "route_name": route.route_name if route else "Not provided",
            "bus_number": route.bus_number if route else "Not provided",
            "driver_name": route.driver_name if route else "Not provided",
            "driver_phone": route.driver_phone if route else "Not provided",
            "stop_id": stop.id if stop else None,
            "stop_name": stop.stop_name if stop else "Not provided",
            "pickup_time": stop.pickup_time if stop else "Not provided",
            "drop_time": stop.drop_time if stop else "Not provided",
            "transport_status": assignment.transport_status or "Using Bus",
            "assigned_at": assignment.assigned_at,
            "updated_at": assignment.updated_at,
        }

    @staticmethod
    def assign_student_bus(db: Session, student_id: int, data: StudentBusAssignCreate) -> dict:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {student_id} not found.",
            )

        route = db.query(BusRoute).filter(BusRoute.id == data.route_id).first()
        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bus route with ID {data.route_id} not found.",
            )

        if data.stop_id:
            stop = db.query(BusStop).filter(BusStop.id == data.stop_id).first()
            if not stop or stop.route_id != route.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected bus stop does not belong to this route.",
                )

        assignment = (
            db.query(StudentBusAssignment)
            .filter(StudentBusAssignment.student_id == student_id)
            .first()
        )
        if assignment:
            assignment.route_id = data.route_id
            assignment.stop_id = data.stop_id
            assignment.transport_status = data.transport_status or "Using Bus"
        else:
            assignment = StudentBusAssignment(
                student_id=student_id,
                route_id=data.route_id,
                stop_id=data.stop_id,
                transport_status=data.transport_status or "Using Bus",
            )
            db.add(assignment)

        db.commit()
        db.refresh(assignment)
        return BusService.get_student_bus(db, student_id)

    @staticmethod
    def remove_student_bus(db: Session, student_id: int):
        assignment = (
            db.query(StudentBusAssignment)
            .filter(StudentBusAssignment.student_id == student_id)
            .first()
        )
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active bus assignment found for this student.",
            )
        db.delete(assignment)
        db.commit()
        return {"success": True, "message": "Student bus assignment removed successfully."}
