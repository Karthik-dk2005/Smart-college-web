from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.faculty import Faculty
from app.models.user import User
from app.schemas.faculty import FacultyCreate, FacultyUpdate, FacultyOut
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.security import get_password_hash
from app.utils.response import success_response

router = APIRouter(prefix="/api/faculty", tags=["Faculty"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_faculty(
    payload: FacultyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Create faculty member and linked user account."""
    if db.query(Faculty).filter(Faculty.employee_id == payload.employee_id.upper()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Faculty with Employee ID {payload.employee_id} already exists"
        )
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email {payload.email} already exists"
        )

    if not payload.user_id:
        user = User(
            name=payload.name,
            email=payload.email.lower(),
            password_hash=get_password_hash(payload.password or "password123"),
            role="faculty",
            phone=payload.phone,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = user.id
    else:
        user_id = payload.user_id

    faculty = Faculty(
        employee_id=payload.employee_id.upper(),
        name=payload.name,
        email=payload.email.lower(),
        phone=payload.phone,
        department_id=payload.department_id,
        user_id=user_id,
        designation=payload.designation
    )
    db.add(faculty)
    db.commit()
    db.refresh(faculty)

    data = FacultyOut.model_validate(faculty).model_dump()
    return success_response(data=data, message="Faculty member registered successfully", status_code=status.HTTP_201_CREATED)


@router.get("")
def list_faculty(
    department_id: Optional[int] = None,
    designation: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List faculty members with optional department and search filters."""
    query = db.query(Faculty)
    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    if designation:
        query = query.filter(Faculty.designation.ilike(f"%{designation}%"))
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Faculty.name.ilike(s)) |
            (Faculty.employee_id.ilike(s)) |
            (Faculty.email.ilike(s))
        )

    faculty_list = query.offset(offset).limit(limit).all()
    data = [FacultyOut.model_validate(f).model_dump() for f in faculty_list]
    return success_response(data=data, message="Faculty list retrieved successfully")


@router.get("/{faculty_id}")
def get_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get faculty details by ID."""
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty member not found")

    data = FacultyOut.model_validate(faculty).model_dump()
    return success_response(data=data, message="Faculty details retrieved")


@router.put("/{faculty_id}")
def update_faculty(
    faculty_id: int,
    payload: FacultyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin & HOD (or self for personal fields): Update faculty record."""
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty member not found")

    is_privileged = current_user.role in ("admin", "hod")
    is_self = current_user.id == faculty.user_id

    if not (is_privileged or is_self):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this faculty profile"
        )

    if payload.name is not None:
        faculty.name = payload.name
        if faculty.user:
            faculty.user.name = payload.name
    if payload.phone is not None:
        faculty.phone = payload.phone
        if faculty.user:
            faculty.user.phone = payload.phone

    if is_privileged:
        if payload.department_id is not None:
            faculty.department_id = payload.department_id
        if payload.designation is not None:
            faculty.designation = payload.designation

    db.commit()
    db.refresh(faculty)

    data = FacultyOut.model_validate(faculty).model_dump()
    return success_response(data=data, message="Faculty profile updated successfully")


@router.delete("/{faculty_id}")
def delete_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Delete faculty member."""
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty member not found")

    user_id = faculty.user_id
    db.delete(faculty)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)

    db.commit()
    return success_response(data={"id": faculty_id}, message="Faculty member deleted successfully")
