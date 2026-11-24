import re
import secrets
import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.models.department import Department
from app.models.timetable import Timetable
from app.models.attendance import Attendance
from app.models.student_attendance import StudentAttendance
from app.models.mark import Mark
from app.models.event import Event
from app.models.student_activity import StudentActivity
from app.models.student_bus_assignment import StudentBusAssignment
from app.models.bus_route import BusRoute

from app.schemas.student_auth import (
    CheckUSNRequest,
    CheckUSNResponse,
    VerifyUSNResponse,
    StudentRegisterRequest,
    VerifyOTPRequest,
    StudentVerifyEmailRequest,
    StudentResendOTPRequest,
    StudentLoginRequest,
    StudentAuthResponse,
    StudentDashboardProfile,
    StudentForgotPasswordRequest,
    StudentVerifyRecoveryOTPRequest,
    StudentResetPasswordRequest,
)
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from app.dependencies import get_current_user
from app.services.email_notification_service import EmailNotificationService

router = APIRouter(prefix="/api/auth/student", tags=["Student Authentication"])


def _dispatch_student_otp_email(student: Student, otp: str, purpose: str = "Student Account Registration") -> Dict[str, Any]:
    """
    Sends a branded 6-digit OTP email to the student's registered Gmail using EmailNotificationService.
    Returns delivery metadata; when real Gmail SMTP is not yet configured in .env, flags simulation_mode
    so development/demo environments remain 100% testable without blocking registration.
    """
    is_real_smtp = EmailNotificationService.is_real_smtp_configured()
    html_body = EmailNotificationService.build_branded_html(
        title=f"{purpose} — Verification Code",
        message=(
            f"Hello <strong>{student.name}</strong>,<br/><br/>"
            f"Use the 6-digit One-Time Password (OTP) below to complete your <strong>{purpose}</strong> on SmartDept:"
            f"<div style='margin: 22px 0; text-align: center;'>"
            f"<span style='display: inline-block; padding: 14px 28px; background: #eff6ff; border: 2px solid #1d4ed8; "
            f"border-radius: 10px; font-family: monospace; font-size: 30px; font-weight: 800; letter-spacing: 8px; color: #0c2c68;'>"
            f"{otp}</span></div>"
            f"This verification code is valid for <strong>10 minutes</strong>. Do not share it with anyone."
        ),
        badge_text="OTP VERIFICATION",
        details={
            "Student Name": student.name,
            "USN": student.usn,
            "Semester / Section": f"{student.semester}th Semester — Section {student.section}",
            "Registered Gmail": student.gmail or student.email,
            "Valid For": "10 minutes",
        },
    )
    text_body = (
        f"SmartDept - Smart Department Academic & Campus Management System\n\n"
        f"Hello {student.name} ({student.usn}),\n"
        f"Your 6-digit verification code for {purpose} is: {otp}\n"
        f"This code expires in 10 minutes.\n"
    )

    success, error_msg = EmailNotificationService.send_smtp_email(
        to_email=student.gmail,
        subject=f"[SmartDept] {otp} is your {purpose} OTP",
        html_content=html_body,
        text_content=text_body,
    )

    result: Dict[str, Any] = {
        "email_sent": success,
        "simulation_mode": not is_real_smtp,
    }
    if not is_real_smtp:
        result["demo_otp"] = otp
    elif not success:
        print(f"[!] Warning: Live SMTP OTP send failed for {student.usn} ({student.gmail}): {error_msg}")
    return result

def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "********"
    user_part, domain = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + "*" * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain}"

# 1. POST /api/auth/student/check-usn
@router.post("/check-usn", response_model=CheckUSNResponse)
def check_usn(req: CheckUSNRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found. Please contact your Admin."
        )

    dept_name = student.department.name if student.department else "Computer Science and Engineering"
    has_gmail = bool(student.gmail and "@" in student.gmail)
    is_registered = (student.registration_status == "Registered")

    if not has_gmail:
        return CheckUSNResponse(
            usn=student.usn,
            name=student.name,
            gmail=None,
            masked_gmail=None,
            department=dept_name,
            semester=student.semester,
            section=student.section,
            is_registered=False,
            has_gmail=False,
            can_register=False,
            message="Registered Gmail is missing in official records. Please contact your Admin to update your Gmail before registering."
        )

    masked = mask_email(student.gmail)

    if is_registered:
        return CheckUSNResponse(
            usn=student.usn,
            name=student.name,
            gmail=student.gmail,
            masked_gmail=masked,
            department=dept_name,
            semester=student.semester,
            section=student.section,
            is_registered=True,
            has_gmail=True,
            can_register=False,
            message="Your account is already registered. Please proceed to login with your USN and password."
        )

    return CheckUSNResponse(
        usn=student.usn,
        name=student.name,
        gmail=student.gmail,
        masked_gmail=masked,
        department=dept_name,
        semester=student.semester,
        section=student.section,
        is_registered=False,
        has_gmail=True,
        can_register=True,
        message="Student record verified. Please enter your password to receive the verification OTP."
    )

# Alias: GET /api/auth/student/verify-usn/{usn}
@router.get("/verify-usn/{usn}", response_model=VerifyUSNResponse)
def verify_usn(usn: str, db: Session = Depends(get_db)):
    res = check_usn(CheckUSNRequest(usn=usn), db)
    return VerifyUSNResponse(
        usn=res.usn,
        name=res.name,
        semester=res.semester,
        section=res.section,
        department=res.department,
        masked_gmail=res.masked_gmail,
        has_gmail=res.has_gmail,
        is_registered=res.is_registered,
        can_register=res.can_register,
        message=res.message
    )

# 2. POST /api/auth/student/register
@router.post("/register")
def register_student(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found. Please contact your Admin."
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

    # If Gmail is provided, verify it matches the registered Gmail
    if req.gmail and req.gmail.strip():
        if req.gmail.strip().lower() != student.gmail.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entered Gmail does not match our official records for this USN. Please verify and try again."
            )

    # If password is provided in registration step
    if req.password:
        if len(req.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long."
            )
        if req.confirm_password and req.password != req.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password and Confirm Password do not match."
            )
        # Check phone number policy
        if student.phone and student.phone.strip() and student.phone.strip() in req.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="For security, you cannot use your phone number as a password."
            )
        student.password_hash = get_password_hash(req.password)

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

    delivery = _dispatch_student_otp_email(student, otp, purpose="Student Account Registration")

    response_payload = {
        "success": True,
        "message": f"A 6-digit verification code has been sent to your registered Gmail address ({mask_email(student.gmail)}).",
        "usn": student.usn,
        "gmail": student.gmail,
        "expires_in_minutes": 10,
        "simulation_mode": delivery["simulation_mode"],
    }
    if delivery.get("demo_otp"):
        response_payload["demo_otp"] = delivery["demo_otp"]
    return response_payload

# 3. POST /api/auth/student/verify-otp
@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    entered_otp = req.otp.strip()

    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found.")

    if student.registration_status == "Registered":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account already registered.")

    if not student.otp_code or student.otp_code != entered_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please check your Gmail and try again."
        )

    now = datetime.datetime.utcnow()
    if student.otp_expires_at and now > student.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new OTP."
        )

    # Ensure password hash exists
    if not student.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password not set. Please restart the registration step."
        )

    # Activate Student
    student.registration_status = "Registered"
    student.email_verification_status = "Verified"
    student.registered_at = now
    student.otp_code = None

    # Link or update User record
    user = db.query(User).filter(
        or_(
            User.usn_or_employee_id == student.usn,
            User.username == student.usn.lower(),
            User.email == student.gmail
        )
    ).first()

    if user:
        user.password_hash = student.password_hash
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
            password_hash=student.password_hash,
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

    # Dispatch welcome & admin notification (non-blocking)
    try:
        EmailNotificationService.notify_admin_and_user_creation(
            db=db,
            new_user=user,
            created_by_role="Self-Registered Student",
        )
    except Exception as notif_err:
        print(f"[!] Student registration notification note: {notif_err}")

    dept_name = student.department.name if student.department else "Computer Science and Engineering"
    token_data = {
        "sub": user.username,
        "role": "student",
        "user_id": user.id,
        "usn": student.usn
    }
    access_token = create_access_token(data=token_data)

    user_info = {
        "id": user.id,
        "student_id": student.id,
        "name": student.name,
        "full_name": student.name,
        "usn": student.usn,
        "gmail": student.gmail,
        "email": student.gmail,
        "semester": student.semester,
        "section": student.section,
        "department": dept_name,
        "role": "student"
    }

    return {
        "success": True,
        "message": "OTP verified successfully! Account activated.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }

# Alias: POST /api/auth/student/verify-email
@router.post("/verify-email")
def verify_email_alias(req: StudentVerifyEmailRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found.")

    if req.password:
        if len(req.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
        if req.confirm_password and req.password != req.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match.")
        if student.phone and student.phone.strip() and student.phone.strip() in req.password:
            raise HTTPException(
                status_code=400,
                detail="For security, you cannot use your phone number as a password."
            )
        student.password_hash = get_password_hash(req.password)
        db.commit()

    return verify_otp(VerifyOTPRequest(usn=req.usn, otp=req.otp), db)

# Resend OTP
@router.post("/resend-otp")
def resend_otp(req: StudentResendOTPRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found.")

    if student.registration_status == "Registered":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is already registered.")

    now = datetime.datetime.utcnow()
    if (student.otp_resend_count or 0) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum OTP resend limit reached. Please wait or contact Admin."
        )

    if student.otp_last_sent_at:
        diff = (now - student.otp_last_sent_at).total_seconds()
        if diff < 30:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {int(30 - diff)} more seconds before requesting another code."
            )

    otp = f"{secrets.randbelow(900000) + 100000:06d}"
    student.otp_code = otp
    student.otp_expires_at = now + datetime.timedelta(minutes=10)
    student.otp_resend_count = (student.otp_resend_count or 0) + 1
    student.otp_last_sent_at = now
    db.commit()

    delivery = _dispatch_student_otp_email(student, otp, purpose="Student Account Registration")

    response_payload = {
        "success": True,
        "message": "A new verification code has been sent to your registered Gmail address.",
        "usn": student.usn,
        "simulation_mode": delivery["simulation_mode"],
    }
    if delivery.get("demo_otp"):
        response_payload["demo_otp"] = delivery["demo_otp"]
    return response_payload

# 4. POST /api/auth/student/login
@router.post("/login", response_model=StudentAuthResponse)
def student_login(req: StudentLoginRequest, db: Session = Depends(get_db)):
    ident = req.login_usn
    if not ident:
        raise HTTPException(status_code=400, detail="USN is required.")
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
            detail="Student record not found. Please verify your USN."
        )

    if student.registration_status != "Registered" or student.email_verification_status != "Verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has not been registered or verified yet. Please register your account first."
        )

    user = student.user
    valid = False
    if user and user.password_hash and verify_password(password, user.password_hash):
        valid = True
    elif student.password_hash and verify_password(password, student.password_hash):
        valid = True

    if not valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password.")

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

# 4.1 POST /api/auth/student/forgot-password
@router.post("/forgot-password")
def student_forgot_password(req: StudentForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found. Please contact your Admin."
        )

    if not student.gmail or "@" not in student.gmail:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No registered Gmail address found for this USN. Please contact your Admin."
        )

    # Generate secure 6-digit recovery OTP
    otp = f"{secrets.randbelow(900000) + 100000:06d}"
    now = datetime.datetime.utcnow()

    student.otp_code = otp
    student.otp_expires_at = now + datetime.timedelta(minutes=10)
    student.otp_resend_count = 0
    student.otp_last_sent_at = now
    db.commit()

    delivery = _dispatch_student_otp_email(student, otp, purpose="Password Recovery")

    response_payload = {
        "success": True,
        "message": f"Password recovery OTP has been sent to your registered Gmail address ({mask_email(student.gmail)}).",
        "usn": student.usn,
        "masked_gmail": mask_email(student.gmail),
        "gmail": student.gmail,
        "simulation_mode": delivery["simulation_mode"],
    }
    if delivery.get("demo_otp"):
        response_payload["demo_otp"] = delivery["demo_otp"]
    return response_payload

# 4.2 POST /api/auth/student/verify-recovery-otp
@router.post("/verify-recovery-otp")
def student_verify_recovery_otp(req: StudentVerifyRecoveryOTPRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found. Please contact your Admin."
        )

    if not student.otp_code or student.otp_code != req.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please check your Gmail and try again."
        )

    now = datetime.datetime.utcnow()
    if student.otp_expires_at and now > student.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired. Please request a new recovery code."
        )

    return {
        "success": True,
        "message": "OTP verified successfully. You may now enter your new password.",
        "usn": student.usn
    }

# 4.3 POST /api/auth/student/reset-password
@router.post("/reset-password")
def student_reset_password(req: StudentResetPasswordRequest, db: Session = Depends(get_db)):
    clean_usn = req.usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found. Please contact your Admin."
        )

    if not student.otp_code or student.otp_code != req.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code."
        )

    now = datetime.datetime.utcnow()
    if student.otp_expires_at and now > student.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired. Please request a new recovery code."
        )

    # Check phone number policy
    if student.phone and student.phone.strip() and student.phone.strip() in req.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="For security, you cannot use your phone number as a password."
        )

    hashed_pw = get_password_hash(req.new_password)
    student.password_hash = hashed_pw
    student.otp_code = None
    student.otp_expires_at = None

    # Update associated User account if exists
    user = db.query(User).filter(
        or_(
            User.usn_or_employee_id == student.usn,
            User.username == student.usn.lower(),
            User.email == student.gmail
        )
    ).first()
    if user:
        user.password_hash = hashed_pw
        user.account_status = "Approved"
        user.is_active = True

    db.commit()

    return {
        "success": True,
        "message": "Your password has been reset successfully. Please login with your new password.",
        "usn": student.usn
    }

# 5. GET /api/auth/student/profile (Section 6: Full Student Dashboard Profile)
@router.get("/profile", response_model=StudentDashboardProfile)
def get_student_dashboard_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify caller is a student or Admin/HOD viewing student
    student = None
    if current_user.role.lower() == "student":
        student = current_user.student_profile
        if not student and current_user.usn_or_employee_id:
            student = db.query(Student).filter(Student.usn == current_user.usn_or_employee_id).first()
    else:
        # Fallback for staff
        student = db.query(Student).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student academic profile not found.")

    dept_name = student.department.name if student.department else "Computer Science and Engineering"

    # 1. Timetable for student's semester & section
    timetable_records = db.query(Timetable).filter(
        Timetable.semester == student.semester,
        Timetable.section == student.section
    ).all()
    timetable_data = [
        {
            "id": t.id,
            "day": t.day,
            "day_of_week": t.day,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "subject_name": getattr(t.subject, "subject_name", getattr(t.subject, "name", "Class")) if t.subject else "Class",
            "subject_code": getattr(t.subject, "subject_code", getattr(t.subject, "code", "")) if t.subject else "",
            "room_number": getattr(t.room, "room_name", getattr(t.room, "room_number", "")) if t.room else "",
            "teacher_name": getattr(t.teacher, "name", "") if t.teacher else ""
        }
        for t in timetable_records
    ]

    # 2. IA Marks (First Internal Assessment)
    marks_records = db.query(Mark).filter(
        or_(Mark.student_id == student.id, Mark.usn == student.usn)
    ).all()
    marks_data = [
        {
            "id": m.id,
            "subject_name": m.subject_name or (getattr(m.subject, "subject_name", getattr(m.subject, "name", "")) if m.subject else ""),
            "subject_code": m.subject_code or (getattr(m.subject, "subject_code", getattr(m.subject, "code", "")) if m.subject else ""),
            "assessment": getattr(m, "ia_number", None) or getattr(m, "assessment_name", None) or getattr(m, "assessment", "IA-1"),
            "raw_marks": getattr(m, "obtained_marks", getattr(m, "raw_marks", None)),
            "raw_max_marks": getattr(m, "maximum_marks", getattr(m, "raw_max_marks", 30.0)),
            "marks": getattr(m, "obtained_marks", getattr(m, "marks", None)),
            "max_marks": getattr(m, "maximum_marks", getattr(m, "max_marks", 30.0)),
            "scaled_marks": getattr(m, "scaled_marks", None),
            "scaled_max_marks": getattr(m, "scaled_max_marks", None),
            "status": m.status or ("Absent" if getattr(m, "is_absent", False) else "Present"),
            "is_absent": bool(getattr(m, "is_absent", False))
        }
        for m in marks_records
    ]

    # 3. Attendance Summary
    attended_count = db.query(StudentAttendance).filter(
        StudentAttendance.student_id == student.id,
        StudentAttendance.status.ilike("present")
    ).count()
    total_attendance = db.query(StudentAttendance).filter(
        StudentAttendance.student_id == student.id
    ).count()
    pct = round((attended_count / total_attendance * 100), 1) if total_attendance > 0 else 85.0
    attendance_data = {
        "attended_classes": attended_count or 42,
        "total_classes": total_attendance or 48,
        "percentage": pct,
        "status": "Good Standing" if pct >= 75 else "Shortage Warning"
    }

    # 4. Upcoming Events
    today_date = datetime.date.today()
    events_records = db.query(Event).filter(Event.event_date >= today_date).limit(5).all()
    events_data = [
        {
            "id": e.id,
            "title": e.title,
            "event_date": e.event_date.isoformat() if hasattr(e.event_date, "isoformat") else str(e.event_date),
            "venue": e.venue,
            "category": e.category
        }
        for e in events_records
    ]

    # 5. Student Activities & Achievements
    activity_records = db.query(StudentActivity).filter(
        StudentActivity.student_id == student.id
    ).all()
    activities_data = [
        {
            "id": a.id,
            "title": a.title,
            "category": getattr(a, "activity_type", getattr(a, "category", "General")),
            "status": a.status,
            "activity_date": a.activity_date.isoformat() if getattr(a, "activity_date", None) and hasattr(a.activity_date, "isoformat") else ""
        }
        for a in activity_records
    ]

    # 6. Bus Route Assignment
    bus_data = None
    bus_assign = db.query(StudentBusAssignment).filter(StudentBusAssignment.student_id == student.id).first()
    if bus_assign and bus_assign.route:
        bus_data = {
            "route_name": bus_assign.route.route_name,
            "route_number": bus_assign.route.route_number,
            "bus_number": bus_assign.route.bus_number,
            "stop_name": bus_assign.stop.stop_name if bus_assign.stop else "Campus Stop",
            "pickup_time": bus_assign.stop.pickup_time if bus_assign.stop else bus_assign.route.departure_time,
            "drop_time": bus_assign.stop.drop_time if bus_assign.stop else "05:00 PM",
            "driver_name": bus_assign.route.driver_name,
            "driver_phone": bus_assign.route.driver_phone,
            "transport_status": bus_assign.transport_status or "Using Bus"
        }

    return StudentDashboardProfile(
        name=student.name,
        usn=student.usn,
        gmail=student.gmail,
        department=dept_name,
        semester=student.semester,
        section=student.section,
        timetable=timetable_data,
        attendance=attendance_data,
        ia_marks=marks_data,
        events=events_data,
        activities=activities_data,
        bus_route=bus_data
    )
