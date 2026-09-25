from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.subject import Subject
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectOut
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.response import success_response

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Create a subject."""
    existing = db.query(Subject).filter(Subject.subject_code == payload.subject_code.upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subject with code {payload.subject_code} already exists"
        )

    subject = Subject(
        subject_code=payload.subject_code.upper(),
        subject_name=payload.subject_name,
        credits=payload.credits,
        semester=payload.semester,
        department_id=payload.department_id,
        faculty_id=payload.faculty_id
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    data = SubjectOut.model_validate(subject).model_dump()
    return success_response(data=data, message="Subject created successfully", status_code=status.HTTP_201_CREATED)


@router.get("")
def list_subjects(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    faculty_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List subjects with filters (department, semester, faculty)."""
    query = db.query(Subject)
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    if semester:
        query = query.filter(Subject.semester == semester)
    if faculty_id:
        query = query.filter(Subject.faculty_id == faculty_id)

    # If faculty, can filter easily or default
    if current_user.role == "faculty" and not faculty_id and not department_id and not semester:
        if current_user.faculty_profile:
            query = query.filter(Subject.faculty_id == current_user.faculty_profile.id)

    subjects = query.all()
    data = [SubjectOut.model_validate(s).model_dump() for s in subjects]
    return success_response(data=data, message="Subjects retrieved successfully")


@router.get("/{subject_id}")
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get subject by ID."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    data = SubjectOut.model_validate(subject).model_dump()
    return success_response(data=data, message="Subject details retrieved")


@router.put("/{subject_id}")
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Update subject details."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if payload.subject_name is not None:
        subject.subject_name = payload.subject_name
    if payload.credits is not None:
        subject.credits = payload.credits
    if payload.semester is not None:
        subject.semester = payload.semester
    if payload.department_id is not None:
        subject.department_id = payload.department_id
    if payload.faculty_id is not None:
        subject.faculty_id = payload.faculty_id

    db.commit()
    db.refresh(subject)

    data = SubjectOut.model_validate(subject).model_dump()
    return success_response(data=data, message="Subject updated successfully")


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Delete a subject."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    db.delete(subject)
    db.commit()
    return success_response(data={"id": subject_id}, message="Subject deleted successfully")
