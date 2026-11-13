from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel, EmailStr, Field

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.faculty import Faculty
from app.dependencies import require_admin
from app.utils.security import get_password_hash

router = APIRouter(prefix="/api/admin", tags=["Admin Approval & Account Management"])


class CreateAdminRequest(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class ResetPasswordAdminRequest(BaseModel):
    new_password: str = Field(..., min_length=6)


@router.get("/registration-requests")
def get_registration_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    role_filter: Optional[str] = Query(None, alias="role"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    Retrieve user registration requests with optional filters for status, role, and search query.
    Admin can review Pending, Approved, or Rejected requests across HOD, Teacher, and Student roles.
    """
    query = db.query(User)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(func.lower(User.account_status) == status_filter.lower())
    else:
        # Default view: prioritize pending requests if no filter specified
        pass

    if role_filter and role_filter.lower() != "all":
        query = query.filter(func.lower(User.role) == role_filter.lower())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(User.full_name).like(term),
                func.lower(User.username).like(term),
                func.lower(User.email).like(term),
                func.lower(User.usn_or_employee_id).like(term)
            )
        )

    users = query.order_by(
        # Order pending first, then newest
        (User.account_status == "Pending").desc(),
        User.created_at.desc()
    ).all()

    requests_data = []
    for u in users:
        dept_name = u.department.name if u.department else "Computer Science and Engineering"
        requests_data.append({
            "id": u.id,
            "user_id": u.id,
            "full_name": u.full_name or u.name,
            "name": u.full_name or u.name,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "usn_or_employee_id": u.usn_or_employee_id,
            "department": dept_name,
            "department_id": u.department_id,
            "designation": u.designation,
            "account_status": u.account_status,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })

    pending_count = db.query(User).filter(User.account_status == "Pending").count()
    approved_count = db.query(User).filter(User.account_status == "Approved").count()
    rejected_count = db.query(User).filter(User.account_status == "Rejected").count()

    return {
        "success": True,
        "total": len(requests_data),
        "pending_count": pending_count,
        "approved_count": approved_count,
        "rejected_count": rejected_count,
        "requests": requests_data
    }


@router.put("/approve-registration/{user_id}")
def approve_registration(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Admin approves a registration request for HOD, Teacher, or Student."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.account_status = "Approved"
    user.is_active = True

    # If student, sync Student table status
    if user.role.lower() == "student":
        student = db.query(Student).filter(
            or_(
                Student.user_id == user.id,
                Student.usn == user.usn_or_employee_id
            )
        ).first()
        if student:
            student.registration_status = "Registered"
            student.email_verification_status = "Verified"

    db.commit()

    return {
        "success": True,
        "message": f"Registration request for {user.full_name or user.username} ({user.role}) has been approved.",
        "user_id": user.id,
        "account_status": "Approved"
    }


@router.put("/reject-registration/{user_id}")
def reject_registration(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Admin rejects a registration request for HOD, Teacher, or Student."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.account_status = "Rejected"
    user.is_active = False

    if user.role.lower() == "student":
        student = db.query(Student).filter(
            or_(
                Student.user_id == user.id,
                Student.usn == user.usn_or_employee_id
            )
        ).first()
        if student:
            student.registration_status = "Rejected"

    db.commit()

    return {
        "success": True,
        "message": f"Registration request for {user.full_name or user.username} has been rejected.",
        "user_id": user.id,
        "account_status": "Rejected"
    }


@router.post("/create-admin", status_code=status.HTTP_201_CREATED)
def create_admin_account(
    payload: CreateAdminRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    Super Admin only: Create and authorize another Admin account.
    Public Admin self-registration is strictly blocked.
    """
    clean_username = payload.username.strip().lower()
    clean_email = payload.email.strip().lower()

    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Password and Confirm Password do not match.")

    if db.query(User).filter(User.username == clean_username).first():
        raise HTTPException(status_code=409, detail="An account with this username already exists.")

    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(status_code=409, detail="An account with this email address already exists.")

    new_admin = User(
        full_name=payload.name.strip(),
        username=clean_username,
        email=clean_email,
        password_hash=get_password_hash(payload.password),
        role="admin",
        account_status="Approved",
        is_active=True
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {
        "success": True,
        "message": f"Admin account '{new_admin.username}' created successfully.",
        "admin_id": new_admin.id
    }


@router.put("/toggle-user-status/{user_id}")
def toggle_user_active_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Admin activates or deactivates any user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own Admin account.")

    user.is_active = not user.is_active
    db.commit()

    return {
        "success": True,
        "message": f"Account status for {user.username} changed to {'Active' if user.is_active else 'Deactivated'}.",
        "is_active": user.is_active
    }


@router.post("/reset-password/{user_id}")
def reset_user_password(
    user_id: int,
    payload: ResetPasswordAdminRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Admin resets password for any user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = get_password_hash(payload.new_password)

    # Sync student password_hash if student
    if user.role.lower() == "student":
        student = db.query(Student).filter(
            or_(
                Student.user_id == user.id,
                Student.usn == user.usn_or_employee_id
            )
        ).first()
        if student:
            student.password_hash = user.password_hash

    db.commit()

    return {
        "success": True,
        "message": f"Password for {user.full_name or user.username} has been securely reset."
    }
