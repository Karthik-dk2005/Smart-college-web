import re
import secrets
import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.student_auth import (
    VerifyUSNResponse,
    StudentRegisterRequest,
    StudentVerifyEmailRequest,
    StudentResendOTPRequest,
    StudentLoginRequest,
    StudentAuthResponse,
)
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/auth/student", tags=["Student Authentication"])

def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "********"
    user_part, domain = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + "*" * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain}"

@router.get("/verify-usn/{usn}", response_model=VerifyUSNResponse)
def verify_usn(usn: str, db: Session = Depends(get_db)):
    clean_usn = usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"USN '{clean_usn}' not found in official student records. Please contact Department Admin."
        )

    dept_name = student.department.name if student.department else "Computer Science and Engineering"
    has_gmail = bool(student.gmail and "@" in student.gmail)
    is_registered = (student.registration_status == "Registered")

    if not has_gmail:
        return VerifyUSNResponse(
            usn=student.usn,
            name=student.name,
            semester=student.semester,
            section=student.section,
            department=dept_name,
            masked_gmail=None,
            has_gmail=False,
            is_registered=False,
            can_register=False,
            message="Gmail address is missing in official records. Please contact Department Admin to update your Gmail before registering."
        )

    masked = mask_email(student.gmail)

    if is_registered:
        return VerifyUSNResponse(
            usn=student.usn,
            name=student.name,
            semester=student.semester,
            section=student.section,
            department=dept_name,
            masked_gmail=masked,
            has_gmail=True,
            is_registered=True,
            can_register=False,
            message="Your account is already registered. Please proceed to login with your USN or Gmail."
        )

    return VerifyUSNResponse(
        usn=student.usn,
        name=student.name,
        semester=student.semester,
        section=student.section,
        department=dept_name,
        masked_gmail=masked,
        has_gmail=True,
        is_registered=False,
        can_register=True,
        message="USN verified. Please enter your registered Gmail to receive your one-time verification code."
    )

@router.post("/register")
def initiate_student_registration(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    entered_gmail = req.gmail.strip().lower()

    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"USN '{clean_usn}' not found in student database."
        )

    if student.registration_status == "Registered":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account has already been registered. Please proceed to login."
        )

    if not student.gmail or "@" not in student.gmail:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gmail address is missing from department records. Please ask Admin to update your Gmail before registration."
        )

    if student.gmail.strip().lower() != entered_gmail:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The entered Gmail does not match our official records for this USN. Please verify and try again."
        )

    # Check if this Gmail is already claimed by another registered student
    other_student = db.query(Student).filter(
        Student.gmail == entered_gmail,
        Student.usn != clean_usn,
        Student.registration_status == "Registered"
    ).first()
    if other_student:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Gmail address is already registered to another student account."
        )

    # Generate secure 6-digit OTP
    otp = f"{secrets.randbelow(900000) + 100000:06d}"
    now = datetime.datetime.utcnow()

    student.otp_code = otp
    student.otp_expires_at = now + datetime.timedelta(minutes=10)
    student.otp_resend_count = 0
    student.otp_last_sent_at = now
    student.registration_status = "Pending_OTP"
    student.email_verification_status = "Pending"
    db.commit()

    return {
        "success": True,
        "message": "A 6-digit verification code has been sent to your registered Gmail address.",
        "usn": student.usn,
        "expires_in_minutes": 10
    }

@router.post("/resend-otp")
def resend_otp(req: StudentResendOTPRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    if student.registration_status == "Registered":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is already registered.")

    now = datetime.datetime.utcnow()

    # Rate limiting: max 5 resends
    if (student.otp_resend_count or 0) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum OTP resend attempts reached. Please wait or contact Admin."
        )

    # Cooldown of 30 seconds
    if student.otp_last_sent_at:
        diff_seconds = (now - student.otp_last_sent_at).total_seconds()
        if diff_seconds < 30:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {int(30 - diff_seconds)} more seconds before requesting another code."
            )

    otp = f"{secrets.randbelow(900000) + 100000:06d}"
    student.otp_code = otp
    student.otp_expires_at = now + datetime.timedelta(minutes=10)
    student.otp_resend_count = (student.otp_resend_count or 0) + 1
    student.otp_last_sent_at = now
    db.commit()

    return {
        "success": True,
        "message": "A new verification code has been sent to your registered Gmail address.",
        "usn": student.usn
    }

@router.post("/verify-email")
def verify_email_and_complete_registration(req: StudentVerifyEmailRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    entered_otp = req.otp.strip()
    password = req.password

    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    if student.registration_status == "Registered":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account already registered.")

    if not student.otp_code or student.otp_code != entered_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check your Gmail and enter the correct 6-digit code."
        )

    now = datetime.datetime.utcnow()
    if student.otp_expires_at and now > student.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new OTP."
        )

    # Password policy: phone number cannot be password
    if student.phone and student.phone.strip() and student.phone.strip() in password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For your account security, your phone number cannot be used as a password."
        )

    hashed_pw = get_password_hash(password)

    # Update Student
    student.registration_status = "Registered"
    student.email_verification_status = "Verified"
    student.registered_at = now
    student.otp_code = None
    student.password_hash = hashed_pw

    # Link or create User
    user = db.query(User).filter(
        or_(
            User.usn_or_employee_id == student.usn,
            User.username == student.usn.lower(),
            User.email == student.gmail
        )
    ).first()

    if user:
        user.password_hash = hashed_pw
        user.email = student.gmail
        user.usn_or_employee_id = student.usn
        user.account_status = "Approved"
        user.is_active = True
        user.full_name = student.name
        user.role = "student"
        student.user_id = user.id
    else:
        user = User(
            username=student.usn.lower(),
            email=student.gmail,
            password_hash=hashed_pw,
            full_name=student.name,
            usn_or_employee_id=student.usn,
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

    db.commit()

    return {
        "success": True,
        "message": "Email verified and registration successfully completed! You can now log in.",
        "usn": student.usn
    }

@router.post("/login", response_model=StudentAuthResponse)
def student_login(req: StudentLoginRequest, db: Session = Depends(get_db)):
    ident = req.identifier.strip()
    password = req.password

    # Find student by USN or Gmail
    student = db.query(Student).filter(
        or_(
            Student.usn.ilike(ident),
            Student.gmail.ilike(ident),
            Student.email.ilike(ident)
        )
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Student USN or Gmail not found."
        )

    if student.registration_status != "Registered" or student.email_verification_status != "Verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your student account has not been registered or verified yet. Please complete registration with your USN and Gmail."
        )

    # Check password against User or Student
    user = student.user
    valid_password = False

    if user and user.password_hash and verify_password(password, user.password_hash):
        valid_password = True
    elif student.password_hash and verify_password(password, student.password_hash):
        valid_password = True

    if not valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password."
        )

    dept_name = student.department.name if student.department else "Computer Science and Engineering"

    token_data = {
        "sub": user.username if user else student.usn.lower(),
        "role": "student",
        "user_id": user.id if user else student.id,
        "usn": student.usn
    }
    access_token = create_access_token(data=token_data)

    user_info = {
        "id": user.id if user else student.id,
        "student_id": student.id,
        "name": student.name,
        "full_name": student.name,
        "usn": student.usn,
        "gmail": student.gmail,
        "email": student.gmail or student.email,
        "semester": student.semester,
        "section": student.section,
        "department": dept_name,
        "role": "student",
        "registration_status": student.registration_status,
        "email_verification_status": student.email_verification_status
    }

    return StudentAuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_info
    )

