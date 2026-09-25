from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date as date_type

from app.database import get_db
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.subject import Subject
from app.models.faculty import Faculty
from app.models.user import User
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceOut, AttendancePercentageOut
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.geofence import verify_location_in_department
from app.utils.response import success_response

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "faculty", "student"))
):
    """
    Mark student attendance.
    Supports location-based geofence verification if coordinates are provided.
    Faculty and Admins can mark for any student.
    Students can self-mark/check-in only for themselves if within department geofence.
    """
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    # If student is checking in, verify they own the record
    if current_user.role == "student":
        if student.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only submit their own attendance"
            )

    # Determine faculty_id
    faculty_id = payload.faculty_id
    if not faculty_id:
        if current_user.role in ("faculty", "hod") and current_user.faculty_profile:
            faculty_id = current_user.faculty_profile.id
        elif subject.faculty_id:
            faculty_id = subject.faculty_id
        else:
            first_fac = db.query(Faculty).first()
            faculty_id = first_fac.id if first_fac else 1

    # Verify Geofence if coordinates are provided
    remarks = payload.remarks or ""
    if payload.latitude is not None and payload.longitude is not None:
        in_geofence, distance = verify_location_in_department(payload.latitude, payload.longitude)
        if in_geofence:
            remarks = f"Verified at campus ({distance:.1f}m). {remarks}".strip()
        else:
            remarks = f"Flagged: Outside campus boundary ({distance:.1f}m). {remarks}".strip()
            # If student self check-in from outside campus, reject
            if current_user.role == "student":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Attendance check-in rejected: Outside department radius ({distance:.1f}m from center)"
                )

    status_clean = payload.status.lower()
    if status_clean not in ("present", "absent", "late", "leave"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be one of: present, absent, late, leave"
        )

    attendance = Attendance(
        student_id=payload.student_id,
        subject_id=payload.subject_id,
        faculty_id=faculty_id,
        date=payload.date,
        status=status_clean,
        check_in_time=payload.check_in_time or datetime.utcnow(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        remarks=remarks
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    data = AttendanceOut.model_validate(attendance).model_dump()
    return success_response(data=data, message="Attendance marked successfully", status_code=status.HTTP_201_CREATED)


@router.get("")
def list_attendance(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
    date: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List attendance records with filters."""
    query = db.query(Attendance)

    if current_user.role == "student":
        # Students can only view their own attendance
        if current_user.student_profile:
            query = query.filter(Attendance.student_id == current_user.student_profile.id)
        else:
            return success_response(data=[], message="No student profile linked")
    else:
        if student_id:
            query = query.filter(Attendance.student_id == student_id)

    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
    if faculty_id:
        query = query.filter(Attendance.faculty_id == faculty_id)
    if date:
        query = query.filter(Attendance.date == date)
    if status:
        query = query.filter(Attendance.status == status.lower())

    records = query.order_by(Attendance.date.desc(), Attendance.id.desc()).offset(offset).limit(limit).all()
    data = [AttendanceOut.model_validate(r).model_dump() for r in records]
    return success_response(data=data, message="Attendance records retrieved successfully")


@router.get("/student/{student_id}")
def get_attendance_by_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all attendance records for a specific student."""
    if current_user.role == "student":
        if not current_user.student_profile or current_user.student_profile.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only access their own attendance"
            )

    records = db.query(Attendance).filter(Attendance.student_id == student_id).order_by(Attendance.date.desc()).all()
    data = [AttendanceOut.model_validate(r).model_dump() for r in records]
    return success_response(data=data, message="Student attendance retrieved successfully")


@router.get("/subject/{subject_id}")
def get_attendance_by_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "faculty"))
):
    """Faculty, HOD, and Admin: Get attendance records for a specific subject."""
    records = db.query(Attendance).filter(Attendance.subject_id == subject_id).order_by(Attendance.date.desc()).all()
    data = [AttendanceOut.model_validate(r).model_dump() for r in records]
    return success_response(data=data, message="Subject attendance retrieved successfully")


@router.get("/date/{date_str}")
def get_attendance_by_date(
    date_str: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "faculty"))
):
    """Faculty, HOD, and Admin: Get all attendance records for a specific date (YYYY-MM-DD)."""
    records = db.query(Attendance).filter(Attendance.date == date_str).all()
    data = [AttendanceOut.model_validate(r).model_dump() for r in records]
    return success_response(data=data, message=f"Attendance records for {date_str} retrieved successfully")


@router.get("/percentage/{student_id}")
def get_attendance_percentage(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate attendance percentage:
    percentage = (number of present classes / total classes) * 100
    Also returns breakdown by present, absent, late, and leave.
    """
    if current_user.role == "student":
        if not current_user.student_profile or current_user.student_profile.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only access their own attendance percentage"
            )

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    total_classes = len(records)
    present_classes = sum(1 for r in records if r.status == "present")
    late_classes = sum(1 for r in records if r.status == "late")
    absent_classes = sum(1 for r in records if r.status == "absent")
    leave_classes = sum(1 for r in records if r.status == "leave")

    # Present percentage calculation: prompt specifies (number of present classes / total classes) * 100
    percentage = round((present_classes / total_classes * 100), 2) if total_classes > 0 else 100.0

    stat = AttendancePercentageOut(
        student_id=student.id,
        student_name=student.name,
        usn=student.usn,
        total_classes=total_classes,
        present_classes=present_classes,
        absent_classes=absent_classes,
        late_classes=late_classes,
        leave_classes=leave_classes,
        percentage=percentage
    )

    return success_response(
        data=stat.model_dump(),
        message="Attendance statistics calculated successfully"
    )


@router.get("/{attendance_id}")
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single attendance record by ID."""
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    if current_user.role == "student":
        if not current_user.student_profile or record.student_id != current_user.student_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only view their own attendance record"
            )

    data = AttendanceOut.model_validate(record).model_dump()
    return success_response(data=data, message="Attendance record retrieved")


@router.put("/{attendance_id}")
def update_attendance(
    attendance_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "faculty"))
):
    """Admin, HOD, and Faculty: Update attendance status or remarks."""
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    if payload.status is not None:
        status_clean = payload.status.lower()
        if status_clean not in ("present", "absent", "late", "leave"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be one of: present, absent, late, leave"
            )
        record.status = status_clean

    if payload.remarks is not None:
        record.remarks = payload.remarks

    db.commit()
    db.refresh(record)

    data = AttendanceOut.model_validate(record).model_dump()
    return success_response(data=data, message="Attendance record updated successfully")


@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "faculty"))
):
    """Admin & HOD: Delete an attendance record."""
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    db.delete(record)
    db.commit()
    return success_response(data={"id": attendance_id}, message="Attendance record deleted successfully")
