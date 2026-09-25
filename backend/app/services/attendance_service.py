from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import datetime
from typing import Dict, Any, Optional

from app.models import Session as SessionModel, Attendance, Student, Subject
from app.config import settings
from app.utils import haversine_distance, generate_verification_hash, generate_session_id, log_audit


class AttendanceService:
    @staticmethod
    def verify_location_and_mark(
        db: Session,
        session_id: int,
        student_id: int,
        latitude: float,
        longitude: float,
        device_verified: bool = True,
        client_timestamp: Optional[str] = None,
        ip_address: str = "127.0.0.1"
    ) -> Dict[str, Any]:
        """
        Validate live coordinates against configured institution geofence,
        ensure session is open, avoid duplicates, and save official record.
        """
        # 1. Check Session validity
        session_rec = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session_rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attendance session with ID {session_id} not found."
            )
        if session_rec.status == "COMPLETED" or session_rec.status == "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Attendance session is {session_rec.status.lower()}. Marking is closed."
            )

        # 2. Check Student validity
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student ID {student_id} not found."
            )

        # 3. Check for Duplicate Attendance
        existing = db.query(Attendance).filter(
            Attendance.session_id == session_id,
            Attendance.student_id == student_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Attendance already marked for this session."
            )

        # 4. Authoritative Haversine Distance Calculation
        distance_meters = haversine_distance(
            latitude,
            longitude,
            settings.COLLEGE_LAT,
            settings.COLLEGE_LON
        )

        # 5. Geofence Radius Validation
        is_inside = distance_meters <= settings.ATTENDANCE_RADIUS_METERS
        if not is_inside:
            return {
                "success": False,
                "message": "You are outside the college attendance area",
                "distance_meters": distance_meters,
                "allowed_radius": settings.ATTENDANCE_RADIUS_METERS
            }

        # 6. Verification Hash
        now_iso = datetime.datetime.utcnow().isoformat()
        ver_hash = generate_verification_hash(student_id, latitude, longitude, now_iso)

        # 7. Record Attendance
        new_attendance = Attendance(
            session_id=session_id,
            student_id=student_id,
            status="PRESENT",
            latitude=latitude,
            longitude=longitude,
            distance_meters=distance_meters,
            device_verified=device_verified,
            verification_hash=ver_hash,
            verification_method="LIVE_GPS_GEOFENCE_VERIFIED",
            check_in_time=datetime.datetime.utcnow()
        )
        db.add(new_attendance)
        db.commit()
        db.refresh(new_attendance)

        # Log audit
        log_audit(
            db=db,
            action="MARK_ATTENDANCE_GEOFENCE",
            module="Attendance",
            user_id=student.user_id,
            record_id=str(new_attendance.id),
            details=f"Student {student.usn} checked in ({distance_meters}m from campus center)",
            ip_address=ip_address
        )

        return {
            "success": True,
            "message": "Attendance marked successfully",
            "distance_meters": distance_meters,
            "record": {
                "id": new_attendance.id,
                "session_id": session_id,
                "student_id": student_id,
                "status": "PRESENT",
                "verification_hash": ver_hash,
                "check_in_time": new_attendance.check_in_time.isoformat()
            }
        }

    @staticmethod
    def get_student_report(db: Session, student_id: int) -> Dict[str, Any]:
        """Generate cumulative attendance statistics for an individual student."""
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
        total_classes = len(records)
        attended_classes = len([r for r in records if r.status in ("PRESENT", "LATE")])
        absent_classes = total_classes - attended_classes
        pct = round((attended_classes / total_classes * 100), 1) if total_classes > 0 else 0.0

        serialized_records = [
            {
                "id": r.id,
                "session_id": r.session_id,
                "student_id": r.student_id,
                "status": r.status,
                "distance_meters": r.distance_meters,
                "verification_method": r.verification_method,
                "check_in_time": r.check_in_time.isoformat() if r.check_in_time else None
            }
            for r in records
        ]

        return {
            "student_id": student_id,
            "student_name": student.user.full_name if student.user else None,
            "usn": student.usn,
            "total_classes": total_classes,
            "attended_classes": attended_classes,
            "absent_classes": absent_classes,
            "attendance_percentage": pct,
            "records": serialized_records
        }

    get_student_attendance_summary = get_student_report

    @staticmethod
    def get_subject_report(db: Session, subject_id: int) -> Dict[str, Any]:
        """Generate attendance metrics for all sessions of a specific subject."""
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        sessions = db.query(SessionModel).filter(SessionModel.subject_id == subject_id).all()
        session_ids = [s.id for s in sessions]
        records = db.query(Attendance).filter(Attendance.session_id.in_(session_ids)).all() if session_ids else []

        total_records = len(records)
        attended = len([r for r in records if r.status in ("PRESENT", "LATE")])
        absent = total_records - attended
        pct = round((attended / total_records * 100), 1) if total_records > 0 else 0.0

        return {
            "subject_id": subject_id,
            "subject_code": subject.code,
            "subject_name": subject.name,
            "total_sessions": len(sessions),
            "total_classes": total_records,
            "attended_classes": attended,
            "absent_classes": absent,
            "attendance_percentage": pct
        }

    @staticmethod
    def get_semester_report(db: Session, semester: int) -> Dict[str, Any]:
        """Aggregate semester-wide cohort attendance metrics."""
        students = db.query(Student).filter(Student.semester == semester).all()
        student_ids = [s.id for s in students]
        records = db.query(Attendance).filter(Attendance.student_id.in_(student_ids)).all() if student_ids else []

        total = len(records)
        attended = len([r for r in records if r.status in ("PRESENT", "LATE")])
        absent = total - attended
        pct = round((attended / total * 100), 1) if total > 0 else 0.0

        return {
            "semester": semester,
            "total_enrolled_students": len(students),
            "total_classes": total,
            "attended_classes": attended,
            "absent_classes": absent,
            "attendance_percentage": pct
        }
