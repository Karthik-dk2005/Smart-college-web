from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.student_face import StudentFace
from app.models.timetable import Timetable
from app.schemas import (
    FaceRegisterRequest,
    FaceVerifyRequest,
    FaceVerifyResponse,
)
from app.dependencies import get_current_user, require_any_role
from app.services.face_service import face_service
from app.services.attendance_service import attendance_service
from app.utils.response import success_response

router = APIRouter(prefix="/api/face", tags=["Face Recognition"])


@router.post("/register/{student_id}")
def register_student_face(
    student_id: int,
    payload: FaceRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher", "student"))
):
    """
    POST /api/face/register/{student_id}
    Registers facial embedding representation for a student.
    Does not expose raw embeddings.
    """
    # Permission checks: Student can only register themselves
    if current_user.role.lower() == "student":
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student or student.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can register only your own face profile."
            )
    elif current_user.role.lower() == "hod":
        student = db.query(Student).filter(Student.id == student_id).first()
        if student and current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can register students only from your own department."
            )

    result = face_service.register_student_face(
        student_id=student_id,
        image_data=payload.image,
        db=db
    )
    return success_response(data=result, message=result["message"])


@router.get("/status/{student_id}")
def get_face_registration_status(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/face/status/{student_id}
    Checks if a student has an active registered face profile (no embeddings exposed).
    """
    face_rec = db.query(StudentFace).filter(StudentFace.student_id == student_id).first()
    return success_response(
        data={
            "student_id": student_id,
            "has_face_registered": face_rec is not None,
            "quality_score": face_rec.quality_score if face_rec else None,
            "registered_at": face_rec.created_at.isoformat() if face_rec else None
        },
        message="Face registration status loaded"
    )


@router.post("/verify")
def verify_face_and_mark_attendance(
    payload: FaceVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher", "student"))
):
    """
    POST /api/face/verify
    End-to-end Face Verification & Attendance marking:
    1. Receive face image
    2. Detect face & check liveness (if fails -> 'Please look at the camera and try again.')
    3. Generate face representation
    4. Fetch eligible students for the timetable class
    5. Compare against registered students & return matching student (if fails -> 'Face not recognized.')
    6. Verify department
    7. Verify semester
    8. Verify section
    9. Verify active timetable session
    10. Verify campus location (geofence -> 403 'You are outside the college campus.')
    11. Prevent duplicate attendance -> 'Student already marked Present.'
    12. Mark attendance (method = 'FACE')
    """
    # 1. Fetch timetable session
    slot = db.query(Timetable).filter(Timetable.id == payload.timetable_id).first()
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timetable session #{payload.timetable_id} not found."
        )

    # 2. Candidate students matching department, semester, and section
    query = db.query(Student).filter(
        Student.semester == slot.semester,
        Student.section == slot.section,
        Student.status == "active"
    )
    if slot.department_id:
        query = query.filter(Student.department_id == slot.department_id)
    candidates = query.all()

    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No eligible students found in this class section."
        )

    # 3. Match face against candidates
    matched_student, similarity = face_service.match_face_in_class(
        image_data=payload.image,
        candidate_students=candidates,
        db=db
    )

    # 4. Mark attendance with all verifications (department, sem, section, geofence, duplicate)
    mark_result = attendance_service.verify_and_mark_attendance(
        db=db,
        timetable_id=slot.id,
        student_id=matched_student.id,
        method="FACE",
        current_user=current_user,
        latitude=payload.latitude,
        longitude=payload.longitude,
        duration_number=payload.duration_number,
        interval_id=payload.interval_id,
        bypass_location=bool(payload.bypass_location)
    )

    mark_result["similarity_score"] = round(similarity, 3)
    return success_response(data=mark_result, message="✓ Student recognized & marked Present.")
