from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models import Mark, Student, Subject, User, Teacher
from app.schemas import MarkCreate, MarkUpdate, MarkOut, ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role, get_client_ip
from app.utils import log_audit

router = APIRouter(prefix="/api/marks", tags=["Internal Marks & Gradebook"])


def calculate_grade(total: float) -> str:
    """Automated grade computation."""
    if total >= 90: return "O"
    elif total >= 80: return "A+"
    elif total >= 70: return "A"
    elif total >= 60: return "B+"
    elif total >= 50: return "B"
    elif total >= 40: return "C"
    return "F"


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_mark_entry(
    req: MarkCreate,
    request: Request,
    current_user: User = Depends(require_any_role("teacher", "hod", "admin")),
    db: Session = Depends(get_db)
):
    """Create or record internal marks draft for a student."""
    total = (req.ia1_score or 0) + (req.ia2_score or 0) + (req.assignment_score or 0) + (req.test_score or 0) + (req.quiz_score or 0) + (req.semester_exam_score or 0)
    grade = calculate_grade(total)

    evaluator_id = None
    if current_user.role in ("teacher", "hod") and current_user.teacher_profile:
        evaluator_id = current_user.teacher_profile.id

    new_mark = Mark(
        student_id=req.student_id,
        subject_id=req.subject_id,
        exam_type=req.exam_type,
        ia1_score=req.ia1_score or 0,
        ia2_score=req.ia2_score or 0,
        assignment_score=req.assignment_score or 0,
        test_score=req.test_score or 0,
        quiz_score=req.quiz_score or 0,
        semester_exam_score=req.semester_exam_score or 0,
        total_score=total,
        max_total=100.0,
        grade_letter=grade,
        status="DRAFT",
        evaluated_by_id=evaluator_id
    )
    db.add(new_mark)
    db.commit()
    db.refresh(new_mark)

    log_audit(
        db=db,
        action="ENTER_MARKS",
        module="Internal Marks",
        user_id=current_user.id,
        record_id=str(new_mark.id),
        details=f"Drafted marks for student {new_mark.student_id} in subject {new_mark.subject_id} (Total: {total}, Grade: {grade})",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message="Mark entry recorded as DRAFT.", data={"id": new_mark.id, "total": total, "grade": grade})


@router.get("/my", response_model=Dict[str, Any])
def get_my_marks(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    """Retrieve personal internal marks for authenticated student."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    results = []
    for m in marks:
        results.append({
            "id": m.id,
            "subject_code": m.subject.code if m.subject else None,
            "subject_name": m.subject.name if m.subject else None,
            "ia1": m.ia1_score,
            "ia2": m.ia2_score,
            "assignment": m.assignment_score,
            "test": m.test_score,
            "quiz": m.quiz_score,
            "semester_exam": m.semester_exam_score,
            "total": m.total_score,
            "max_total": m.max_total,
            "grade": m.grade_letter,
            "status": m.status
        })

    return {"success": True, "student_usn": student.usn, "marks": results}


@router.get("/student/{student_id}", response_model=Dict[str, Any])
def get_student_marks_by_id(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get internal assessment marks for specific student (Strict FERPA scoping)."""
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="Access denied: Students can only view their own marks.")

    marks = db.query(Mark).filter(Mark.student_id == student_id).all()
    results = [
        {
            "id": m.id,
            "subject_code": m.subject.code if m.subject else None,
            "subject_name": m.subject.name if m.subject else None,
            "ia1": m.ia1_score,
            "ia2": m.ia2_score,
            "assignment": m.assignment_score,
            "total": m.total_score,
            "grade": m.grade_letter,
            "status": m.status
        }
        for m in marks
    ]
    return {"success": True, "student_id": student_id, "marks": results}


@router.put("/{id}", response_model=ApiResponse)
def update_marks(
    id: int,
    req: MarkUpdate,
    request: Request,
    current_user: User = Depends(require_any_role("teacher", "hod", "admin")),
    db: Session = Depends(get_db)
):
    """Update continuous assessment component scores."""
    mark = db.query(Mark).filter(Mark.id == id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark entry not found.")

    if mark.status == "FINALIZED" and current_user.role not in ("hod", "admin"):
        raise HTTPException(status_code=403, detail="Cannot edit finalized marks without HOD authorization.")

    if req.ia1_score is not None: mark.ia1_score = req.ia1_score
    if req.ia2_score is not None: mark.ia2_score = req.ia2_score
    if req.assignment_score is not None: mark.assignment_score = req.assignment_score
    if req.test_score is not None: mark.test_score = req.test_score
    if req.quiz_score is not None: mark.quiz_score = req.quiz_score
    if req.semester_exam_score is not None: mark.semester_exam_score = req.semester_exam_score

    mark.total_score = (mark.ia1_score or 0) + (mark.ia2_score or 0) + (mark.assignment_score or 0) + (mark.test_score or 0) + (mark.quiz_score or 0) + (mark.semester_exam_score or 0)
    mark.grade_letter = calculate_grade(mark.total_score)
    db.commit()

    log_audit(
        db=db,
        action="UPDATE_MARKS",
        module="Internal Marks",
        user_id=current_user.id,
        record_id=str(mark.id),
        details=f"Recalculated total={mark.total_score}, grade={mark.grade_letter}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message="Marks updated successfully.", data={"total": mark.total_score, "grade": mark.grade_letter})


@router.post("/{id}/finalize", response_model=ApiResponse)
def finalize_marks(
    id: int,
    request: Request,
    current_user: User = Depends(require_any_role("hod", "admin")),
    db: Session = Depends(get_db)
):
    """Lock and finalize official student internal assessment marks (HOD/Admin only)."""
    mark = db.query(Mark).filter(Mark.id == id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark entry not found.")

    mark.status = "FINALIZED"
    mark.finalized_by_id = current_user.id
    db.commit()

    log_audit(
        db=db,
        action="FINALIZE_MARKS",
        module="Internal Marks",
        user_id=current_user.id,
        record_id=str(mark.id),
        details=f"Marks locked and finalized by HOD/Admin {current_user.full_name}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message=f"Marks finalized and locked for audit. Grade: {mark.grade_letter}")
