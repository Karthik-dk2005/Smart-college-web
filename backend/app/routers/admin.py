from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models import User, Student, Teacher, AuditLog, Session as SessionModel, Room, Subject
from app.schemas import UserRegister, ApiResponse, AuditLogOut, UserOut
from app.dependencies import require_role, get_client_ip
from app.auth import get_password_hash
from app.utils import log_audit

router = APIRouter(prefix="/api/admin", tags=["Admin Management"])


@router.get("/users", response_model=Dict[str, Any])
def list_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Master user directory inspection (Admin only)."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.lower())
    users = query.all()
    results = [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "phone": u.phone,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]
    return {"success": True, "count": len(results), "users": results}


@router.post("/users", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    req: UserRegister,
    request: Request,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Create user account with specific role (Admin only)."""
    if db.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(status_code=409, detail="User with this email already exists.")

    new_user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=req.role.lower(),
        phone=req.phone,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(
        db=db,
        action="ADMIN_CREATE_USER",
        module="Admin",
        user_id=current_user.id,
        record_id=str(new_user.id),
        details=f"Admin created {new_user.role} user {new_user.email}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(
        success=True,
        message="User account created successfully.",
        data={"user_id": new_user.id, "email": new_user.email, "role": new_user.role}
    )


@router.put("/users/{user_id}/status", response_model=ApiResponse)
def toggle_user_status(
    user_id: int,
    is_active: bool,
    request: Request,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Activate or deactivate user account (Admin only)."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")

    u.is_active = is_active
    db.commit()

    log_audit(
        db=db,
        action="TOGGLE_USER_STATUS",
        module="Admin",
        user_id=current_user.id,
        record_id=str(user_id),
        details=f"Admin set active={is_active} for {u.email}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message=f"User status updated to {'Active' if is_active else 'Inactive'}.")


@router.delete("/users/{user_id}", response_model=ApiResponse)
def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Delete a user account (Admin only)."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")

    email = u.email
    db.delete(u)
    db.commit()

    log_audit(
        db=db,
        action="DELETE_USER",
        module="Admin",
        user_id=current_user.id,
        record_id=str(user_id),
        details=f"Admin deleted user {email}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message=f"User {email} deleted successfully.")


@router.get("/audit-logs", response_model=Dict[str, Any])
def get_audit_logs(
    limit: int = 50,
    module: Optional[str] = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Immutable audit trail of all administrative and academic mutations."""
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    if module:
        query = query.filter(AuditLog.module == module)
    logs = query.limit(limit).all()

    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "action": l.action,
            "module": l.module,
            "record_id": l.record_id,
            "details": l.details,
            "user_email": l.user.email if l.user else "System",
            "ip_address": l.ip_address,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        })
    return {"success": True, "count": len(results), "audit_logs": results}


@router.get("/system-stats", response_model=Dict[str, Any])
def get_system_stats(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Comprehensive university intelligence statistics."""
    return {
        "success": True,
        "stats": {
            "total_users": db.query(User).count(),
            "total_students": db.query(Student).count(),
            "total_teachers": db.query(Teacher).count(),
            "total_subjects": db.query(Subject).count(),
            "total_rooms": db.query(Room).count(),
            "total_sessions": db.query(SessionModel).count(),
            "total_audit_logs": db.query(AuditLog).count()
        }
    }
