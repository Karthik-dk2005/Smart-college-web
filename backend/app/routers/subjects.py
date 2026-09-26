from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models import Subject, Teacher, Department, User
from app.schemas import SubjectCreate, SubjectUpdate, SubjectResponse
from app.dependencies import get_current_user, require_any_role
from app.utils.response import success_response

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])


def format_subject(s: Subject) -> dict:
    return {
        "id": s.id,
        "subject_code": s.subject_code,
        "subject_name": s.subject_name,
        "department_id": s.department_id,
        "department_name": s.department.name if s.department else None,
        "semester": s.semester,
        "credits": s.credits,
        "teacher_id": s.teacher_id,
        "teacher_name": s.teacher.name if s.teacher else None,
        "status": s.status or "active",
    }


@router.get("")
def list_subjects(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all subjects, optionally filtered by department and semester."""
    query = db.query(Subject).options(
        joinedload(Subject.department),
        joinedload(Subject.teacher)
    )
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    if semester:
        query = query.filter(Subject.semester == semester)
    
    subjects = query.order_by(Subject.subject_code, Subject.subject_name).all()
    data = [format_subject(s) for s in subjects]
    return success_response(data=data, message=f"Retrieved {len(data)} subjects")


@router.get("/{subject_id}")
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single subject details."""
    s = db.query(Subject).options(
        joinedload(Subject.department),
        joinedload(Subject.teacher)
    ).filter(Subject.id == subject_id).first()

    if not s:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found."
        )
    return success_response(data=format_subject(s))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Create a new subject."""
    if payload.subject_code:
        existing = db.query(Subject).filter(Subject.subject_code == payload.subject_code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Subject with code '{payload.subject_code}' already exists."
            )

    subject = Subject(
        subject_code=payload.subject_code,
        subject_name=payload.subject_name,
        department_id=payload.department_id,
        semester=payload.semester,
        credits=payload.credits or 4,
        teacher_id=payload.teacher_id,
        status=payload.status or "active"
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    s = db.query(Subject).options(
        joinedload(Subject.department),
        joinedload(Subject.teacher)
    ).filter(Subject.id == subject.id).first()
    return success_response(data=format_subject(s), message="Subject created successfully", status_code=201)


@router.put("/{subject_id}")
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Update a subject."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found."
        )

    if payload.subject_code and payload.subject_code != subject.subject_code:
        existing = db.query(Subject).filter(
            Subject.subject_code == payload.subject_code,
            Subject.id != subject_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Another subject already has code '{payload.subject_code}'."
            )

    if payload.subject_name is not None:
        subject.subject_name = payload.subject_name
    if payload.subject_code is not None:
        subject.subject_code = payload.subject_code
    if payload.department_id is not None:
        subject.department_id = payload.department_id
    if payload.semester is not None:
        subject.semester = payload.semester
    if payload.credits is not None:
        subject.credits = payload.credits
    if payload.teacher_id is not None:
        subject.teacher_id = payload.teacher_id
    if payload.status is not None:
        subject.status = payload.status

    db.commit()
    s = db.query(Subject).options(
        joinedload(Subject.department),
        joinedload(Subject.teacher)
    ).filter(Subject.id == subject_id).first()
    return success_response(data=format_subject(s), message="Subject updated successfully")


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Delete a subject."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found."
        )
    db.delete(subject)
    db.commit()
    return success_response(data={"id": subject_id}, message=f"Subject #{subject_id} deleted successfully.")
