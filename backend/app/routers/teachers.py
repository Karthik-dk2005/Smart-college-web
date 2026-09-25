from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models import Teacher, User, Session as SessionModel, Attendance
from app.schemas import TeacherCreate, TeacherUpdate, TeacherOut, ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role, get_client_ip
from app.auth import get_password_hash
from app.utils import log_audit

router = APIRouter(prefix="/api/teachers", tags=["Teacher Management"])


@router.get("", response_model=Dict[str, Any])
def list_teachers(
    department: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all faculty members."""
    query = db.query(Teacher)
    if department:
        query = query.filter(Teacher.department == department)
    teachers = query.all()
    
    results = []
    for t in teachers:
        results.append({
            "id": t.id,
            "faculty_id": t.faculty_id,
            "name": t.user.full_name if t.user else None,
            "email": t.user.email if t.user else None,
            "department": t.department,
            "designation": t.designation,
            "qualification": t.qualification,
            "specialization": t.specialization,
            "office_location": t.office_location,
            "phone": t.user.phone if t.user else None,
            "status": t.status
        })
    return {"success": True, "count": len(results), "teachers": results}


@router.get("/{teacher_id}", response_model=Dict[str, Any])
def get_teacher(
    teacher_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single teacher details."""
    t = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Faculty member not found.")

    return {
        "success": True,
        "teacher": {
            "id": t.id,
            "faculty_id": t.faculty_id,
            "name": t.user.full_name if t.user else None,
            "email": t.user.email if t.user else None,
            "department": t.department,
            "designation": t.designation,
            "qualification": t.qualification,
            "specialization": t.specialization,
            "office_location": t.office_location,
            "phone": t.user.phone if t.user else None,
            "status": t.status
        }
    }


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(
    req: TeacherCreate,
    request: Request,
    current_user: User = Depends(require_any_role("hod", "admin")),
    db: Session = Depends(get_db)
):
    """Add a new teacher/faculty member (HOD and Admin only)."""
    # Check duplicate email
    if db.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(status_code=409, detail="A user with this email address already exists.")

    # Check duplicate faculty ID
    if db.query(Teacher).filter(Teacher.faculty_id == req.faculty_id.upper()).first():
        raise HTTPException(status_code=409, detail=f"Faculty ID {req.faculty_id} already exists.")

    # Create User
    new_user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password or "password123"),
        full_name=req.full_name,
        role="teacher",
        phone=req.phone,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    new_teacher = Teacher(
        user_id=new_user.id,
        faculty_id=req.faculty_id.upper(),
        department=req.department,
        designation=req.designation,
        qualification=req.qualification,
        specialization=req.specialization,
        office_location=req.office_location,
        phone=req.phone,
        status="ACTIVE"
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)

    log_audit(
        db=db,
        action="ADD_TEACHER",
        module="Faculty",
        user_id=current_user.id,
        record_id=str(new_teacher.id),
        details=f"HOD added faculty: {req.full_name} ({req.faculty_id})",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(
        success=True,
        message="Teacher added successfully.",
        data={"teacher_id": new_teacher.id, "faculty_id": new_teacher.faculty_id, "email": new_user.email}
    )


@router.put("/{teacher_id}", response_model=ApiResponse)
def update_teacher(
    teacher_id: int,
    req: TeacherUpdate,
    request: Request,
    current_user: User = Depends(require_any_role("hod", "admin")),
    db: Session = Depends(get_db)
):
    """Update faculty member details (HOD & Admin only)."""
    t = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Faculty member not found.")

    if req.full_name and t.user:
        t.user.full_name = req.full_name
    if req.designation:
        t.designation = req.designation
    if req.qualification:
        t.qualification = req.qualification
    if req.specialization:
        t.specialization = req.specialization
    if req.office_location:
        t.office_location = req.office_location
    if req.phone and t.user:
        t.user.phone = req.phone
    if req.status:
        t.status = req.status.upper()

    db.commit()

    log_audit(
        db=db,
        action="EDIT_TEACHER",
        module="Faculty",
        user_id=current_user.id,
        record_id=str(t.id),
        details=f"Updated faculty profile for {t.faculty_id}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(success=True, message="Teacher profile updated successfully.")


@router.get("/{teacher_id}/sessions", response_model=Dict[str, Any])
def get_teacher_sessions(
    teacher_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve classroom sessions conducted by a faculty member."""
    sessions = db.query(SessionModel).filter(SessionModel.teacher_id == teacher_id).order_by(SessionModel.created_at.desc()).all()
    results = []
    for s in sessions:
        results.append({
            "id": s.id,
            "session_id": s.session_id,
            "subject_code": s.subject.code if s.subject else None,
            "subject_name": s.subject.name if s.subject else None,
            "room": s.room.room_number if s.room else None,
            "date": s.date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "status": s.status
        })
    return {"success": True, "sessions": results}


@router.get("/{teacher_id}/attendance", response_model=Dict[str, Any])
def get_teacher_attendance(
    teacher_id: int,
    current_user: User = Depends(require_any_role("hod", "admin", "teacher")),
    db: Session = Depends(get_db)
):
    """Retrieve all student attendance records verified across this faculty's sessions."""
    sessions = db.query(SessionModel).filter(SessionModel.teacher_id == teacher_id).all()
    sess_ids = [s.id for s in sessions]
    records = db.query(Attendance).filter(Attendance.session_id.in_(sess_ids)).order_by(Attendance.check_in_time.desc()).all() if sess_ids else []

    results = []
    for r in records:
        results.append({
            "attendance_id": r.id,
            "session_id": r.session.session_id if r.session else None,
            "student_id": r.student_id,
            "student_name": r.student.user.full_name if r.student and r.student.user else None,
            "usn": r.student.usn if r.student else None,
            "status": r.status,
            "distance_meters": r.distance_meters,
            "check_in_time": r.check_in_time.isoformat() if r.check_in_time else None
        })
    return {"success": True, "count": len(results), "records": results}
