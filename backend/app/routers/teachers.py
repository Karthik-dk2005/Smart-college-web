from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Teacher, Department, User, Timetable, Attendance
from app.schemas import TeacherCreate, TeacherUpdate, TeacherResponse
from app.dependencies import get_current_user, require_admin_or_hod
from app.utils.security import get_password_hash
from app.utils.response import success_response

router = APIRouter(prefix="/api/teachers", tags=["Teachers"])


def format_teacher(t: Teacher) -> dict:
    dept_name = t.department.name if t.department else None
    return {
        "id": t.id,
        "name": t.name,
        "employee_id": t.employee_id,
        "email": t.email,
        "phone": t.phone,
        "department_id": t.department_id,
        "department_name": dept_name,
        "designation": t.designation or "Assistant Professor",
        "username": t.username or (t.email if t.email else None),
        "status": t.status or "active",
        "created_at": t.created_at,
        "updated_at": t.updated_at,
    }


# ==========================================================
# 1. LIST TEACHERS (GET /api/teachers)
# ==========================================================
@router.get("", response_model=List[TeacherResponse])
def list_teachers(
    department_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List teachers.
    - Admin: Full access to view teachers across all departments.
    - HOD: Restricted to viewing teachers in their own department.
    - Teacher / Student: Blocked from teacher administration listing (403 Forbidden).
    """
    user_role = current_user.role.lower()
    if user_role not in ("admin", "hod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )

    query = db.query(Teacher).options(joinedload(Teacher.department))

    # HOD department restriction
    if user_role == "hod":
        if current_user.department_id:
            query = query.filter(Teacher.department_id == current_user.department_id)
        else:
            return []
    elif department_id:
        query = query.filter(Teacher.department_id == department_id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Teacher.status == status_filter.lower())

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Teacher.name.ilike(s)) |
            (Teacher.employee_id.ilike(s)) |
            (Teacher.email.ilike(s)) |
            (Teacher.designation.ilike(s))
        )

    teachers = query.order_by(Teacher.name.asc()).all()
    return [format_teacher(t) for t in teachers]


# ==========================================================
# 2. GET SINGLE TEACHER (GET /api/teachers/{id})
# ==========================================================
@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get teacher details by ID.
    - Admin: Can view any teacher.
    - HOD: Can view teachers in own department only.
    - Teacher: Can view own teacher profile.
    - Student: 403 Forbidden.
    """
    t = db.query(Teacher).options(joinedload(Teacher.department)).filter(Teacher.id == teacher_id).first()
    if not t:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teacher with ID {teacher_id} not found."
        )

    user_role = current_user.role.lower()
    if user_role == "teacher":
        if current_user.teacher_id != t.id and current_user.email != t.email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view other teachers' profiles."
            )
    elif user_role == "hod":
        if current_user.department_id and t.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action. Teacher belongs to another department."
            )
    elif user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )

    return format_teacher(t)


# ==========================================================
# 3. CREATE TEACHER (POST /api/teachers)
# ==========================================================
@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(
    payload: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Create a new teacher with linked login account.
    - Admin: Can assign any department.
    - HOD: Can create teachers ONLY in their own department.
    - Teacher / Student: 403 Forbidden.
    """
    emp_id = (payload.employee_id or "").strip().upper()
    if not emp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID is required."
        )

    # Department permission enforcement
    target_dept_id = payload.department_id or current_user.department_id or 1
    if current_user.role.lower() == "hod":
        if current_user.department_id and target_dept_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action. HODs can only add teachers to their own department."
            )
        target_dept_id = current_user.department_id

    # Check Employee ID uniqueness
    existing_emp = db.query(Teacher).filter(Teacher.employee_id == emp_id).first()
    if existing_emp:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Teacher with Employee ID '{emp_id}' already exists."
        )

    email_clean = payload.email.lower().strip() if payload.email else f"{emp_id.lower()}@faculty.campus.edu"
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{email_clean}' already exists."
        )

    plain_pwd = payload.password or "password123"
    hashed_pwd = get_password_hash(plain_pwd)
    username_val = (payload.username or email_clean).strip().lower()

    # Create Teacher record
    teacher = Teacher(
        name=payload.name.strip(),
        email=email_clean,
        employee_id=emp_id,
        phone=payload.phone,
        department_id=target_dept_id,
        designation=payload.designation or "Assistant Professor",
        username=username_val,
        password_hash=hashed_pwd,
        status=payload.status or "active"
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    # Create linked User account for authentication
    user = User(
        name=payload.name.strip(),
        email=email_clean,
        password_hash=hashed_pwd,
        role="teacher",
        department_id=target_dept_id,
        teacher_id=teacher.id,
        phone=payload.phone,
        is_active=(payload.status != "inactive")
    )
    db.add(user)
    db.commit()

    t = db.query(Teacher).options(joinedload(Teacher.department)).filter(Teacher.id == teacher.id).first()
    return format_teacher(t)


# ==========================================================
# 4. UPDATE TEACHER (PUT /api/teachers/{id})
# ==========================================================
@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(
    teacher_id: int,
    payload: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Update teacher profile details.
    - Admin: Can edit teachers in any department and change department.
    - HOD: Can edit ONLY teachers in own department. Cannot reassign department.
    - Teacher / Student: 403 Forbidden.
    """
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teacher with ID {teacher_id} not found."
        )

    # HOD department check
    if current_user.role.lower() == "hod":
        if current_user.department_id and teacher.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action. Teacher belongs to another department."
            )
        if payload.department_id is not None and payload.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to transfer teachers to another department."
            )

    # Check Employee ID uniqueness
    if payload.employee_id and payload.employee_id.strip().upper() != teacher.employee_id:
        emp_clean = payload.employee_id.strip().upper()
        existing = db.query(Teacher).filter(
            Teacher.employee_id == emp_clean,
            Teacher.id != teacher_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Another teacher already has Employee ID '{emp_clean}'."
            )
        teacher.employee_id = emp_clean

    # Find linked user account
    linked_user = db.query(User).filter(
        (User.teacher_id == teacher.id) | (User.email == teacher.email)
    ).first()

    if payload.name is not None:
        teacher.name = payload.name.strip()
        if linked_user:
            linked_user.name = payload.name.strip()

    if payload.email is not None:
        email_clean = payload.email.lower().strip()
        if email_clean != teacher.email:
            existing_user = db.query(User).filter(
                User.email == email_clean,
                User.id != (linked_user.id if linked_user else None)
            ).first()
            if existing_user:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email '{email_clean}' already taken.")
            teacher.email = email_clean
            if linked_user:
                linked_user.email = email_clean

    if payload.phone is not None:
        teacher.phone = payload.phone
        if linked_user:
            linked_user.phone = payload.phone

    if payload.department_id is not None and current_user.role.lower() == "admin":
        teacher.department_id = payload.department_id
        if linked_user:
            linked_user.department_id = payload.department_id

    if payload.designation is not None:
        teacher.designation = payload.designation

    if payload.username is not None:
        teacher.username = payload.username.strip()

    if payload.status is not None:
        st_clean = payload.status.lower().strip()
        if st_clean in ("active", "inactive"):
            teacher.status = st_clean
            if linked_user:
                linked_user.is_active = (st_clean == "active")

    if payload.password:
        pwd_hash = get_password_hash(payload.password)
        teacher.password_hash = pwd_hash
        if linked_user:
            linked_user.password_hash = pwd_hash

    teacher.updated_at = datetime.utcnow()
    db.commit()

    t = db.query(Teacher).options(joinedload(Teacher.department)).filter(Teacher.id == teacher_id).first()
    return format_teacher(t)


# ==========================================================
# 5. DELETE / DEACTIVATE TEACHER (DELETE /api/teachers/{id})
# ==========================================================
@router.delete("/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Remove or deactivate a teacher.
    - If teacher has timetable history or attendance records: Do NOT permanently delete historical data.
      Instead set status = 'inactive' so historical records remain intact.
    - If no timetable assignments or attendance exist: Permanently delete teacher and linked user.
    - HOD: Can manage only own department.
    - Teacher / Student: 403 Forbidden.
    """
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teacher with ID {teacher_id} not found."
        )

    # HOD department check
    if current_user.role.lower() == "hod":
        if current_user.department_id and teacher.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action. Teacher belongs to another department."
            )

    # Check timetable assignments and attendance records
    timetable_count = db.query(Timetable).filter(Timetable.teacher_id == teacher_id).count()
    attendance_count = db.query(Attendance).filter(Attendance.teacher_id == teacher_id).count()

    if timetable_count > 0 or attendance_count > 0:
        # Preserve historical timetable & attendance data
        teacher.status = "inactive"
        linked_user = db.query(User).filter(
            (User.teacher_id == teacher.id) | (User.email == teacher.email)
        ).first()
        if linked_user:
            linked_user.is_active = False

        teacher.updated_at = datetime.utcnow()
        db.commit()
        return success_response(
            data={"id": teacher_id, "status": "inactive", "action": "deactivated"},
            message="Teacher deactivated successfully."
        )

    # Clean delete if no historical records exist
    linked_user = db.query(User).filter(
        (User.teacher_id == teacher.id) | (User.email == teacher.email)
    ).first()
    if linked_user:
        db.delete(linked_user)

    db.delete(teacher)
    db.commit()
    return success_response(
        data={"id": teacher_id, "status": "deleted", "action": "deleted"},
        message="Teacher removed successfully."
    )
