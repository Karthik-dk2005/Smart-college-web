from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List, Union

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_token

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Validate Bearer JWT access token and return current active user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise credentials_exception

    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise credentials_exception

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type: access token required",
        )

    sub_val: str = payload.get("sub")
    if not sub_val:
        raise credentials_exception

    from sqlalchemy import or_
    user = db.query(User).filter(
        or_(
            User.email == sub_val,
            User.username == sub_val,
            User.usn_or_employee_id == sub_val
        )
    ).first()
    if not user:
        raise credentials_exception
    account_status = getattr(user, "account_status", "Approved")
    if account_status == "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account registration is pending approval by the Admin or Department HOD."
        )
    if account_status in ("Rejected", "Suspended") or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {account_status.lower() if account_status else 'inactive'}. Please contact administration."
        )
    return user


def require_role(required_role: str):
    """Enforce a single specific role (e.g. admin, hod, faculty, student)."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.lower() != required_role.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: requires {required_role.upper()} role privileges"
            )
        return current_user
    return role_checker


def require_any_role(*allowed_roles):
    """Enforce membership in any of the specified roles (accepts list or varargs)."""
    flattened = []
    for item in allowed_roles:
        if isinstance(item, (list, tuple, set)):
            flattened.extend([str(x).lower() for x in item])
        else:
            flattened.append(str(item).lower())

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.lower() not in flattened:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: requires one of the following roles: {', '.join(flattened)}"
            )
        return current_user
    return role_checker

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Enforce ADMIN role privileges."""
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
    return current_user


def require_hod(current_user: User = Depends(get_current_user)) -> User:
    """Enforce HOD role privileges."""
    if current_user.role.lower() != "hod":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
    return current_user


def require_admin_or_hod(current_user: User = Depends(get_current_user)) -> User:
    """Enforce ADMIN or HOD role privileges. Teachers and Students are blocked."""
    if current_user.role.lower() not in ("admin", "hod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
    return current_user


def get_client_ip(request: Request) -> str:
    """Extract client IP address safely from Request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

