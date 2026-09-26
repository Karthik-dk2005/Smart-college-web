from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.student_biometric import StudentBiometric
from app.models.timetable import Timetable
from app.schemas import (
    BiometricRegisterRequest,
    BiometricVerifyRequest,
    BiometricVerifyResponse,
)
from app.dependencies import get_current_user, require_any_role
from app.services.biometric_service import biometric_service
from app.services.attendance_service import attendance_service
from app.utils.response import success_response

router = APIRouter(prefix="/api/biometric", tags=["Biometric Attendance"])


@router.get("/status")
def get_biometric_hardware_status(
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/biometric/status
    Returns hardware connection status and active provider diagnostics.
    """
    status_info = biometric_service.get_scanner_status()
    return success_response(data=status_info, message="Biometric scanner status retrieved")


@router.get("/status/{student_id}")
def get_student_biometric_status(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/biometric/status/{student_id}
    Checks if student has registered biometric profile without exposing raw minutiae.
    """
    bio_rec = db.query(StudentBiometric).filter(StudentBiometric.student_id == student_id).first()
    return success_response(
        data={
            "student_id": student_id,
            "has_biometric_registered": bio_rec is not None,
            "provider": bio_rec.provider if bio_rec else None,
            "registered_at": bio_rec.registered_at.isoformat() if bio_rec else None
        },
        message="Student biometric status loaded"
    )


@router.post("/register/{student_id}")
def register_student_biometric(
    student_id: int,
    payload: Optional[BiometricRegisterRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher", "student"))
):
    """
    POST /api/biometric/register/{student_id}
    Registers student fingerprint template hash.
    Does not store raw fingerprint images.
    """
    if current_user.role.lower() == "student":
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student or student.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can register only your own biometric profile."
            )
    elif current_user.role.lower() == "hod":
        student = db.query(Student).filter(Student.id == student_id).first()
        if student and current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can register students only from your own department."
            )

    token = payload.biometric_token if payload else None
    result = biometric_service.register_student(
        student_id=student_id,
        db=db,
        biometric_token=token
    )
    return success_response(data=result, message=result["message"])


@router.post("/verify")
def verify_biometric_and_mark_attendance(
    payload: BiometricVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher", "student"))
):
    """
    POST /api/biometric/verify
    Verifies fingerprint and marks attendance for the active 30-minute interval:
    1. Resolve student by student_id or student_code / USN
    2. Verify biometric credential match
    3. Verify department, semester, section match timetable
    4. Verify campus location (geofence -> 403 'You are outside the college campus.')
    5. Prevent duplicate attendance -> 'Student already marked Present.'
    6. Mark attendance (method = 'BIOMETRIC')
    """
    # 1. Resolve student
    student = None
    if payload.student_id:
        student = db.query(Student).filter(Student.id == payload.student_id).first()
    elif payload.student_code:
        student = db.query(Student).filter(
            (Student.usn == payload.student_code) | (Student.student_id == payload.student_code)
        ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found for biometric verification."
        )

    # 2. Verify biometric credentials
    matched_student, bio_info = biometric_service.verify_student_biometric(
        student_id=student.id,
        db=db,
        biometric_data={"biometric_token": payload.biometric_token}
    )

    # 3. Mark attendance with all checks
    mark_result = attendance_service.verify_and_mark_attendance(
        db=db,
        timetable_id=payload.timetable_id,
        student_id=matched_student.id,
        method="BIOMETRIC",
        current_user=current_user,
        latitude=payload.latitude,
        longitude=payload.longitude,
        duration_number=payload.duration_number,
        interval_id=payload.interval_id,
        bypass_location=bool(payload.bypass_location)
    )

    mark_result["biometric_provider"] = bio_info.get("provider")
    mark_result["is_mock"] = bio_info.get("is_mock", False)
    return success_response(data=mark_result, message="✓ Fingerprint verified & attendance marked.")
