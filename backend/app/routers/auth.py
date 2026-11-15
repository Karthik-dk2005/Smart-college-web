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
from app.models.email_otp import EmailOTP
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    StudentRoleRegister,
    TeacherRoleRegister,
    HODRoleRegister,
)
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.utils.email_service import generate_otp, send_email_otp
from app.utils.response import success_response, error_response
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "********"
    user_part, domain = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + "*" * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain}"

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

    try:
        from app.services.email_notification_service import EmailNotificationService
        EmailNotificationService.notify_admin_and_user_creation(
            db=db,
            new_user=new_user,
            created_by_role=current_caller.role if current_caller else "Public-Registration"
        )
    except Exception as notif_err:
        print(f"[AUTH NOTIFICATION WARNING] {notif_err}")

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


# -------------------------------------------------------------
# 1. POST /api/auth/send-otp
# -------------------------------------------------------------
@router.post("/send-otp")
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    """Send a 6-digit OTP code to the entered personal or college Gmail address."""
    email_clean = payload.email.strip().lower()

    # Rate limit check: 60-second cooldown
    recent_otp = db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.created_at >= datetime.utcnow() - timedelta(seconds=60)
    ).first()
    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="An OTP was sent recently. Please wait 60 seconds before requesting another code."
        )

    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    new_otp_record = EmailOTP(
        email=email_clean,
        otp_code=otp,
        purpose=payload.purpose or "Registration",
        expires_at=expires_at,
        is_verified=False,
        attempts=0
    )
    db.add(new_otp_record)
    db.commit()

    send_email_otp(email_clean, otp, payload.purpose or "Registration")

    return {
        "success": True,
        "message": f"A 6-digit verification code has been sent to {email_clean}. It is valid for 5 minutes.",
        "email": email_clean,
        "expires_in_minutes": 5
    }


# -------------------------------------------------------------
# 2. POST /api/auth/verify-otp
# -------------------------------------------------------------
@router.post("/verify-otp")
def verify_otp_endpoint(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify the 6-digit OTP code for the given email address."""
    email_clean = payload.email.strip().lower()
    clean_otp = payload.otp.strip()

    otp_record = db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.is_verified == False
    ).order_by(EmailOTP.id.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found for this email. Please request a new code."
        )

    if otp_record.attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a fresh OTP."
        )

    if datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code has expired. Please request a new OTP."
        )

    if otp_record.otp_code != clean_otp:
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please check your Gmail and try again."
        )

    otp_record.is_verified = True
    db.commit()

    return {
        "success": True,
        "message": "Email OTP verified successfully.",
        "email": email_clean
    }


# -------------------------------------------------------------
# 3. POST /api/auth/register/student & POST /api/auth/register-student
# -------------------------------------------------------------
@router.post("/register/student", response_model=TokenResponse)
@router.post("/register-student", response_model=TokenResponse)
def register_student_role(payload: StudentRoleRegister, db: Session = Depends(get_db)):
    """
    Student registration:
    - Validates USN against existing student database (131 records across A & B sections).
    - Automatically fetches student name if not provided.
    - Allows personal Gmail or college Gmail.
    - Verifies 6-digit OTP.
    - Prevents duplicate USN registration.
    """
    clean_usn = payload.usn.strip().upper()
    email_clean = payload.gmail.strip().lower()

    # 1. Validate USN against official student database
    student = db.query(Student).filter(func.upper(Student.usn) == clean_usn).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found. Please contact your Admin."
        )

    # 2. Prevent duplicate USN registration
    if student.registration_status == "Registered":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account is already registered for this USN. Please proceed to login."
        )

    # Check if another student or user has this email
    existing_user_email = db.query(User).filter(
        func.lower(User.email) == email_clean,
        func.upper(User.usn_or_employee_id) != clean_usn
    ).first()
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Gmail address is already associated with another account."
        )

    # 3. Password validation
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match."
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )
    if student.phone and student.phone.strip() and student.phone.strip() in payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For security, you cannot use your phone number as a password."
        )

    # 4. Verify OTP
    clean_otp = payload.otp.strip()
    valid_otp = False

    otp_record = db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.otp_code == clean_otp,
        EmailOTP.expires_at >= datetime.utcnow()
    ).order_by(EmailOTP.id.desc()).first()

    if otp_record:
        valid_otp = True
        otp_record.is_verified = True
    elif student.otp_code and student.otp_code == clean_otp:
        if student.otp_expires_at and datetime.utcnow() <= student.otp_expires_at:
            valid_otp = True

    if not valid_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please verify your Gmail."
        )

    # 5. Save and activate account
    hashed_pwd = get_password_hash(payload.password)
    student.password_hash = hashed_pwd
    student.gmail = email_clean
    student.email = email_clean
    student.registration_status = "Registered"
    student.email_verification_status = "Verified"
    student.registered_at = datetime.utcnow()
    student.otp_code = None

    user = db.query(User).filter(
        (func.upper(User.usn_or_employee_id) == clean_usn) |
        (func.lower(User.username) == clean_usn.lower()) |
        (func.lower(User.email) == email_clean)
    ).first()

    if not user:
        user = User(
            full_name=student.name,
            username=clean_usn.lower(),
            email=email_clean,
            password_hash=hashed_pwd,
            usn_or_employee_id=clean_usn,
            role="student",
            department_id=student.department_id,
            semester=student.semester,
            section=student.section,
            account_status="Approved",
            is_active=True
        )
        db.add(user)
        db.flush()
        student.user_id = user.id
    else:
        user.password_hash = hashed_pwd
        user.email = email_clean
        user.usn_or_employee_id = clean_usn
        user.account_status = "Approved"
        user.is_active = True
        student.user_id = user.id

    db.commit()
    db.refresh(user)

    try:
        from app.services.email_notification_service import EmailNotificationService
        EmailNotificationService.notify_admin_and_user_creation(
            db=db,
            new_user=user,
            created_by_role="Student-Registration"
        )
    except Exception as notif_err:
        print(f"[STUDENT AUTH NOTIFICATION WARNING] {notif_err}")

    # 6. Issue JWT Token
    token_data = {
        "sub": user.email,
        "role": "student",
        "user_id": user.id,
        "name": user.full_name or student.name,
        "username": user.username,
        "usn": student.usn
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    dept_name = student.department.name if student.department else "Computer Science and Engineering"

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role="student",
        user_id=user.id,
        name=student.name,
        full_name=student.name,
        username=user.username,
        email=user.email,
        account_status="Approved",
        usn=student.usn,
        gmail=student.gmail,
        semester=student.semester,
        section=student.section,
        department=dept_name
    )


# -------------------------------------------------------------
# 4. POST /api/auth/register/teacher
# -------------------------------------------------------------
@router.post("/register/teacher", status_code=status.HTTP_201_CREATED)
def register_teacher_role(payload: TeacherRoleRegister, db: Session = Depends(get_db)):
    """
    Teacher registration:
    - Verifies Teacher Employee ID against existing teacher records.
    - Verifies Gmail using OTP.
    - Submits registration request to Admin for approval (status: Pending).
    """
    clean_emp_id = payload.employee_id.strip().upper()
    email_clean = payload.gmail.strip().lower()

    # 1. Prevent duplicate teacher accounts
    existing_user = db.query(User).filter(
        (func.upper(User.usn_or_employee_id) == clean_emp_id) |
        (func.lower(User.email) == email_clean)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this Employee ID or Email already exists."
        )

    # 2. Check Teacher Employee ID against existing teacher records
    teacher = db.query(Teacher).filter(func.upper(Teacher.employee_id) == clean_emp_id).first()
    teacher_name = (teacher.name if teacher else payload.name).strip()
    dept_id = teacher.department_id if teacher else (payload.department_id or 1)

    # 3. Password validation
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match."
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # 4. Verify OTP
    clean_otp = payload.otp.strip()
    otp_record = db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.otp_code == clean_otp,
        EmailOTP.expires_at >= datetime.utcnow()
    ).order_by(EmailOTP.id.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please verify your email first."
        )
    otp_record.is_verified = True

    # 5. Create Teacher account with status "Pending" (requires Admin approval)
    hashed_pwd = get_password_hash(payload.password)
    user_handle = re.sub(r'[^a-z0-9]', '', teacher_name.lower().replace(' ', '')) or clean_emp_id.lower()
    if db.query(User).filter(User.username == user_handle).first():
        user_handle = f"{user_handle}_{clean_emp_id.lower()[-4:]}"

    new_user = User(
        full_name=teacher_name,
        username=user_handle,
        email=email_clean,
        password_hash=hashed_pwd,
        usn_or_employee_id=clean_emp_id,
        role="teacher",
        department_id=dept_id,
        designation="Assistant Professor",
        account_status="Pending",
        is_active=False
    )
    db.add(new_user)
    db.flush()

    if teacher:
        teacher.email = email_clean
        teacher.user_id = new_user.id
        teacher.password_hash = hashed_pwd
    else:
        new_teacher = Teacher(
            employee_id=clean_emp_id,
            name=teacher_name,
            email=email_clean,
            department_id=dept_id,
            designation="Assistant Professor",
            password_hash=hashed_pwd
        )
        db.add(new_teacher)

    db.commit()

    return {
        "success": True,
        "message": "Teacher registration request submitted successfully. Admin approval is required before you can log in.",
        "user_id": new_user.id,
        "employee_id": clean_emp_id,
        "account_status": "Pending"
    }


# -------------------------------------------------------------
# 5. POST /api/auth/register/hod
# -------------------------------------------------------------
@router.post("/register/hod", status_code=status.HTTP_201_CREATED)
def register_hod_role(payload: HODRoleRegister, db: Session = Depends(get_db)):
    """
    HOD registration:
    - Verifies HOD details against authorized records.
    - Verifies Gmail using OTP.
    - Mandatory Admin approval required before login.
    - Restricts HOD access to their assigned department.
    """
    clean_emp_id = payload.employee_id.strip().upper()
    email_clean = payload.gmail.strip().lower()

    # 1. Prevent duplicate HOD accounts
    existing_user = db.query(User).filter(
        (func.upper(User.usn_or_employee_id) == clean_emp_id) |
        (func.lower(User.email) == email_clean)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this Employee ID or Email already exists."
        )

    # 2. Check HOD details
    teacher = db.query(Teacher).filter(func.upper(Teacher.employee_id) == clean_emp_id).first()
    hod_name = (teacher.name if teacher else payload.name).strip()
    dept_id = teacher.department_id if teacher else (payload.department_id or 1)

    # 3. Password validation
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and Confirm Password do not match."
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # 4. Verify OTP
    clean_otp = payload.otp.strip()
    otp_record = db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.otp_code == clean_otp,
        EmailOTP.expires_at >= datetime.utcnow()
    ).order_by(EmailOTP.id.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please verify your email first."
        )
    otp_record.is_verified = True

    # 5. Create HOD account with status "Pending"
    hashed_pwd = get_password_hash(payload.password)
    user_handle = f"hod.{re.sub(r'[^a-z0-9]', '', hod_name.lower().replace(' ', ''))[:10]}"
    if db.query(User).filter(User.username == user_handle).first():
        user_handle = f"{user_handle}_{clean_emp_id.lower()[-4:]}"

    new_user = User(
        full_name=hod_name,
        username=user_handle,
        email=email_clean,
        password_hash=hashed_pwd,
        usn_or_employee_id=clean_emp_id,
        role="hod",
        department_id=dept_id,
        designation="Professor & Head of Department",
        account_status="Pending",
        is_active=False
    )
    db.add(new_user)
    db.commit()

    return {
        "success": True,
        "message": "HOD registration request submitted successfully. Super Admin approval is mandatory before login.",
        "user_id": new_user.id,
        "employee_id": clean_emp_id,
        "account_status": "Pending"
    }


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Common login endpoint with automatic role detection:
    - Admin, HOD, Teacher: Log in using registered Gmail + Password.
    - Student: Log in using registered Student USN + Password.
    - Students attempting to log in via Gmail are rejected with an explicit instruction to use their USN.
    - Enforces account status checks (blocks Pending, Rejected, Suspended, or Inactive accounts).
    """
    ident = payload.get_identifier()
    if not ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, Gmail, or Student USN is required."
        )

    user = None
    student_profile = None

    # 1. Automatic Account Type & Role Detection
    if "@" in ident:
        # User entered a Gmail / Email address
        clean_email = ident.lower().strip()

        # Check if this email belongs to a student
        student_match = db.query(Student).filter(
            (func.lower(Student.gmail) == clean_email) |
            (func.lower(Student.email) == clean_email)
        ).first()

        # Check if an Admin / HOD / Teacher account exists with this email
        staff_user = db.query(User).filter(
            func.lower(User.email) == clean_email,
            User.role.in_(["admin", "hod", "teacher", "faculty"])
        ).first()

        if student_match and not staff_user:
            # Student attempted to log in using email instead of USN
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Students must log in using their registered USN ({student_match.usn}), not their Gmail address."
            )

        if not staff_user:
            staff_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
            if staff_user and staff_user.role == "student":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Students must log in using their registered USN ({staff_user.usn_or_employee_id or 'USN'}), not their Gmail address."
                )

        if not staff_user:
            # Check Faculty or Teacher table
            fac = db.query(Faculty).filter(func.lower(Faculty.email) == clean_email).first()
            if fac and fac.user:
                staff_user = fac.user
            else:
                tch = db.query(Teacher).filter(func.lower(Teacher.email) == clean_email).first()
                if tch and tch.user_id:
                    staff_user = db.query(User).filter(User.id == tch.user_id).first()

        if not staff_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Gmail or password. Please verify and try again."
            )

        user = staff_user

    else:
        # User entered a USN (or admin username like 'admin' / employee ID)
        clean_id = ident.strip()

        # Check Student table by USN
        student_profile = db.query(Student).filter(
            func.upper(Student.usn) == clean_id.upper()
        ).first()

        if student_profile:
            # Check student registration & password
            user = student_profile.user
            if not user and student_profile.user_id:
                user = db.query(User).filter(User.id == student_profile.user_id).first()
            if not user:
                user = db.query(User).filter(func.upper(User.usn_or_employee_id) == student_profile.usn.upper()).first()

            pwd_hash = student_profile.password_hash or (user.password_hash if user else None)
            if not pwd_hash:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Student account is not registered yet. Please click 'Register as Student' to activate your account."
                )

            if not verify_password(payload.password, pwd_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid USN or password. Please verify and try again."
                )

            # Ensure linked User record exists for JWT generation
            if not user:
                user = User(
                    full_name=student_profile.name,
                    name=student_profile.name,
                    username=student_profile.usn.lower(),
                    email=student_profile.gmail or student_profile.email or f"{student_profile.usn.lower()}@college.edu",
                    password_hash=pwd_hash,
                    usn_or_employee_id=student_profile.usn,
                    role="student",
                    department_id=student_profile.department_id,
                    semester=student_profile.semester,
                    section=student_profile.section,
                    account_status="Approved",
                    is_active=True,
                )
                db.add(user)
                db.flush()
                student_profile.user_id = user.id
                db.commit()
                db.refresh(user)
            elif not user.password_hash:
                user.password_hash = pwd_hash
                db.commit()

        else:
            # Check User table by username or employee ID (e.g., admin username)
            user = db.query(User).filter(
                (func.lower(User.username) == clean_id.lower()) |
                (func.upper(User.usn_or_employee_id) == clean_id.upper())
            ).first()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials. Student USN or user account not found."
                )

            if not verify_password(payload.password, user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials or incorrect password. Please verify and try again."
                )

    # 2. Check account status & active state
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

    # 3. Normalize role
    role_normalized = user.role.lower()
    if role_normalized == "faculty":
        role_normalized = "teacher"

    # 4. Issue JWT Tokens
    token_data = {
        "sub": user.email,
        "role": role_normalized,
        "user_id": user.id,
        "name": user.full_name or user.name or user.username,
        "username": user.username,
    }
    if role_normalized == "student":
        stud_rec = student_profile or user.student_profile or db.query(Student).filter(
            (Student.user_id == user.id) | (func.upper(Student.usn) == (user.usn_or_employee_id or "").upper())
        ).first()
        if stud_rec:
            token_data["usn"] = stud_rec.usn

    expires_delta = timedelta(days=7) if payload.remember_me else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(token_data, expires_delta=expires_delta)
    refresh_token = create_refresh_token(token_data)

    stud_rec = student_profile or user.student_profile or (
        db.query(Student).filter(
            (Student.user_id == user.id) | (func.upper(Student.usn) == (user.usn_or_employee_id or "").upper())
        ).first() if role_normalized == "student" else None
    )

    stud_usn = stud_rec.usn if stud_rec else (user.usn_or_employee_id if role_normalized == "student" else None)
    stud_gmail = stud_rec.gmail if stud_rec else (user.email if role_normalized == "student" else None)
    stud_sem = stud_rec.semester if stud_rec else user.semester
    stud_sec = stud_rec.section if stud_rec else user.section
    stud_dept = stud_rec.department.name if (stud_rec and stud_rec.department) else (user.department.name if user.department else "Computer Science and Engineering")

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


@router.get("/profile")
def get_user_profile_alias(current_user: User = Depends(get_current_user)):
    """Alias for /api/auth/profile required by the specification."""
    return get_current_user_profile(current_user=current_user)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Stateless JWT logout confirmation."""
    return success_response(message="Logged out successfully")


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Password recovery initiation:
    - Accepts USN, Employee ID, username, or registered email.
    - Matches with database record to locate the registered Gmail.
    - Generates 6-digit OTP (and token).
    - Dispatches OTP to registered Gmail.
    - Returns masked email and success message.
    """
    ident = payload.target_identifier
    if not ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="USN, Employee ID, or Email address is required."
        )

    # 1. Search in Student table (by USN, email, gmail)
    target_email = None
    target_name = None
    user = None
    student = db.query(Student).filter(
        (func.upper(Student.usn) == ident.upper()) |
        (func.lower(Student.gmail) == ident.lower()) |
        (func.lower(Student.email) == ident.lower())
    ).first()

    if student:
        target_email = student.gmail or student.email
        target_name = student.name
        if student.user:
            user = student.user
        elif student.user_id:
            user = db.query(User).filter(User.id == student.user_id).first()

    # 2. Search in Faculty / Teacher table
    if not target_email:
        fac = db.query(Faculty).filter(func.upper(Faculty.employee_id) == ident.upper()).first()
        if fac:
            target_email = fac.email
            target_name = fac.name
            if fac.user:
                user = fac.user
        else:
            teacher = db.query(Teacher).filter(func.upper(Teacher.employee_id) == ident.upper()).first()
            if teacher:
                target_email = teacher.email
                target_name = teacher.name
                if teacher.user_id:
                    user = db.query(User).filter(User.id == teacher.user_id).first()

    # 3. Search in User table
    if not user:
        user = db.query(User).filter(
            (func.upper(User.usn_or_employee_id) == ident.upper()) |
            (func.lower(User.username) == ident.lower()) |
            (func.lower(User.email) == ident.lower())
        ).first()

    if user:
        target_email = target_email or user.email
        target_name = target_name or user.full_name or user.name or user.username

    if not target_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found matching this USN / Employee ID / Email."
        )

    # If payload.registered_gmail was provided by the user, verify it matches
    if payload.registered_gmail and payload.registered_gmail.strip():
        if payload.registered_gmail.strip().lower() != target_email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entered Gmail does not match the registered Gmail for this account."
            )

    # Rate limiting: 60s cooldown
    recent_otp = db.query(EmailOTP).filter(
        EmailOTP.email == target_email.lower(),
        EmailOTP.created_at >= datetime.utcnow() - timedelta(seconds=60)
    ).first()
    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="A reset OTP was sent recently. Please wait 60 seconds before requesting another."
        )

    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    token = secrets.token_urlsafe(32)

    new_otp_record = EmailOTP(
        email=target_email.lower(),
        otp_code=otp,
        purpose="Password Reset",
        expires_at=expires_at,
        is_verified=False,
        attempts=0
    )
    db.add(new_otp_record)

    if user:
        user.reset_token = token
        user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
    if student:
        student.otp_code = otp
        student.otp_expires_at = expires_at

    db.commit()

    send_email_otp(target_email, otp, "Password Reset")
    masked = mask_email(target_email)

    return success_response(
        data={
            "email": masked,
            "full_email": target_email,
            "reset_token": token,
            "expires_in_minutes": 5
        },
        message=f"Password recovery OTP has been sent to your registered Gmail ({masked}). It is valid for 5 minutes."
    )


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using either:
    1. OTP + Identifier (USN / Employee ID / Email)
    2. Reset Token
    """
    if payload.confirm_password and payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match."
        )
    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    ident = (payload.identifier or payload.usn or "").strip()
    clean_otp = (payload.otp or "").strip()
    clean_token = (payload.token or "").strip()

    user = None
    student = None
    teacher = None

    if clean_otp and ident:
        # Locate target
        student = db.query(Student).filter(
            (func.upper(Student.usn) == ident.upper()) |
            (func.lower(Student.gmail) == ident.lower()) |
            (func.lower(Student.email) == ident.lower())
        ).first()

        target_email = None
        if student:
            target_email = student.gmail or student.email
            if student.user:
                user = student.user
            elif student.user_id:
                user = db.query(User).filter(User.id == student.user_id).first()

        if not target_email:
            teacher = db.query(Teacher).filter(func.upper(Teacher.employee_id) == ident.upper()).first()
            if teacher:
                target_email = teacher.email
                if teacher.user_id:
                    user = db.query(User).filter(User.id == teacher.user_id).first()

        if not user:
            user = db.query(User).filter(
                (func.upper(User.usn_or_employee_id) == ident.upper()) |
                (func.lower(User.username) == ident.lower()) |
                (func.lower(User.email) == ident.lower())
            ).first()
            if user and not target_email:
                target_email = user.email

        if not target_email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found."
            )

        # Verify OTP
        otp_record = db.query(EmailOTP).filter(
            EmailOTP.email == target_email.lower(),
            EmailOTP.purpose == "Password Reset",
            EmailOTP.is_verified == False
        ).order_by(EmailOTP.id.desc()).first()

        valid = False
        if otp_record:
            if otp_record.attempts >= 5:
                raise HTTPException(status_code=400, detail="Maximum OTP verification attempts exceeded. Please request a new OTP.")
            if datetime.utcnow() > otp_record.expires_at:
                raise HTTPException(status_code=400, detail="OTP has expired. Please request a new OTP.")
            if otp_record.otp_code != clean_otp:
                otp_record.attempts += 1
                db.commit()
                raise HTTPException(status_code=400, detail="Invalid OTP code.")
            otp_record.is_verified = True
            valid = True
        elif student and student.otp_code == clean_otp:
            if student.otp_expires_at and datetime.utcnow() <= student.otp_expires_at:
                valid = True

        if not valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code."
            )

    elif clean_token:
        user = db.query(User).filter(User.reset_token == clean_token).first()
        if not user or not user.reset_token_expires_at or user.reset_token_expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token. Please request a new reset link."
            )
        user.reset_token = None
        user.reset_token_expires_at = None
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either reset token or OTP with USN/Email is required."
        )

    # Hash new password and update
    new_hashed = get_password_hash(payload.new_password)
    if user:
        user.password_hash = new_hashed
    if student:
        student.password_hash = new_hashed
        student.otp_code = None
    if teacher:
        teacher.password_hash = new_hashed

    db.commit()

    return success_response(
        message="Password has been reset successfully. You can now log in with your new password."
    )
