import os
import re
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.models.department import Department
from app.models.mark import Mark
from app.schemas.student import StudentCreate, StudentUpdate, BulkImportRequest, BulkStudentItem
from app.dependencies import get_current_user, require_admin_or_hod
from app.utils.security import get_password_hash
from app.utils.response import success_response
from app.services.marks_importer import import_5th_sem_marks, parse_ia_pdf

router = APIRouter(prefix="/api/students", tags=["Students"])


def format_student(s: Student) -> dict:
    dept_name = s.department.name if s.department else None
    return {
        "id": s.id,
        "student_id": s.student_id or s.usn,
        "usn": s.usn,
        "name": s.name,
        "email": s.email,
        "gmail": s.gmail or s.email,
        "phone": s.phone,
        "father_phone": getattr(s, "father_phone", None),
        "mother_phone": getattr(s, "mother_phone", None),
        "department_id": s.department_id,
        "department_name": dept_name,
        "semester": s.semester,
        "section": s.section,
        "admission_year": s.admission_year or 2024,
        "username": s.username or (s.user.username if s.user else s.usn.lower()),
        "status": s.status or "active",
        "registration_status": getattr(s, "registration_status", "Unregistered") or "Unregistered",
        "user_id": s.user_id,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
    }


def find_student_by_identifier(identifier: str, db: Session) -> Optional[Student]:
    """Find student by USN or integer ID."""
    clean = str(identifier).strip()
    student = db.query(Student).options(
        joinedload(Student.department),
        joinedload(Student.user)
    ).filter(
        func.upper(Student.usn) == clean.upper()
    ).first()

    if not student and clean.isdigit():
        student = db.query(Student).options(
            joinedload(Student.department),
            joinedload(Student.user)
        ).filter(Student.id == int(clean)).first()

    return student


# ==========================================================
# 1. SEARCH STUDENTS (GET /api/students/search?query=)
# Must be defined BEFORE /{usn} route to avoid path clash
# ==========================================================
@router.get("/search")
def search_students(
    query: str = Query(..., min_length=1, description="Search query for name or USN"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search students by name or USN.
    - Admin: can search across all students.
    - HOD: can search within own department.
    - Teacher: can search within permitted students.
    """
    clean_q = f"%{query.strip()}%"
    db_query = db.query(Student).options(joinedload(Student.department))

    if current_user.role == "hod" and current_user.department_id:
        db_query = db_query.filter(Student.department_id == current_user.department_id)

    db_query = db_query.filter(
        (Student.name.ilike(clean_q)) |
        (Student.usn.ilike(clean_q)) |
        (Student.email.ilike(clean_q))
    )

    students = db_query.order_by(Student.section.asc(), Student.usn.asc()).limit(150).all()
    data = [format_student(s) for s in students]
    return success_response(data=data, message=f"Found {len(data)} matching students.")


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
    """Get students for a timetable class."""
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
# 3. LIST ALL STUDENTS (GET /api/students)
# ==========================================================
@router.get("")
def list_students(
    semester: Optional[int] = None,
    section: Optional[str] = None,
    department_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    limit: int = 500,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List students with filtering by semester and section.
    - Admin & HOD: full management list.
    - Teacher: permitted viewing.
    - Student: can view only own profile.
    """
    user_role = (current_user.role or "").lower()

    if user_role == "student":
        # Students can view only their own record
        student = db.query(Student).options(joinedload(Student.department)).filter(
            Student.user_id == current_user.id
        ).first()
        data = [format_student(student)] if student else []
        return success_response(data=data, message="Student profile loaded.")

    query = db.query(Student).options(joinedload(Student.department), joinedload(Student.user))

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
            (Student.email.ilike(search_filter))
        )

    students = query.order_by(Student.section.asc(), Student.usn.asc()).offset(offset).limit(limit).all()
    data = [format_student(s) for s in students]
    return success_response(data=data, message=f"Retrieved {len(data)} students successfully")


# ==========================================================
# 4. GET SINGLE STUDENT (GET /api/students/{usn})
# Supports either USN string (e.g. 4MN24CS002) or integer ID
# ==========================================================
@router.get("/{usn}")
def get_student_by_usn(
    usn: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get student profile details by USN or ID.
    - Admin: can view any student.
    - HOD: can view students in own department only.
    - Teacher: can view permitted student information.
    - Student: can view only own profile.
    """
    student = find_student_by_identifier(usn, db)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with USN or ID '{usn}' not found."
        )

    user_role = (current_user.role or "").lower()
    if user_role == "student":
        if student.user_id != current_user.id and (student.usn or "").upper() != (current_user.usn_or_employee_id or "").upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view another student's private profile."
            )
    elif user_role == "hod":
        if current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access students from another department."
            )

    data = format_student(student)
    return success_response(data=data, message="Student details retrieved.")


# ==========================================================
# 5. CREATE SINGLE STUDENT (POST /api/students)
# ==========================================================
@router.post("", status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Create a new student with login user account.
    - Validates USN and prevents duplicate USN.
    - Automatically provisions corresponding User login account.
    """
    usn_clean = payload.usn.strip().upper()
    name_clean = payload.name.strip()

    # Check USN uniqueness
    existing_usn = db.query(Student).filter(
        func.upper(Student.usn) == usn_clean
    ).first()
    if existing_usn:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with USN '{usn_clean}' already exists."
        )

    target_dept_id = payload.department_id or current_user.department_id or 1
    if current_user.role.lower() == "hod":
        if current_user.department_id and target_dept_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HODs can only create students in their own department."
            )
        target_dept_id = current_user.department_id

    email_clean = (payload.email or f"{usn_clean.lower()}@college.edu").lower().strip()
    existing_user = db.query(User).filter(
        (func.lower(User.email) == email_clean) |
        (func.upper(User.usn_or_employee_id) == usn_clean)
    ).first()

    plain_password = payload.password or "password123"
    hashed_pwd = get_password_hash(plain_password)

    if not existing_user:
        user = User(
            name=name_clean,
            full_name=name_clean,
            username=usn_clean.lower(),
            email=email_clean,
            password_hash=hashed_pwd,
            role="student",
            department_id=target_dept_id,
            semester=payload.semester,
            section=payload.section.upper().strip(),
            phone=payload.phone,
            usn_or_employee_id=usn_clean,
            account_status="Approved",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = user.id
    else:
        user_id = existing_user.id

    student = Student(
        student_id=usn_clean,
        usn=usn_clean,
        name=name_clean,
        email=email_clean,
        phone=payload.phone,
        semester=payload.semester,
        section=payload.section.upper().strip(),
        department_id=target_dept_id,
        admission_year=payload.admission_year or 2024,
        username=usn_clean.lower(),
        password_hash=hashed_pwd,
        status=payload.status or "active",
        user_id=user_id
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Link any unlinked marks matching this USN
    db.query(Mark).filter(func.upper(Mark.usn) == usn_clean).update(
        {"student_id": student.id, "student_name": name_clean},
        synchronize_session=False
    )
    db.commit()

    data = format_student(student)
    return success_response(data=data, message="Student added successfully.", status_code=status.HTTP_201_CREATED)


# ==========================================================
# 6. BULK IMPORT STUDENTS (POST /api/students/bulk-import)
# ==========================================================
@router.post("/bulk-import")
def bulk_import_students(
    payload: BulkImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Bulk import student records.
    - Validates each USN.
    - Prevents duplicate USN entries.
    - Creates student and linked user login accounts.
    - Connects with existing IA marks matching USN.
    """
    students_list = payload.students
    if not students_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student list cannot be empty."
        )

    dept_id = current_user.department_id or 1
    default_pwd_hash = get_password_hash("password123")

    imported_count = 0
    updated_count = 0
    errors = []

    for item in students_list:
        usn_clean = item.usn.strip().upper()
        name_clean = (item.full_name or item.name or "").strip()
        sec_clean = (item.section or "A").strip().upper()
        sem_clean = item.semester or 5
        target_dept = item.department_id or dept_id

        if not usn_clean or not name_clean:
            errors.append(f"Missing USN or Name for entry: {item}")
            continue

        email_clean = (item.email or f"{usn_clean.lower()}@college.edu").lower().strip()

        # Check if student already exists
        existing_student = db.query(Student).filter(
            func.upper(Student.usn) == usn_clean
        ).first()

        if existing_student:
            # Update fields
            existing_student.name = name_clean
            existing_student.section = sec_clean
            existing_student.semester = sem_clean
            if item.phone:
                existing_student.phone = item.phone
            updated_count += 1
            student_obj = existing_student
        else:
            # Create user if needed
            user = db.query(User).filter(
                (func.lower(User.email) == email_clean) |
                (func.upper(User.usn_or_employee_id) == usn_clean)
            ).first()

            if not user:
                user = User(
                    name=name_clean,
                    full_name=name_clean,
                    username=usn_clean.lower(),
                    email=email_clean,
                    password_hash=default_pwd_hash,
                    role="student",
                    department_id=target_dept,
                    semester=sem_clean,
                    section=sec_clean,
                    phone=item.phone,
                    usn_or_employee_id=usn_clean,
                    account_status="Approved",
                    is_active=True
                )
                db.add(user)
                db.flush()

            student_obj = Student(
                student_id=usn_clean,
                usn=usn_clean,
                name=name_clean,
                email=email_clean,
                phone=item.phone,
                semester=sem_clean,
                section=sec_clean,
                department_id=target_dept,
                admission_year=2024,
                username=usn_clean.lower(),
                password_hash=default_pwd_hash,
                status="active",
                user_id=user.id
            )
            db.add(student_obj)
            db.flush()
            imported_count += 1

        # Link marks
        db.query(Mark).filter(func.upper(Mark.usn) == usn_clean).update(
            {"student_id": student_obj.id, "student_name": name_clean},
            synchronize_session=False
        )

    db.commit()

    return success_response(
        data={
            "imported": imported_count,
            "updated": updated_count,
            "total_processed": len(students_list),
            "errors": errors
        },
        message=f"Successfully imported {imported_count} new students and updated {updated_count} existing students."
    )


# ==========================================================
# 7. IMPORT STUDENTS DIRECTLY FROM 5TH SEMESTER PDFS
# ==========================================================
@router.post("/import-from-pdf")
def import_students_from_pdf(
    file: Optional[UploadFile] = None,
    section: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Extract students from the 5th Semester IA marks PDFs:
    - 5th Semester Section A: 66 students
    - 5th Semester Section B: 65 students
    - Total: 131 students
    Imports students, provisions login accounts, and links marks.
    """
    res = import_5th_sem_marks(db, force_reload=False)
    # Count students
    sec_a_count = db.query(Student).filter(Student.semester == 5, Student.section == "A").count()
    sec_b_count = db.query(Student).filter(Student.semester == 5, Student.section == "B").count()
    total_count = db.query(Student).filter(Student.semester == 5).count()

    return success_response(
        data={
            "total_students": total_count,
            "section_a_count": sec_a_count,
            "section_b_count": sec_b_count,
            "marks_status": res.get("status"),
        },
        message=f"Successfully verified/imported {total_count} students (Section A: {sec_a_count}, Section B: {sec_b_count})."
    )


# ==========================================================
# 8. UPDATE STUDENT (PUT /api/students/{usn})
# ==========================================================
@router.put("/{usn}")
def update_student_by_usn(
    usn: str,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """Update student profile details by USN or ID."""
    student = find_student_by_identifier(usn, db)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with USN or ID '{usn}' not found."
        )

    if current_user.role.lower() == "hod":
        if current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify students belonging to another department."
            )

    if payload.name is not None:
        student.name = payload.name.strip()
        if student.user:
            student.user.name = payload.name.strip()
            student.user.full_name = payload.name.strip()

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
            student.user.mobile_number = payload.phone

    if payload.semester is not None:
        student.semester = payload.semester
        if student.user:
            student.user.semester = payload.semester

    if payload.section is not None:
        sec = payload.section.upper().strip()
        student.section = sec
        if student.user:
            student.user.section = sec

    if payload.status is not None:
        st_clean = payload.status.lower().strip()
        student.status = st_clean
        if student.user:
            student.user.is_active = (st_clean == "active")

    student.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(student)

    data = format_student(student)
    return success_response(data=data, message="Student details updated successfully.")


# ==========================================================
# 9. DELETE STUDENT (DELETE /api/students/{usn})
# ==========================================================
@router.delete("/{usn}")
def delete_student_by_usn(
    usn: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """Delete student and linked user account by USN or ID."""
    student = find_student_by_identifier(usn, db)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with USN or ID '{usn}' not found."
        )

    if current_user.role.lower() == "hod":
        if current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete students from another department."
            )

    student_id = student.id
    student_usn = student.usn
    user_id = student.user_id

    # Remove student
    db.delete(student)
    # Remove associated user account if role is student
    if user_id:
        user = db.query(User).filter(User.id == user_id, User.role == "student").first()
        if user:
            db.delete(user)

    db.commit()

    return success_response(message=f"Student with USN '{student_usn}' deleted successfully.")
