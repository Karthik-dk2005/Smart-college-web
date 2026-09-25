from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.department import Department
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.response import success_response

router = APIRouter(prefix="/api/departments", tags=["Departments"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Admin-only: Create a department."""
    existing = db.query(Department).filter(
        (Department.code == payload.code.upper()) | (Department.name == payload.name)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department with this code or name already exists"
        )

    dept = Department(
        name=payload.name,
        code=payload.code.upper(),
        description=payload.description,
        hod_id=payload.hod_id
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    data = DepartmentOut.model_validate(dept).model_dump()
    return success_response(data=data, message="Department created successfully", status_code=status.HTTP_201_CREATED)


@router.get("")
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all departments."""
    departments = db.query(Department).all()
    data = [DepartmentOut.model_validate(d).model_dump() for d in departments]
    return success_response(data=data, message="Departments retrieved successfully")


@router.get("/{department_id}")
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get department details by ID."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    data = DepartmentOut.model_validate(dept).model_dump()
    return success_response(data=data, message="Department details retrieved")


@router.put("/{department_id}")
def update_department(
    department_id: int,
    payload: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod"))
):
    """Admin & HOD: Update department information."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    if payload.name is not None:
        dept.name = payload.name
    if payload.code is not None:
        dept.code = payload.code.upper()
    if payload.description is not None:
        dept.description = payload.description
    if payload.hod_id is not None:
        dept.hod_id = payload.hod_id

    db.commit()
    db.refresh(dept)

    data = DepartmentOut.model_validate(dept).model_dump()
    return success_response(data=data, message="Department updated successfully")


@router.delete("/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Admin-only: Delete department."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    db.delete(dept)
    db.commit()
    return success_response(data={"id": department_id}, message="Department deleted successfully")
