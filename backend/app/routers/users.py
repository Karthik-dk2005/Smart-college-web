from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.security import get_password_hash
from app.utils.response import success_response

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Admin-only: Create a new user."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )

    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        role=payload.role.lower(),
        phone=payload.phone,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    user_data = UserOut.model_validate(user).model_dump()
    return success_response(data=user_data, message="User created successfully", status_code=status.HTTP_201_CREATED)


@router.get("")
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: List all users with optional role and search filters."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.lower())
    if search:
        search_filter = f"%{search}%"
        query = query.filter((User.name.ilike(search_filter)) | (User.email.ilike(search_filter)))

    users = query.offset(offset).limit(limit).all()
    user_list = [UserOut.model_validate(u).model_dump() for u in users]
    return success_response(data=user_list, message="Users retrieved successfully")


@router.get("/{user_id}")
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single user by ID (Admin, HOD, or self)."""
    if current_user.role not in ("admin", "hod") and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user profile"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_data = UserOut.model_validate(user).model_dump()
    return success_response(data=user_data, message="User details retrieved")


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user profile (Admin can update all; users can update own name/phone/password)."""
    is_admin = current_user.role == "admin"
    is_self = current_user.id == user_id

    if not (is_admin or is_self):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this user account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.password is not None and payload.password.strip():
        user.password_hash = get_password_hash(payload.password)

    # Only admin can change role or activation state
    if is_admin:
        if payload.role is not None:
            user.role = payload.role.lower()
        if payload.is_active is not None:
            user.is_active = payload.is_active

    db.commit()
    db.refresh(user)

    user_data = UserOut.model_validate(user).model_dump()
    return success_response(data=user_data, message="User updated successfully")


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Admin-only: Delete user."""
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own admin account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(user)
    db.commit()
    return success_response(data={"id": user_id}, message="User deleted successfully")
