from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.teacher import Teacher
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.schemas.auth import UserApproveRequest
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.security import get_password_hash
from app.utils.response import success_response

router = APIRouter(prefix="/api/users", tags=["Users"])


def serialize_user(user: User) -> dict:
    dept_name = user.department.name if user.department else None
    return {
        "id": user.id,
        "name": user.full_name or user.name or user.username,
        "full_name": user.full_name or user.name,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "phone": user.mobile_number or user.phone,
        "mobile_number": user.mobile_number or user.phone,
        "usn_or_employee_id": user.usn_or_employee_id,
        "department_id": user.department_id,
        "department_name": dept_name,
        "semester": user.semester,
        "section": user.section,
        "designation": user.designation,
        "account_status": getattr(user, "account_status", "Approved") or "Approved",
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """
    Create a new user.
    - Admin: can create Admin, HOD, Teacher, Student for any department.
    - HOD: can create Teacher, Student for their own department only.
    """
    full_name = (payload.full_name or payload.name or "").strip()
    if not full_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is required.")

    clean_email = payload.email.lower().strip()
    clean_role = payload.role.lower().strip()
    if clean_role == "faculty":
        clean_role = "teacher"

    is_admin = current_user.role == "admin"
    is_hod = current_user.role == "hod"

    if is_hod:
        if clean_role in ("admin", "hod"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs cannot create Admin or other HOD accounts."
            )
        if payload.department_id and payload.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"HODs cannot create users for other departments. You can only create users for department #{current_user.department_id}."
            )
        # Force department to HOD's department
        target_dept = current_user.department_id
    else:
        target_dept = payload.department_id

    # Check duplicate email
    if db.query(User).filter(func.lower(User.email) == clean_email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    # Determine username
    clean_username = (payload.username or clean_email.split("@")[0]).lower().strip()
    if db.query(User).filter(func.lower(User.username) == clean_username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Username '{clean_username}' is already taken.")

    # Check USN / Emp ID
    usn_or_emp = (payload.usn_or_employee_id or "").strip()
    if usn_or_emp and db.query(User).filter(func.upper(User.usn_or_employee_id) == usn_or_emp.upper()).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="USN or Employee ID already registered.")

    phone_val = (payload.mobile_number or payload.phone or "").strip() or None

    user = User(
        full_name=full_name,
        name=full_name,
        username=clean_username,
        email=clean_email,
        password_hash=get_password_hash(payload.password),
        role=clean_role,
        department_id=target_dept,
        semester=payload.semester if clean_role == "student" else None,
        section=(payload.section or "A").upper() if clean_role == "student" else None,
        designation=payload.designation,
        mobile_number=phone_val,
        phone=phone_val,
        usn_or_employee_id=usn_or_emp or None,
        account_status=payload.account_status or "Approved",
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Link profile
    if clean_role == "student":
        final_usn = usn_or_emp or f"4MN24CS{user.id:03d}"
        if not user.usn_or_employee_id:
            user.usn_or_employee_id = final_usn
            db.commit()
        st = Student(
            usn=final_usn,
            name=full_name,
            email=clean_email,
            phone=phone_val,
            semester=payload.semester or 5,
            section=(payload.section or "A").upper(),
            department_id=target_dept,
            user_id=user.id
        )
        db.add(st)
        db.commit()

    elif clean_role in ("teacher", "hod"):
        final_emp = usn_or_emp or f"FAC-CSE-{user.id:03d}"
        if not user.usn_or_employee_id:
            user.usn_or_employee_id = final_emp
            db.commit()
        fc = Faculty(
            employee_id=final_emp,
            name=full_name,
            email=clean_email,
            phone=phone_val,
            department_id=target_dept,
            user_id=user.id,
            designation=payload.designation or ("Professor & HOD" if clean_role == "hod" else "Assistant Professor")
        )
        db.add(fc)
        if clean_role == "teacher":
            tc = Teacher(
                employee_id=final_emp,
                name=full_name,
                email=clean_email,
                phone=phone_val,
                department_id=target_dept,
                designation=payload.designation or "Assistant Professor"
            )
            db.add(tc)
        db.commit()

    return success_response(
        data=serialize_user(user),
        message="User account created successfully",
        status_code=status.HTTP_201_CREATED
    )


@router.get("")
def list_users(
    role: Optional[str] = None,
    department_id: Optional[int] = None,
    account_status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """
    List all users with filters.
    - Admin: can view users across all departments and roles.
    - HOD: restricted to users within their own department; cannot view Admin accounts.
    """
    query = db.query(User)

    if current_user.role == "hod":
        if current_user.department_id:
            query = query.filter(User.department_id == current_user.department_id)
        # HOD cannot view admin accounts
        query = query.filter(User.role != "admin")
    elif department_id is not None:
        query = query.filter(User.department_id == department_id)

    if role:
        r_clean = role.lower()
        if r_clean == "teacher":
            query = query.filter(User.role.in_(["teacher", "faculty"]))
        else:
            query = query.filter(User.role == r_clean)

    if account_status:
        query = query.filter(User.account_status == account_status)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (User.full_name.ilike(search_filter)) |
            (User.name.ilike(search_filter)) |
            (User.email.ilike(search_filter)) |
            (User.username.ilike(search_filter)) |
            (User.usn_or_employee_id.ilike(search_filter))
        )

    users = query.order_by(User.id.desc()).offset(offset).limit(limit).all()
    user_list = [serialize_user(u) for u in users]
    return success_response(data=user_list, message="Users retrieved successfully")


@router.get("/{user_id}")
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single user by ID with authorization checks."""
    is_admin = current_user.role == "admin"
    is_hod = current_user.role == "hod"
    is_self = current_user.id == user_id

    if not (is_admin or is_hod or is_self):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user profile"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if is_hod and not is_self:
        if user.department_id != current_user.department_id or user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs cannot access user records outside their department."
            )

    return success_response(data=serialize_user(user), message="User details retrieved")


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update user profile.
    - Admin: can update all fields including role, status, and department.
    - HOD: can update students/teachers in their department.
    - Self: can update name, mobile_number, and password.
    """
    is_admin = current_user.role == "admin"
    is_hod = current_user.role == "hod"
    is_self = current_user.id == user_id

    if not (is_admin or is_hod or is_self):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this user account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if is_hod and not is_self:
        if user.department_id != current_user.department_id or user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs can only modify users within their department."
            )

    # Update basic profile
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
        user.name = payload.full_name.strip()
    elif payload.name is not None:
        user.name = payload.name.strip()
        user.full_name = payload.name.strip()

    phone_val = payload.mobile_number or payload.phone
    if phone_val is not None:
        user.mobile_number = phone_val.strip()
        user.phone = phone_val.strip()

    if payload.password is not None and payload.password.strip():
        user.password_hash = get_password_hash(payload.password.strip())

    if is_admin or is_hod:
        if payload.email is not None and payload.email.lower().strip() != user.email:
            existing = db.query(User).filter(func.lower(User.email) == payload.email.lower().strip()).first()
            if existing:
                raise HTTPException(status_code=409, detail="Email is already used by another user.")
            user.email = payload.email.lower().strip()

        if payload.username is not None and payload.username.lower().strip() != (user.username or ""):
            existing = db.query(User).filter(func.lower(User.username) == payload.username.lower().strip()).first()
            if existing:
                raise HTTPException(status_code=409, detail="Username is already taken.")
            user.username = payload.username.lower().strip()

        if payload.usn_or_employee_id is not None:
            user.usn_or_employee_id = payload.usn_or_employee_id.strip()

        if payload.designation is not None:
            user.designation = payload.designation.strip()

        if payload.semester is not None:
            user.semester = payload.semester

        if payload.section is not None:
            user.section = payload.section.strip().upper()

        if payload.account_status is not None:
            user.account_status = payload.account_status
            if payload.account_status == "Approved":
                user.is_active = True
            elif payload.account_status in ("Rejected", "Suspended"):
                user.is_active = False

        if payload.is_active is not None:
            user.is_active = payload.is_active

    # Admin only permissions
    if is_admin:
        if payload.role is not None:
            user.role = payload.role.lower().strip()
        if payload.department_id is not None:
            user.department_id = payload.department_id

    db.commit()
    db.refresh(user)

    return success_response(data=serialize_user(user), message="User updated successfully")


@router.put("/{user_id}/approve")
def approve_user(
    user_id: int,
    payload: UserApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """
    Admin & HOD: Approve, Reject, or Suspend a user account.
    HOD can only approve/reject students and teachers in their own department.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.role == "hod":
        if user.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs can only approve users from their own department."
            )
        if user.role in ("admin", "hod"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs cannot modify Admin or HOD accounts."
            )

    new_status = payload.status.capitalize()
    if new_status not in ("Approved", "Rejected", "Suspended", "Pending"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be one of: 'Approved', 'Rejected', 'Suspended', 'Pending'"
        )

    user.account_status = new_status
    if new_status == "Approved":
        user.is_active = True
    elif new_status in ("Rejected", "Suspended"):
        user.is_active = False

    db.commit()
    db.refresh(user)

    return success_response(
        data=serialize_user(user),
        message=f"User account has been {new_status.lower()} successfully."
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """
    Delete user.
    - Admin: can delete any user except self.
    - HOD: can delete students and teachers in their department.
    """
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own user account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.role == "hod":
        if user.department_id != current_user.department_id or user.role in ("admin", "hod"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs can only delete students or teachers in their own department."
            )

    db.delete(user)
    db.commit()
    return success_response(data={"id": user_id}, message="User deleted successfully")
