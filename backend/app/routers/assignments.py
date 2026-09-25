from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import datetime

from app.database import get_db
from app.models import Assignment, AssignmentSubmission, Subject, Teacher, Student, User
from app.schemas import AssignmentCreate, AssignmentUpdate, AssignmentSubmitRequest, ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role, get_client_ip
from app.utils import log_audit

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])


@router.get("", response_model=Dict[str, Any])
def list_assignments(
    subject_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List assignments."""
    query = db.query(Assignment)
    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)
    assignments = query.order_by(Assignment.created_at.desc()).all()

    results = []
    for a in assignments:
        results.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "subject_code": a.subject.code if a.subject else None,
            "subject_name": a.subject.name if a.subject else None,
            "teacher_name": a.teacher.user.full_name if a.teacher and a.teacher.user else None,
            "deadline": a.deadline,
            "max_marks": a.max_marks,
            "attachment_url": a.attachment_url,
            "total_submissions": len(a.submissions)
        })

    return {"success": True, "count": len(results), "assignments": results}


@router.get("/{id}", response_model=Dict[str, Any])
def get_assignment(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve assignment details and submissions."""
    a = db.query(Assignment).filter(Assignment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    submissions = []
    if current_user.role in ("teacher", "hod", "admin"):
        for sub in a.submissions:
            submissions.append({
                "submission_id": sub.id,
                "student_id": sub.student_id,
                "student_name": sub.student.user.full_name if sub.student and sub.student.user else None,
                "usn": sub.student.usn if sub.student else None,
                "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                "file_url": sub.file_url,
                "score": sub.score,
                "status": sub.status
            })
    elif current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            my_sub = [s for s in a.submissions if s.student_id == student.id]
            for sub in my_sub:
                submissions.append({
                    "submission_id": sub.id,
                    "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                    "file_url": sub.file_url,
                    "score": sub.score,
                    "feedback": sub.feedback,
                    "status": sub.status
                })

    return {
        "success": True,
        "assignment": {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "subject_code": a.subject.code if a.subject else None,
            "subject_name": a.subject.name if a.subject else None,
            "teacher_name": a.teacher.user.full_name if a.teacher and a.teacher.user else None,
            "deadline": a.deadline,
            "max_marks": a.max_marks,
            "attachment_url": a.attachment_url,
            "submissions": submissions
        }
    }


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    req: AssignmentCreate,
    request: Request,
    current_user: User = Depends(require_any_role("teacher", "hod", "admin")),
    db: Session = Depends(get_db)
):
    """Publish a new assignment for a course cohort."""
    teacher_id = None
    if current_user.role in ("teacher", "hod") and current_user.teacher_profile:
        teacher_id = current_user.teacher_profile.id
    else:
        subject = db.query(Subject).filter(Subject.id == req.subject_id).first()
        teacher_id = subject.teacher_id if subject else 1

    new_asg = Assignment(
        title=req.title,
        description=req.description,
        subject_id=req.subject_id,
        teacher_id=teacher_id,
        deadline=req.deadline,
        max_marks=req.max_marks,
        attachment_url=req.attachment_url
    )
    db.add(new_asg)
    db.commit()
    db.refresh(new_asg)

    log_audit(
        db=db,
        action="CREATE_ASSIGNMENT",
        module="Assignments",
        user_id=current_user.id,
        record_id=str(new_asg.id),
        details=f"Created assignment '{new_asg.title}' due on {new_asg.deadline}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message="Assignment created successfully.", data={"id": new_asg.id})


@router.put("/{id}", response_model=ApiResponse)
def update_assignment(
    id: int,
    req: AssignmentUpdate,
    request: Request,
    current_user: User = Depends(require_any_role("teacher", "hod", "admin")),
    db: Session = Depends(get_db)
):
    """Update assignment details or deadline."""
    asg = db.query(Assignment).filter(Assignment.id == id).first()
    if not asg:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    if req.title: asg.title = req.title
    if req.description: asg.description = req.description
    if req.deadline: asg.deadline = req.deadline
    if req.max_marks is not None: asg.max_marks = req.max_marks
    if req.attachment_url: asg.attachment_url = req.attachment_url

    db.commit()
    return ApiResponse(success=True, message="Assignment updated successfully.")


@router.delete("/{id}", response_model=ApiResponse)
def delete_assignment(
    id: int,
    request: Request,
    current_user: User = Depends(require_any_role("teacher", "hod", "admin")),
    db: Session = Depends(get_db)
):
    """Delete an assignment."""
    asg = db.query(Assignment).filter(Assignment.id == id).first()
    if not asg:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    title = asg.title
    db.delete(asg)
    db.commit()

    log_audit(
        db=db,
        action="DELETE_ASSIGNMENT",
        module="Assignments",
        user_id=current_user.id,
        record_id=str(id),
        details=f"Deleted assignment '{title}'",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message=f"Assignment '{title}' deleted.")


@router.post("/{id}/submit", response_model=ApiResponse)
def submit_assignment(
    id: int,
    req: AssignmentSubmitRequest,
    request: Request,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    """Student submission of assignment solution or file link."""
    asg = db.query(Assignment).filter(Assignment.id == id).first()
    if not asg:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    # Check if existing submission
    existing = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == id,
        AssignmentSubmission.student_id == student.id
    ).first()

    now = datetime.datetime.utcnow()
    if existing:
        existing.submission_text = req.submission_text
        existing.file_url = req.file_url
        existing.submitted_at = now
        existing.status = "SUBMITTED"
    else:
        new_sub = AssignmentSubmission(
            assignment_id=id,
            student_id=student.id,
            submission_text=req.submission_text,
            file_url=req.file_url,
            submitted_at=now,
            status="SUBMITTED"
        )
        db.add(new_sub)

    db.commit()

    log_audit(
        db=db,
        action="SUBMIT_ASSIGNMENT",
        module="Assignments",
        user_id=current_user.id,
        record_id=str(id),
        details=f"Student {student.usn} submitted assignment '{asg.title}'",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message=f"Assignment '{asg.title}' submitted successfully.")
