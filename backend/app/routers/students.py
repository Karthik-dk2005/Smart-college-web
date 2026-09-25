from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.security import get_password_hash
from app.utils.response import success_response

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Create a student and linked user login."""
    # Check USN or email duplication
    if db.query(Student).filter(Student.usn == payload.usn.upper()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with USN {payload.usn} already exists"
        )
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email {payload.email} already exists"
        )

    # Create associated User record if user_id not provided
    if not payload.user_id:
        user = User(
            name=payload.name,
            email=payload.email.lower(),
            password_hash=get_password_hash(payload.password or "password123"),
            role="student",
            phone=payload.phone,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = user.id
    else:
        user_id = payload.user_id

    student = Student(
        usn=payload.usn.upper(),
        name=payload.name,
        email=payload.email.lower(),
        phone=payload.phone,
        semester=payload.semester,
        section=payload.section.upper(),
        department_id=payload.department_id,
        user_id=user_id
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    data = StudentOut.model_validate(student).model_dump()
    return success_response(data=data, message="Student registered successfully", status_code=status.HTTP_201_CREATED)


@router.get("")
def list_students(
    semester: Optional[int] = None,
    section: Optional[str] = None,
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "faculty"))
):
    """Admin, HOD, and Faculty: List students with filters."""
    query = db.query(Student)
    if semester:
        query = query.filter(Student.semester == semester)
    if section:
        query = query.filter(Student.section == section.upper())
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_filter)) |
            (Student.usn.ilike(search_filter)) |
            (Student.email.ilike(search_filter))
        )

    students = query.offset(offset).limit(limit).all()
    data = [StudentOut.model_validate(s).model_dump() for s in students]
    return success_response(data=data, message="Students retrieved successfully")


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get student profile by ID."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    # If student role, can only view own record
    if current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students may only access their own profile"
        )

    data = StudentOut.model_validate(student).model_dump()
    return success_response(data=data, message="Student details retrieved")


@router.put("/{student_id}")
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Update student profile."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if payload.name is not None:
        student.name = payload.name
        if student.user:
            student.user.name = payload.name
    if payload.phone is not None:
        student.phone = payload.phone
        if student.user:
            student.user.phone = payload.phone
    if payload.semester is not None:
        student.semester = payload.semester
    if payload.section is not None:
        student.section = payload.section.upper()
    if payload.department_id is not None:
        student.department_id = payload.department_id

    db.commit()
    db.refresh(student)

    data = StudentOut.model_validate(student).model_dump()
    return success_response(data=data, message="Student profile updated successfully")


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Delete a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    user_id = student.user_id
    db.delete(student)
    # Also delete associated user if created for this student
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)

    db.commit()
    return success_response(data={"id": student_id}, message="Student record deleted successfully")
