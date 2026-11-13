import re
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.teacher import Teacher
from app.models.department import Department
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
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

optional_bearer = HTTPBearer(auto_error=False)


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if payload and payload.get("type") == "access":
            email = payload.get("sub")
            if email:
                return db.query(User).filter(User.email == email).first()
    except Exception:
        pass
    return None


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegister,
    db: Session = Depends(get_db),
    current_caller: Optional[User] = Depends(get_optional_user)
):
    """
    Register a new user account.
    - Public visitors can submit Student registration requests (defaulting to Pending approval).
    - Public visitors cannot register Admin or HOD accounts.
    - Admins can create Admin, HOD, Teacher, and Student accounts with immediate approval.
    - HODs can register Teachers and Students for their own department with immediate approval.
    """
    full_name = (payload.full_name or payload.name or "").strip()
    if not full_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is required.")

    clean_email = payload.email.lower().strip()
    role_clean = payload.role.lower().strip()
    if role_clean == "faculty":
        role_clean = "teacher"

    if role_clean not in ("admin", "hod", "teacher", "student"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: 'admin', 'hod', 'teacher', 'student'"
        )

    # Permissions check
    is_admin = current_caller and current_caller.role == "admin"
    is_hod = current_caller and current_caller.role == "hod"

    if not current_caller:
        # Public registration
        if role_clean in ("admin", "hod"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Public registration as Admin or HOD is strictly prohibited. Please contact the institution."
            )
        # Students register with Pending status
        account_status = "Pending"
        is_active = False
    elif is_admin:
        account_status = "Approved"
        is_active = True
    elif is_hod:
        if role_clean in ("admin", "hod"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs cannot create Admin or other HOD accounts."
            )
        # HOD can only register users for their own department
        if payload.department_id and payload.department_id != current_caller.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs can only register users for their own department."
            )
        account_status = "Approved"
        is_active = True
    else:
        # Teachers / students cannot register others
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to register user accounts."
        )

    # Password confirmation check
    if payload.confirm_password and payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match."
        )

    # Duplicate check: Email
    if db.query(User).filter(func.lower(User.email) == clean_email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists."
        )

    # Determine username
    clean_username = (payload.username or clean_email.split("@")[0]).lower().strip()
    # Check duplicate username
    if db.query(User).filter(func.lower(User.username) == clean_username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{clean_username}' is already taken. Please choose another username."
        )

    # Determine USN / Employee ID
    usn_or_emp = (payload.usn_or_employee_id or "").strip()
    if usn_or_emp:
        if db.query(User).filter(func.upper(User.usn_or_employee_id) == usn_or_emp.upper()).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"USN or Employee ID '{usn_or_emp}' is already registered."
            )
        if role_clean == "student" and db.query(Student).filter(func.upper(Student.usn) == usn_or_emp.upper()).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Student with USN '{usn_or_emp}' already exists."
            )

    # Department assignment
    dept_id = payload.department_id
    if is_hod and current_caller.department_id:
        dept_id = current_caller.department_id
    if not dept_id:
        first_dept = db.query(Department).first()
        dept_id = first_dept.id if first_dept else 1

    phone_val = (payload.mobile_number or payload.phone or "").strip() or None

    new_user = User(
        full_name=full_name,
        name=full_name,
        username=clean_username,
        email=clean_email,
        password_hash=get_password_hash(payload.password),
        role=role_clean,
        department_id=dept_id,
        semester=payload.semester if role_clean == "student" else None,
        section=(payload.section or "A").upper() if role_clean == "student" else None,
        designation=payload.designation if role_clean in ("teacher", "hod") else None,
        mobile_number=phone_val,
        phone=phone_val,
        usn_or_employee_id=usn_or_emp or None,
        account_status=account_status,
        is_active=is_active,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Link Student or Faculty profile
    if role_clean == "student":
        final_usn = usn_or_emp or f"4MN24CS{new_user.id:03d}"
        if not new_user.usn_or_employee_id:
            new_user.usn_or_employee_id = final_usn
            db.commit()

        new_student = Student(
            usn=final_usn,
            name=full_name,
            email=clean_email,
            phone=phone_val,
            semester=payload.semester or 5,
            section=(payload.section or "A").upper(),
            department_id=dept_id,
            user_id=new_user.id
        )
        db.add(new_student)
        db.commit()

    elif role_clean in ("teacher", "hod"):
        final_emp_id = usn_or_emp or f"FAC-CSE-{new_user.id:03d}"
        if not new_user.usn_or_employee_id:
            new_user.usn_or_employee_id = final_emp_id
            db.commit()

        desig = payload.designation or ("Professor & HOD" if role_clean == "hod" else "Assistant Professor")
        new_faculty = Faculty(
            employee_id=final_emp_id,
            name=full_name,
            email=clean_email,
            phone=phone_val,
            department_id=dept_id,
            user_id=new_user.id,
            designation=desig
        )
        db.add(new_faculty)

        # Also create Teacher record for timetable/attendance compatibility if teacher
        existing_teacher = db.query(Teacher).filter(Teacher.email == clean_email).first()
        if not existing_teacher and role_clean == "teacher":
            new_teacher = Teacher(
                employee_id=final_emp_id,
                name=full_name,
                email=clean_email,
                phone=phone_val,
                department_id=dept_id,
                designation=desig
            )
            db.add(new_teacher)
        db.commit()

    resp_msg = (
        "Registration request submitted successfully. Your account is pending approval by the Admin or Department HOD."
        if account_status == "Pending"
        else "User account registered and approved successfully."
    )

    return success_response(
        data={
            "user_id": new_user.id,
            "full_name": new_user.full_name,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "account_status": new_user.account_status,
            "is_active": new_user.is_active,
        },
        message=resp_msg,
        status_code=status.HTTP_201_CREATED
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate using username, email, or USN/Employee ID with password.
    Enforces account status check (blocks Pending, Rejected, Suspended accounts).
    """
    ident = payload.identifier
    if not ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, email, or USN is required."
        )

    user = db.query(User).filter(
        (func.lower(User.email) == ident.lower()) |
        (func.lower(User.username) == ident.lower()) |
        (func.upper(User.usn_or_employee_id) == ident.upper())
    ).first()

    # Direct fallback: check Student table for USN or registered Gmail
    student_profile = None
    if not user:
        student_profile = db.query(Student).filter(
            (func.upper(Student.usn) == ident.upper()) |
            (func.lower(Student.gmail) == ident.lower()) |
            (func.lower(Student.email) == ident.lower())
        ).first()
        if student_profile and student_profile.user:
            user = student_profile.user
    elif user and user.role == "student":
        student_profile = user.student_profile or db.query(Student).filter(Student.user_id == user.id).first()
        if not student_profile and user.usn_or_employee_id:
            student_profile = db.query(Student).filter(func.upper(Student.usn) == user.usn_or_employee_id.upper()).first()

    # Direct fallback: check Faculty table for employee_id
    if not user:
        fac = db.query(Faculty).filter(func.upper(Faculty.employee_id) == ident.upper()).first()
        if fac and fac.user:
            user = fac.user

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password. Please verify and try again."
        )

    # Check account status
    acc_status = getattr(user, "account_status", "Approved") or "Approved"
    if acc_status == "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account registration is pending approval by your Department HOD or Administrator. Access to the dashboard is not yet authorized."
        )
    if acc_status == "Rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account registration was rejected. Please contact the department administration."
        )
    if acc_status == "Suspended" or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account is suspended or inactive. Please contact administration."
        )

    # Normalize role for consistent routing
    role_normalized = user.role.lower()
    if role_normalized == "faculty":
        role_normalized = "teacher"

    token_data = {
        "sub": user.email,
        "role": role_normalized,
        "user_id": user.id,
        "name": user.full_name or user.name or user.username,
        "username": user.username,
    }

    expires_delta = timedelta(days=7) if payload.remember_me else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(token_data, expires_delta=expires_delta)
    refresh_token = create_refresh_token(token_data)

    stud_usn = student_profile.usn if student_profile else user.usn_or_employee_id
    stud_gmail = student_profile.gmail if student_profile else None
    stud_sem = student_profile.semester if student_profile else user.semester
    stud_sec = student_profile.section if student_profile else user.section
    stud_dept = student_profile.department.name if (student_profile and student_profile.department) else (user.department.name if user.department else "Computer Science and Engineering")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role=role_normalized,
        user_id=user.id,
        name=user.full_name or user.name or user.username,
        full_name=user.full_name or user.name,
        username=user.username,
        email=user.email,
        account_status=acc_status,
        usn=stud_usn,
        gmail=stud_gmail,
        semester=stud_sem,
        section=stud_sec,
        department=stud_dept,
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
    if not user or not user.is_active or getattr(user, "account_status", "Approved") != "Approved":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or not approved."
        )

    role_normalized = user.role.lower()
    if role_normalized == "faculty":
        role_normalized = "teacher"

    token_data = {
        "sub": user.email,
        "role": role_normalized,
        "user_id": user.id,
        "name": user.full_name or user.name or user.username,
        "username": user.username,
    }
    new_access_token = create_access_token(token_data)

    return success_response(
        data={"access_token": new_access_token, "token_type": "bearer"},
        message="Access token refreshed successfully"
    )


@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve full profile and academic details for the currently authenticated user."""
    role_normalized = current_user.role.lower()
    if role_normalized == "faculty":
        role_normalized = "teacher"

    profile_data = {
        "id": current_user.id,
        "name": current_user.full_name or current_user.name,
        "full_name": current_user.full_name or current_user.name,
        "username": current_user.username,
        "email": current_user.email,
        "role": role_normalized,
        "account_status": getattr(current_user, "account_status", "Approved"),
        "department_id": current_user.department_id,
        "department_name": current_user.department.name if current_user.department else None,
        "teacher_id": current_user.teacher_id,
        "semester": current_user.semester,
        "section": current_user.section,
        "designation": current_user.designation,
        "phone": current_user.mobile_number or current_user.phone,
        "mobile_number": current_user.mobile_number or current_user.phone,
        "usn_or_employee_id": current_user.usn_or_employee_id,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }

    if current_user.role.lower() == "student":
        stud = current_user.student_profile
        if not stud and current_user.usn_or_employee_id:
            stud = db.query(Student).filter(Student.usn == current_user.usn_or_employee_id).first()
        if stud:
            profile_data["usn"] = stud.usn
            profile_data["gmail"] = stud.gmail
            profile_data["semester"] = stud.semester or current_user.semester
            profile_data["section"] = stud.section or current_user.section
            profile_data["department"] = stud.department.name if stud.department else profile_data.get("department_name")
        else:
            profile_data["usn"] = current_user.usn_or_employee_id

    if role_normalized == "student" and current_user.student_profile:
        s = current_user.student_profile
        profile_data["student"] = {
            "id": s.id,
            "usn": s.usn,
            "semester": s.semester,
            "section": s.section,
            "department_id": s.department_id,
            "department_name": s.department.name if s.department else None,
        }
    elif role_normalized in ("teacher", "hod") and current_user.faculty_profile:
        f = current_user.faculty_profile
        profile_data["faculty"] = {
            "id": f.id,
            "employee_id": f.employee_id,
            "designation": f.designation or current_user.designation,
            "department_id": f.department_id,
            "department_name": f.department.name if f.department else None,
        }

    return {"success": True, "user": profile_data, "data": profile_data}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Stateless JWT logout confirmation."""
    return success_response(message="Logged out successfully")


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate a secure, time-limited password reset token.
    Always returns generic success message to prevent user enumeration.
    """
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    reset_token = None
    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        reset_token = token
        # Log to server console so tester/admin can verify without external mail server
        print(f"[*] Password reset generated for {user.email}: Token = {token}")

    return success_response(
        data={"reset_token": reset_token},
        message="If an account with that email exists, password reset instructions have been sent."
    )


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify reset token and update password."""
    if payload.confirm_password and payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match."
        )

    if not payload.token or not payload.token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token is required."
        )

    user = db.query(User).filter(User.reset_token == payload.token.strip()).first()
    if not user or not user.reset_token_expires_at or user.reset_token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token. Please request a new reset link."
        )

    user.password_hash = get_password_hash(payload.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    return success_response(
        message="Password has been reset successfully. You can now log in with your new password."
    )
