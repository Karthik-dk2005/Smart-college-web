from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models import Exam, Subject, Room, User
from app.schemas import ExamCreate, ExamUpdate, ExamOut, ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role, get_client_ip
from app.utils import log_audit

router = APIRouter(prefix="/api/exams", tags=["Examinations"])


@router.get("", response_model=Dict[str, Any])
def list_exams(
    semester: Optional[int] = None,
    exam_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List scheduled examinations."""
    query = db.query(Exam)
    if semester:
        query = query.filter(Exam.semester == semester)
    if exam_type:
        query = query.filter(Exam.exam_type == exam_type)
    exams = query.order_by(Exam.date).all()

    results = []
    for e in exams:
        results.append({
            "id": e.id,
            "title": e.exam_title,
            "type": e.exam_type,
            "subject_code": e.subject.code if e.subject else None,
            "subject_name": e.subject.name if e.subject else None,
            "semester": e.semester,
            "date": e.date,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "room": e.room.room_number if e.room else None,
            "max_marks": e.max_marks,
            "instructions": e.instructions
        })
    return {"success": True, "count": len(results), "exams": results}


@router.get("/{id}", response_model=Dict[str, Any])
def get_exam(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve single exam details."""
    e = db.query(Exam).filter(Exam.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Exam not found.")

    return {
        "success": True,
        "exam": {
            "id": e.id,
            "title": e.exam_title,
            "type": e.exam_type,
            "subject_code": e.subject.code if e.subject else None,
            "subject_name": e.subject.name if e.subject else None,
            "semester": e.semester,
            "date": e.date,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "room": e.room.room_number if e.room else None,
            "max_marks": e.max_marks,
            "instructions": e.instructions
        }
    }


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    req: ExamCreate,
    request: Request,
    current_user: User = Depends(require_any_role("hod", "admin")),
    db: Session = Depends(get_db)
):
    """Schedule a new internal or semester examination (HOD/Admin only)."""
    new_exam = Exam(
        exam_title=req.exam_title,
        exam_type=req.exam_type,
        subject_id=req.subject_id,
        semester=req.semester,
        date=req.date,
        start_time=req.start_time,
        end_time=req.end_time,
        room_id=req.room_id,
        max_marks=req.max_marks,
        instructions=req.instructions
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    log_audit(
        db=db,
        action="SCHEDULE_EXAM",
        module="Examinations",
        user_id=current_user.id,
        record_id=str(new_exam.id),
        details=f"Scheduled {new_exam.exam_type}: {new_exam.exam_title} on {new_exam.date}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message="Exam scheduled successfully.", data={"id": new_exam.id})


@router.put("/{id}", response_model=ApiResponse)
def update_exam(
    id: int,
    req: ExamUpdate,
    request: Request,
    current_user: User = Depends(require_any_role("hod", "admin")),
    db: Session = Depends(get_db)
):
    """Modify exam schedule or assigned room."""
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    if req.exam_title: exam.exam_title = req.exam_title
    if req.exam_type: exam.exam_type = req.exam_type
    if req.date: exam.date = req.date
    if req.start_time: exam.start_time = req.start_time
    if req.end_time: exam.end_time = req.end_time
    if req.room_id is not None: exam.room_id = req.room_id
    if req.max_marks is not None: exam.max_marks = req.max_marks
    if req.instructions: exam.instructions = req.instructions

    db.commit()

    log_audit(
        db=db,
        action="UPDATE_EXAM",
        module="Examinations",
        user_id=current_user.id,
        record_id=str(exam.id),
        details=f"Updated schedule for exam {exam.exam_title}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message="Exam updated successfully.")


@router.delete("/{id}", response_model=ApiResponse)
def delete_exam(
    id: int,
    request: Request,
    current_user: User = Depends(require_any_role("hod", "admin")),
    db: Session = Depends(get_db)
):
    """Delete scheduled exam."""
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    title = exam.exam_title
    db.delete(exam)
    db.commit()

    log_audit(
        db=db,
        action="DELETE_EXAM",
        module="Examinations",
        user_id=current_user.id,
        record_id=str(id),
        details=f"Deleted exam {title}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message=f"Exam {title} deleted successfully.")
