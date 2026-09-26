from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.department import Department
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.utils.response import success_response, error_response
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user and link default student or faculty profile."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists"
        )

    role_clean = payload.role.lower()
    if role_clean not in ("admin", "hod", "faculty", "student"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: 'admin', 'hod', 'faculty', 'student'"
        )

    # Find or default department
    dept = db.query(Department).first()
    dept_id = dept.id if dept else 1

    new_user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        role=role_clean,
        phone=payload.phone,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-initialize Student or Faculty profile
    if role_clean == "student":
        student_count = db.query(Student).count() + 1
        new_student = Student(
            usn=f"4MT22CS{student_count:03d}",
            name=new_user.name,
            email=new_user.email,
            phone=new_user.phone,
            semester=5,
            section="A",
            department_id=dept_id,
            user_id=new_user.id
        )
        db.add(new_student)
        db.commit()
    elif role_clean in ("faculty", "hod"):
        fac_count = db.query(Faculty).count() + 1
        new_faculty = Faculty(
            employee_id=f"FAC-CSE-{fac_count:03d}",
            name=new_user.name,
            email=new_user.email,
            phone=new_user.phone,
            department_id=dept_id,
            user_id=new_user.id,
            designation="Professor & HOD" if role_clean == "hod" else "Assistant Professor"
        )
        db.add(new_faculty)
        db.commit()

    return success_response(
        data={"user_id": new_user.id, "name": new_user.name, "email": new_user.email, "role": new_user.role},
        message="User account registered successfully"
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password, returning JWT access and refresh tokens."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account is inactive. Please contact administration."
        )

    token_data = {
        "sub": user.email,
        "role": user.role,
        "user_id": user.id,
        "name": user.name,
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        name=user.name,
        email=user.email,
    )


@router.post("/refresh")
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Issue a new access token using a valid refresh token."""
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    email = decoded.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    token_data = {
        "sub": user.email,
        "role": user.role,
        "user_id": user.id,
        "name": user.name,
    }
    new_access_token = create_access_token(token_data)

    return success_response(
        data={"access_token": new_access_token, "token_type": "bearer"},
        message="Access token refreshed successfully"
    )


@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve profile and academic details for the currently authenticated user."""
    profile_data = {
        "id": current_user.id,
        "name": current_user.name,
        "full_name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "department_id": current_user.department_id,
        "teacher_id": current_user.teacher_id,
        "semester": current_user.semester,
        "section": current_user.section,
        "phone": current_user.phone,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }

    if current_user.role == "student" and current_user.student_profile:
        s = current_user.student_profile
        profile_data["student"] = {
            "id": s.id,
            "usn": s.usn,
            "semester": s.semester,
            "section": s.section,
            "department_id": s.department_id,
            "department_name": s.department.name if s.department else None,
        }
    elif current_user.role in ("faculty", "hod") and current_user.faculty_profile:
        f = current_user.faculty_profile
        profile_data["faculty"] = {
            "id": f.id,
            "employee_id": f.employee_id,
            "designation": f.designation,
            "department_id": f.department_id,
            "department_name": f.department.name if f.department else None,
        }

    return {"success": True, "user": profile_data, "data": profile_data}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Stateless JWT logout confirmation."""
    return success_response(message="Logged out successfully")
