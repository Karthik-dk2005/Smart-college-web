from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict

from app.database import get_db
from app.models import Department, User
from app.schemas import DepartmentCreate, DepartmentResponse
from app.dependencies import get_current_user, require_role
from app.utils.response import success_response

router = APIRouter(prefix="/api/departments", tags=["Departments"])


def format_department(d: Department) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "code": d.code,
        "description": d.description,
        "status": d.status or "active",
    }


@router.get("")
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all departments."""
    depts = db.query(Department).order_by(Department.name).all()
    data = [format_department(d) for d in depts]
    return success_response(data=data, message=f"Retrieved {len(data)} departments")


@router.get("/{dept_id}")
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single department details."""
    d = db.query(Department).filter(Department.id == dept_id).first()
    if not d:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {dept_id} not found."
        )
    return success_response(data=format_department(d))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Create a new academic department (Admin only)."""
    if payload.code:
        existing = db.query(Department).filter(Department.code == payload.code.upper()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Department with code '{payload.code.upper()}' already exists."
            )

    dept = Department(
        name=payload.name,
        code=payload.code.upper() if payload.code else None,
        description=payload.description,
        status=payload.status or "active"
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return success_response(data=format_department(dept), message="Department created successfully")
