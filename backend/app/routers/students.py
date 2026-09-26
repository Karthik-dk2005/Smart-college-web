from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.models.department import Department
from app.models.attendance import Attendance
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut
from app.dependencies import get_current_user, require_admin_or_hod
from app.utils.security import get_password_hash
from app.utils.response import success_response

router = APIRouter(prefix="/api/students", tags=["Students"])


def format_student(s: Student) -> dict:
    dept_name = s.department.name if s.department else None
    return {
        "id": s.id,
        "student_id": s.student_id or s.usn,
        "usn": s.usn,
        "name": s.name,
        "email": s.email,
        "phone": s.phone,
        "department_id": s.department_id,
        "department_name": dept_name,
        "semester": s.semester,
        "section": s.section,
        "admission_year": s.admission_year or 2024,
        "username": s.username or (s.user.email if s.user else s.email),
        "status": s.status or "active",
        "user_id": s.user_id,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
    }


# ==========================================================
# 1. CREATE STUDENT (POST /api/students)
# ==========================================================
@router.post("", status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Create a new student with login user account.
    - Admin: Can assign any department.
    - HOD: Can create students ONLY in their own department.
    - Teacher / Student: 403 Forbidden.
    """
    # Normalize ID / USN
    student_id_val = (payload.student_id or payload.usn or "").strip().upper()
    if not student_id_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID / USN is required."
        )

    # Department permission enforcement
    target_dept_id = payload.department_id or current_user.department_id or 1
    if current_user.role.lower() == "hod":
        if current_user.department_id and target_dept_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action. HODs can only manage students in their own department."
            )
        target_dept_id = current_user.department_id

    # Check USN / Student ID uniqueness
    existing_usn = db.query(Student).filter(
        (Student.usn == student_id_val) | (Student.student_id == student_id_val)
    ).first()
    if existing_usn:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with Student ID / USN '{student_id_val}' already exists."
        )

    # Check Email uniqueness
    email_clean = payload.email.lower().strip()
    existing_email = db.query(User).filter(User.email == email_clean).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{email_clean}' already exists."
        )

    username_val = (payload.username or email_clean).strip().lower()
    plain_password = payload.password or "password123"
    hashed_pwd = get_password_hash(plain_password)

    # Create associated User login account
    user = User(
        name=payload.name.strip(),
        email=email_clean,
        password_hash=hashed_pwd,
        role="student",
        department_id=target_dept_id,
        semester=payload.semester,
        section=(payload.section or "A").upper().strip(),
        phone=payload.phone,
        is_active=(payload.status != "inactive"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create Student record
    student = Student(
        student_id=student_id_val,
        usn=student_id_val,
        name=payload.name.strip(),
        email=email_clean,
        phone=payload.phone,
        semester=payload.semester,
        section=(payload.section or "A").upper().strip(),
        department_id=target_dept_id,
        admission_year=payload.admission_year or 2024,
        username=username_val,
        password_hash=hashed_pwd,
        status=payload.status or "active",
        user_id=user.id
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    data = format_student(student)
    return success_response(data=data, message="✓ Student added successfully.", status_code=status.HTTP_201_CREATED)


# ==========================================================
# 2. CLASS STUDENTS (GET /api/students/class)
# ==========================================================
@router.get("/class")
def get_students_by_class(
    semester: int,
    section: str,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get students belonging strictly to a specific timetable class.
    Accessible by teachers taking attendance, HOD, and Admin.
    """
    query = db.query(Student).options(joinedload(Student.department)).filter(
        Student.semester == semester,
        Student.section == section.upper(),
        Student.status == "active"
    )
    if department_id:
        query = query.filter(Student.department_id == department_id)
    elif current_user.department_id and current_user.role not in ("admin",):
        query = query.filter(Student.department_id == current_user.department_id)

    students = query.order_by(Student.usn.asc(), Student.name.asc()).all()
    data = [format_student(s) for s in students]
    return success_response(data=data, message=f"Loaded {len(data)} students for Semester {semester} Section {section.upper()}")


# ==========================================================
# 3. LIST STUDENTS (GET /api/students)
# ==========================================================
@router.get("")
def list_students(
    semester: Optional[int] = None,
    section: Optional[str] = None,
    department_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List students with rich filters.
    - Admin: Can filter and view all departments.
    - HOD: Can view only students in their own department.
    - Teacher & Student: Cannot browse student management list (403 Forbidden).
    """
    user_role = current_user.role.lower()
    if user_role not in ("admin", "hod"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )

    query = db.query(Student).options(joinedload(Student.department), joinedload(Student.user))

    # HOD department restriction
    if user_role == "hod":
        if current_user.department_id:
            query = query.filter(Student.department_id == current_user.department_id)
        else:
            return success_response(data=[], message="HOD department not assigned.")
    elif department_id:
        query = query.filter(Student.department_id == department_id)

    if semester:
        query = query.filter(Student.semester == semester)
    if section and section.upper() != "ALL":
        query = query.filter(Student.section == section.upper())
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Student.status == status_filter.lower())

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Student.name.ilike(search_filter)) |
            (Student.usn.ilike(search_filter)) |
            (Student.student_id.ilike(search_filter)) |
            (Student.email.ilike(search_filter)) |
            (Student.username.ilike(search_filter))
        )

    students = query.order_by(Student.semester.asc(), Student.section.asc(), Student.usn.asc()).offset(offset).limit(limit).all()
    data = [format_student(s) for s in students]
    return success_response(data=data, message=f"Retrieved {len(data)} students successfully")


# ==========================================================
# 4. GET SINGLE STUDENT (GET /api/students/{id})
# ==========================================================
@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get student profile details.
    - Admin: Can view any student.
    - HOD: Can view students in own department only.
    - Student: Can view only own profile.
    - Teacher: 403 Forbidden.
    """
    student = db.query(Student).options(joinedload(Student.department), joinedload(Student.user)).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    user_role = current_user.role.lower()
    if user_role == "student":
        if student.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view another student's profile."
            )
    elif user_role == "hod":
        if current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action. Student belongs to another department."
            )
    elif user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )

    data = format_student(student)
    return success_response(data=data, message="Student details retrieved.")


# ==========================================================
# 5. UPDATE STUDENT (PUT /api/students/{id})
# ==========================================================
@router.put("/{student_id}")
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Update student profile details.
    - Admin: Full update across departments.
    - HOD: Can edit only students in own department. Cannot change to another department.
    - Teacher / Student: 403 Forbidden.
    """
    student = db.query(Student).options(joinedload(Student.user)).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    # HOD department check
    if current_user.role.lower() == "hod":
        if current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action. Student belongs to another department."
            )
        if payload.department_id is not None and payload.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to transfer students to another department."
            )

    if payload.name is not None:
        student.name = payload.name.strip()
        if student.user:
            student.user.name = payload.name.strip()

    if payload.email is not None:
        new_email = payload.email.lower().strip()
        if new_email != student.email:
            existing = db.query(User).filter(User.email == new_email, User.id != student.user_id).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email '{new_email}' already in use.")
            student.email = new_email
            if student.user:
                student.user.email = new_email

    if payload.phone is not None:
        student.phone = payload.phone
        if student.user:
            student.user.phone = payload.phone

    if payload.department_id is not None and current_user.role.lower() == "admin":
        student.department_id = payload.department_id
        if student.user:
            student.user.department_id = payload.department_id

    if payload.semester is not None:
        student.semester = payload.semester
        if student.user:
            student.user.semester = payload.semester

    if payload.section is not None:
        sec = payload.section.upper().strip()
        student.section = sec
        if student.user:
            student.user.section = sec

    if payload.admission_year is not None:
        student.admission_year = payload.admission_year

    if payload.status is not None:
        st_clean = payload.status.lower().strip()
        if st_clean in ("active", "inactive"):
            student.status = st_clean
            if student.user:
                student.user.is_active = (st_clean == "active")

    if payload.username is not None:
        student.username = payload.username.strip()

    if payload.password:
        pwd_hash = get_password_hash(payload.password)
        student.password_hash = pwd_hash
        if student.user:
            student.user.password_hash = pwd_hash

    student.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(student)

    data = format_student(student)
    return success_response(data=data, message="Student updated successfully.")


# ==========================================================
# 6. DELETE / DEACTIVATE STUDENT (DELETE /api/students/{id})
# ==========================================================
@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Remove or deactivate a student.
    - If student has attendance history: Set status = 'inactive' to preserve historical records.
    - If student has no attendance history: Permanently remove student and linked user.
    - HOD: Can manage only own department.
    - Teacher / Student: 403 Forbidden.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    # HOD department check
    if current_user.role.lower() == "hod":
        if current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action. Student belongs to another department."
            )

    # Check if student has attendance records
    attendance_count = db.query(Attendance).filter(Attendance.student_id == student_id).count()

    if attendance_count > 0:
        # Preserve historical attendance data: soft delete by deactivating
        student.status = "inactive"
        if student.user:
            student.user.is_active = False
        student.updated_at = datetime.utcnow()
        db.commit()
        return success_response(
            data={"id": student_id, "status": "inactive", "action": "deactivated"},
            message="Student deactivated successfully."
        )

    # Permanently delete if no historical attendance exists
    user_id = student.user_id
    db.delete(student)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)

    db.commit()
    return success_response(
        data={"id": student_id, "status": "deleted", "action": "deleted"},
        message="Student removed successfully."
    )
