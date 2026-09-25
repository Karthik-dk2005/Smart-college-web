from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import StudyMaterial, Subject, User
from app.schemas import MaterialCreate, MaterialUpdate, MaterialOut, ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role, get_client_ip
from app.utils import log_audit_event

router = APIRouter(prefix="/api/materials", tags=["Study Materials"])


@router.get("", response_model=List[MaterialOut])
def get_materials(
    subject_id: Optional[int] = Query(None, description="Filter materials by subject ID"),
    unit: Optional[str] = Query(None, description="Filter materials by unit"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all study materials, optionally filtered by subject or unit."""
    query = db.query(StudyMaterial)
    if subject_id is not None:
        query = query.filter(StudyMaterial.subject_id == subject_id)
    if unit is not None:
        query = query.filter(StudyMaterial.unit.ilike(f"%{unit}%"))
    
    return query.order_by(StudyMaterial.created_at.desc()).all()


@router.get("/{id}", response_model=MaterialOut)
def get_material_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details of a specific study material."""
    material = db.query(StudyMaterial).filter(StudyMaterial.id == id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study material with ID {id} not found",
        )
    return material


@router.post("", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def create_material(
    payload: MaterialCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["teacher", "hod", "admin"])),
):
    """Create a new study material (Teacher, HOD, or Admin)."""
    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {payload.subject_id} not found",
        )

    material = StudyMaterial(
        subject_id=payload.subject_id,
        unit=payload.unit,
        title=payload.title,
        description=payload.description,
        material_type=payload.material_type,
        file_url=payload.file_url,
        important_questions_attached=payload.important_questions_attached,
        uploaded_by_id=current_user.id,
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="CREATE_STUDY_MATERIAL",
        module="materials",
        record_id=str(material.id),
        details=f"Uploaded material '{material.title}' for subject {subject.code}",
        ip_address=get_client_ip(request),
    )

    return material


@router.put("/{id}", response_model=MaterialOut)
def update_material(
    id: int,
    payload: MaterialUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["teacher", "hod", "admin"])),
):
    """Update study material details (Teacher, HOD, or Admin)."""
    material = db.query(StudyMaterial).filter(StudyMaterial.id == id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study material with ID {id} not found",
        )

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(material, field, value)

    db.commit()
    db.refresh(material)

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="UPDATE_STUDY_MATERIAL",
        module="materials",
        record_id=str(material.id),
        details=f"Updated material '{material.title}'",
        ip_address=get_client_ip(request),
    )

    return material


@router.delete("/{id}", response_model=ApiResponse)
def delete_material(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role(["teacher", "hod", "admin"])),
):
    """Delete study material entry (Teacher, HOD, or Admin)."""
    material = db.query(StudyMaterial).filter(StudyMaterial.id == id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study material with ID {id} not found",
        )

    title = material.title
    db.delete(material)
    db.commit()

    log_audit_event(
        db=db,
        user_id=current_user.id,
        action="DELETE_STUDY_MATERIAL",
        module="materials",
        record_id=str(id),
        details=f"Deleted study material '{title}'",
        ip_address=get_client_ip(request),
    )

    return ApiResponse(
        success=True,
        message=f"Study material '{title}' deleted successfully",
    )
