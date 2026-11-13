import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.teacher import Teacher
from app.models.department import Department
from app.utils.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.config import settings


class AuthService:
    @staticmethod
    def register_user(
        db: Session,
        full_name: str,
        email: str,
        password: str,
        role: str,
        username: Optional[str] = None,
        mobile_number: Optional[str] = None,
        usn_or_employee_id: Optional[str] = None,
        department_id: Optional[int] = None,
        semester: Optional[int] = None,
        section: Optional[str] = None,
        designation: Optional[str] = None,
        account_status: str = "Pending",
        is_active: bool = False,
    ) -> User:
        clean_email = email.lower().strip()
        role_clean = role.lower().strip()
        if role_clean == "faculty":
            role_clean = "teacher"

        # Check duplicates
        if db.query(User).filter(func.lower(User.email) == clean_email).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email address already exists.")

        clean_username = (username or clean_email.split("@")[0]).lower().strip()
        if db.query(User).filter(func.lower(User.username) == clean_username).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Username '{clean_username}' is already taken.")

        usn_val = (usn_or_employee_id or "").strip()
        if usn_val:
            if db.query(User).filter(func.upper(User.usn_or_employee_id) == usn_val.upper()).first():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="USN or Employee ID is already registered.")

        if not department_id:
            dept = db.query(Department).first()
            department_id = dept.id if dept else 1

        phone_val = (mobile_number or "").strip() or None

        user = User(
            full_name=full_name.strip(),
            name=full_name.strip(),
            username=clean_username,
            email=clean_email,
            password_hash=get_password_hash(password),
            role=role_clean,
            department_id=department_id,
            semester=semester if role_clean == "student" else None,
            section=section.upper() if (section and role_clean == "student") else None,
            designation=designation if role_clean in ("teacher", "hod") else None,
            mobile_number=phone_val,
            phone=phone_val,
            usn_or_employee_id=usn_val or None,
            account_status=account_status,
            is_active=is_active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Link profiles
        if role_clean == "student":
            final_usn = usn_val or f"4MN24CS{user.id:03d}"
            if not user.usn_or_employee_id:
                user.usn_or_employee_id = final_usn
                db.commit()
            student = Student(
                usn=final_usn,
                name=user.full_name,
                email=user.email,
                phone=phone_val,
                semester=semester or 5,
                section=(section or "A").upper(),
                department_id=department_id,
                user_id=user.id
            )
            db.add(student)
            db.commit()

        elif role_clean in ("teacher", "hod"):
            final_emp = usn_val or f"FAC-CSE-{user.id:03d}"
            if not user.usn_or_employee_id:
                user.usn_or_employee_id = final_emp
                db.commit()
            fac = Faculty(
                employee_id=final_emp,
                name=user.full_name,
                email=user.email,
                phone=phone_val,
                department_id=department_id,
                user_id=user.id,
                designation=designation or ("Professor & HOD" if role_clean == "hod" else "Assistant Professor")
            )
            db.add(fac)
            if role_clean == "teacher":
                teacher = Teacher(
                    name=user.full_name,
                    email=user.email,
                    department_id=department_id,
                    user_id=user.id
                )
                db.add(teacher)
            db.commit()

        return user

    @staticmethod
    def authenticate_user(
        db: Session,
        identifier: str,
        password: str,
        remember_me: bool = False
    ) -> Dict[str, Any]:
        ident = identifier.strip()
        user = db.query(User).filter(
            (func.lower(User.email) == ident.lower()) |
            (func.lower(User.username) == ident.lower()) |
            (func.upper(User.usn_or_employee_id) == ident.upper())
        ).first()

        if not user:
            student = db.query(Student).filter(func.upper(Student.usn) == ident.upper()).first()
            if student and student.user:
                user = student.user

        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password."
            )

        acc_status = getattr(user, "account_status", "Approved") or "Approved"
        if acc_status == "Pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account registration is pending approval by your Department HOD or Administrator."
            )
        if acc_status == "Rejected":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account registration was rejected. Please contact department administration."
            )
        if acc_status == "Suspended" or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your user account is suspended or inactive."
            )

        role_clean = user.role.lower()
        if role_clean == "faculty":
            role_clean = "teacher"

        token_data = {
            "sub": user.email,
            "role": role_clean,
            "user_id": user.id,
            "name": user.full_name or user.name or user.username,
            "username": user.username,
        }

        expires = timedelta(days=7) if remember_me else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(token_data, expires_delta=expires)
        refresh_token = create_refresh_token(token_data)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": role_clean,
            "user_id": user.id,
            "name": user.full_name or user.name or user.username,
            "full_name": user.full_name or user.name,
            "username": user.username,
            "email": user.email,
            "account_status": acc_status,
        }

    @staticmethod
    def generate_password_reset(db: Session, email: str) -> Optional[str]:
        clean_email = email.lower().strip()
        user = db.query(User).filter(func.lower(User.email) == clean_email).first()
        if user and user.is_active:
            token = secrets.token_urlsafe(32)
            user.reset_token = token
            user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
            db.commit()
            print(f"[*] Password reset link: http://localhost:5173/reset-password?token={token}")
            return token
        return None

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> bool:
        if not token:
            raise HTTPException(status_code=400, detail="Reset token is required.")

        user = db.query(User).filter(User.reset_token == token.strip()).first()
        if not user or not user.reset_token_expires_at or user.reset_token_expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

        user.password_hash = get_password_hash(new_password)
        user.reset_token = None
        user.reset_token_expires_at = None
        db.commit()
        return True

