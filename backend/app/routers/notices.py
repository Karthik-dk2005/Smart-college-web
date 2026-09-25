from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.notice import Notice
from app.models.user import User
from app.schemas.notice import NoticeCreate, NoticeUpdate, NoticeOut
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.response import success_response

router = APIRouter(prefix="/api/notices", tags=["Notices"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_notice(
    payload: NoticeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "faculty"))
):
    """Admin, HOD, and Faculty: Post a new department notice."""
    target_role_clean = payload.target_role.lower() if payload.target_role else "all"

    notice = Notice(
        title=payload.title,
        description=payload.description,
        created_by=current_user.id,
        target_role=target_role_clean,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    data = NoticeOut.model_validate(notice).model_dump()
    return success_response(data=data, message="Notice published successfully", status_code=status.HTTP_201_CREATED)


@router.get("")
def list_notices(
    target_role: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List notices. Students see notices targeted to 'all' or 'student'."""
    query = db.query(Notice)

    if current_user.role == "student":
        query = query.filter(Notice.target_role.in_(["all", "student"]))
    elif target_role:
        query = query.filter(Notice.target_role.in_([target_role.lower(), "all"]))

    notices = query.order_by(Notice.created_at.desc()).offset(offset).limit(limit).all()
    data = [NoticeOut.model_validate(n).model_dump() for n in notices]
    return success_response(data=data, message="Notices retrieved successfully")


@router.get("/{notice_id}")
def get_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single notice details by ID."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notice not found")

    data = NoticeOut.model_validate(notice).model_dump()
    return success_response(data=data, message="Notice details retrieved")


@router.put("/{notice_id}")
def update_notice(
    notice_id: int,
    payload: NoticeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "faculty"))
):
    """Admin, HOD, or author: Update a notice."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notice not found")

    if current_user.role not in ("admin", "hod") and notice.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update notices created by yourself"
        )

    if payload.title is not None:
        notice.title = payload.title
    if payload.description is not None:
        notice.description = payload.description
    if payload.target_role is not None:
        notice.target_role = payload.target_role.lower()

    notice.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(notice)

    data = NoticeOut.model_validate(notice).model_dump()
    return success_response(data=data, message="Notice updated successfully")


@router.delete("/{notice_id}")
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "faculty"))
):
    """Admin, HOD, or author: Delete a notice."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notice not found")

    if current_user.role not in ("admin", "hod") and notice.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete notices created by yourself"
        )

    db.delete(notice)
    db.commit()
    return success_response(data={"id": notice_id}, message="Notice deleted successfully")
