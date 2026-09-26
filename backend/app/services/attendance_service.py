import datetime
from typing import Dict, Any, Optional, Tuple, List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.student import Student
from app.models.teacher import Teacher
from app.models.timetable import Timetable
from app.models.attendance_session import AttendanceSession
from app.models.attendance_interval import AttendanceInterval
from app.models.student_attendance import StudentAttendance
from app.models.attendance import Attendance
from app.models.user import User
from app.services.geofence_service import geofence_service


class AttendanceService:
    @staticmethod
    def get_or_create_session(
        slot: Timetable,
        session_date: str,
        db: Session
    ) -> AttendanceSession:
        """Finds or initializes AttendanceSession and 30-minute intervals."""
        att_session = db.query(AttendanceSession).filter(
            AttendanceSession.timetable_id == slot.id,
            AttendanceSession.date == session_date
        ).first()

        if not att_session:
            att_session = AttendanceSession(
                timetable_id=slot.id,
                date=session_date,
                start_time=slot.start_time,
                end_time=slot.end_time,
                created_at=datetime.datetime.utcnow()
            )
            db.add(att_session)
            db.commit()
            db.refresh(att_session)

            # Generate 30-minute intervals
            from app.routers.attendance import split_into_30min_intervals
            intervals_data = split_into_30min_intervals(slot.start_time, slot.end_time)
            for idata in intervals_data:
                interval = AttendanceInterval(
                    attendance_session_id=att_session.id,
                    duration_number=idata["duration_number"],
                    start_time=idata["start_time"],
                    end_time=idata["end_time"],
                    duration_minutes=idata["duration_minutes"]
                )
                db.add(interval)
            db.commit()
            db.refresh(att_session)

        return att_session

    @classmethod
    def verify_and_mark_attendance(
        cls,
        db: Session,
        timetable_id: int,
        student_id: int,
        method: str,  # 'FACE', 'BIOMETRIC', 'MANUAL'
        current_user: User,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        duration_number: Optional[int] = None,
        interval_id: Optional[int] = None,
        session_date: Optional[str] = None,
        bypass_location: bool = False
    ) -> Dict[str, Any]:
        """
        Executes the authoritative 12-step verification and marks attendance:
        1. Authenticate user & role
        2. Validate timetable session
        3. Validate teacher authorization (if teacher)
        4. Validate student existence
        5. Verify department match
        6. Verify semester match
        7. Verify section match
        8. Resolve active 30-minute interval
        9. Verify campus location (geofence) -> 403 'You are outside the college campus.'
        10. Duplicate prevention -> 'Student already marked Present.'
        11. Record StudentAttendance with method ('FACE', 'BIOMETRIC', 'MANUAL')
        12. Return structured success payload
        """
        method_clean = (method or "MANUAL").strip().upper()
        if method_clean not in ("FACE", "BIOMETRIC", "MANUAL"):
            method_clean = "MANUAL"

        # 1. Fetch Timetable slot
        slot = db.query(Timetable).options(
            joinedload(Timetable.subject),
            joinedload(Timetable.teacher),
            joinedload(Timetable.room),
            joinedload(Timetable.department),
        ).filter(Timetable.id == timetable_id).first()

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Timetable session #{timetable_id} not found."
            )

        # 2. Teacher authorization: only assigned teacher can take attendance for class
        user_role = current_user.role.lower()
        if user_role == "teacher":
            user_teacher_id = current_user.teacher_id
            if not user_teacher_id:
                t_match = db.query(Teacher).filter(
                    (Teacher.email == current_user.email) | (Teacher.name == current_user.name)
                ).first()
                user_teacher_id = t_match.id if t_match else None

            if user_teacher_id != slot.teacher_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to mark attendance for this timetable session."
                )

        # 3. Student existence
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student #{student_id} not found."
            )

        # 4. Department match check
        if slot.department_id and student.department_id != slot.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Student does not belong to department #{slot.department_id}."
            )

        # 5. Semester match check
        if student.semester != slot.semester:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Student is in semester {student.semester}, but class is semester {slot.semester}."
            )

        # 6. Section match check
        if student.section.upper() != slot.section.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Student is in section {student.section}, but class is section {slot.section}."
            )

        # 7. Campus Location Geofence Check
        if not bypass_location:
            geofence_service.verify_location(latitude, longitude, required=True)

        # 8. Date and 30-minute interval resolution
        target_date = session_date or datetime.datetime.now().strftime("%Y-%m-%d")
        att_session = cls.get_or_create_session(slot, target_date, db)

        # Resolve target interval
        target_interval = None
        if interval_id:
            target_interval = db.query(AttendanceInterval).filter(
                AttendanceInterval.id == interval_id,
                AttendanceInterval.attendance_session_id == att_session.id
            ).first()
        elif duration_number:
            target_interval = db.query(AttendanceInterval).filter(
                AttendanceInterval.duration_number == duration_number,
                AttendanceInterval.attendance_session_id == att_session.id
            ).first()
        else:
            # Pick active interval or first interval
            intervals = att_session.intervals
            if intervals:
                target_interval = intervals[0]

        if not target_interval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active 30-minute attendance interval not found for this session."
            )

        # 9. Duplicate Prevention
        existing = db.query(StudentAttendance).filter(
            StudentAttendance.attendance_interval_id == target_interval.id,
            StudentAttendance.student_id == student.id
        ).first()

        if existing and existing.status == "Present":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Student already marked Present."
            )

        # 10. Record Attendance
        now_time = datetime.datetime.utcnow()
        if existing:
            existing.status = "Present"
            existing.attendance_method = method_clean
            existing.marked_at = now_time
            record = existing
        else:
            record = StudentAttendance(
                attendance_session_id=att_session.id,
                attendance_interval_id=target_interval.id,
                student_id=student.id,
                status="Present",
                attendance_method=method_clean,
                marked_at=now_time
            )
            db.add(record)

        # Also update / create legacy Attendance record for overall session
        legacy_rec = db.query(Attendance).filter(
            Attendance.timetable_id == slot.id,
            Attendance.student_id == student.id,
            Attendance.date == target_date
        ).first()

        if legacy_rec:
            legacy_rec.status = "Present"
            legacy_rec.attendance_method = method_clean
            legacy_rec.marked_at = now_time
        else:
            new_leg = Attendance(
                student_id=student.id,
                timetable_id=slot.id,
                teacher_id=slot.teacher_id,
                subject_id=slot.subject_id,
                date=target_date,
                start_time=slot.start_time,
                end_time=slot.end_time,
                status="Present",
                attendance_method=method_clean,
                marked_at=now_time
            )
            db.add(new_leg)

        db.commit()

        time_display = now_time.strftime("%H:%M")

        return {
            "success": True,
            "message": "✓ Attendance marked successfully.",
            "student_id": student.id,
            "student_code": student.usn or student.student_id or f"STU{student.id:03d}",
            "student_name": student.name,
            "subject": slot.subject.subject_name if slot.subject else "Subject",
            "timetable_id": slot.id,
            "session_id": att_session.id,
            "duration_number": target_interval.duration_number,
            "duration_time": f"{target_interval.start_time}–{target_interval.end_time}",
            "status": "Present",
            "attendance_method": method_clean,
            "time": time_display,
            "marked_at": now_time.isoformat()
        }


attendance_service = AttendanceService()
