import io
import csv
import re
import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.models.department import Department
from app.models.unmatched_student import UnmatchedStudentRecord
from app.dependencies import require_admin_or_hod, get_current_user

router = APIRouter(prefix="/api/admin/student-registration", tags=["Admin Student Registration"])

class UpdateGmailRequest(BaseModel):
    gmail: str

class StudentAdminActionRequest(BaseModel):
    notes: Optional[str] = None

class ResolveUnmatchedRequest(BaseModel):
    assigned_usn: str
    section: Optional[str] = "A"
    semester: Optional[int] = 5
    notes: Optional[str] = None

@router.get("/stats")
def get_registration_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    total = db.query(Student).count()
    registered = db.query(Student).filter(Student.registration_status == "Registered").count()
    unregistered = db.query(Student).filter(Student.registration_status.in_(["Unregistered", "Pending_OTP", "Pending"])).count()
    verified_gmail = db.query(Student).filter(Student.email_verification_status == "Verified").count()
    flagged = db.query(Student).filter(Student.is_flagged_for_admin == 1).count()
    missing_gmail = db.query(Student).filter(or_(Student.gmail == None, Student.gmail == "")).count()
    unmatched_count = db.query(UnmatchedStudentRecord).filter(UnmatchedStudentRecord.status == "Pending").count()

    return {
        "total_students": total,
        "registered_students": registered,
        "unregistered_students": unregistered,
        "verified_gmail": verified_gmail,
        "flagged_for_admin": flagged,
        "missing_gmail": missing_gmail,
        "unmatched_records": unmatched_count
    }

@router.get("/students")
def list_students(
    status_filter: Optional[str] = Query("all", alias="status"),
    section_filter: Optional[str] = Query("all", alias="section"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    query = db.query(Student)

    if status_filter == "registered":
        query = query.filter(Student.registration_status == "Registered")
    elif status_filter == "unregistered":
        query = query.filter(Student.registration_status.in_(["Unregistered", "Pending_OTP", "Pending"]))
    elif status_filter == "verified":
        query = query.filter(Student.email_verification_status == "Verified")
    elif status_filter == "flagged":
        query = query.filter(Student.is_flagged_for_admin == 1)
    elif status_filter == "missing_gmail":
        query = query.filter(or_(Student.gmail == None, Student.gmail == ""))

    if section_filter and section_filter.upper() in ["A", "B"]:
        query = query.filter(Student.section == section_filter.upper())

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.name.ilike(s),
                Student.usn.ilike(s),
                Student.gmail.ilike(s),
                Student.email.ilike(s)
            )
        )

    total_count = query.count()
    students = query.order_by(Student.section, Student.usn).offset((page - 1) * limit).limit(limit).all()

    items = []
    for idx, s in enumerate(students):
        dept_name = s.department.name if s.department else "Computer Science and Engineering"
        items.append({
            "sl_no": (page - 1) * limit + idx + 1,
            "id": s.id,
            "usn": s.usn,
            "name": s.name,
            "gmail": s.gmail,
            "phone": s.phone,
            "semester": s.semester,
            "section": s.section,
            "department": dept_name,
            "registration_status": s.registration_status or "Unregistered",
            "email_verification_status": s.email_verification_status or "Unverified",
            "is_flagged_for_admin": bool(s.is_flagged_for_admin),
            "admin_flag_reason": s.admin_flag_reason,
            "registered_at": s.registered_at.isoformat() if s.registered_at else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "students": items
    }

@router.put("/students/{usn}/gmail")
def edit_student_gmail(
    usn: str,
    req: UpdateGmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    clean_usn = usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with USN '{clean_usn}' not found.")

    new_gmail = req.gmail.strip().lower()
    if not new_gmail or "@" not in new_gmail:
        raise HTTPException(status_code=400, detail="Invalid Gmail address.")

    # Check conflict
    conflict = db.query(Student).filter(Student.gmail == new_gmail, Student.usn != clean_usn).first()
    if conflict:
        raise HTTPException(status_code=409, detail=f"Gmail '{new_gmail}' is already assigned to {conflict.usn}.")

    student.gmail = new_gmail
    student.email = new_gmail
    # Clear missing gmail flag
    if student.is_flagged_for_admin and "Missing Gmail" in (student.admin_flag_reason or ""):
        student.is_flagged_for_admin = 0
        student.admin_flag_reason = None

    # Update linked User if exists
    if student.user:
        student.user.email = new_gmail

    db.commit()

    return {
        "success": True,
        "message": f"Gmail for student {clean_usn} successfully updated to {new_gmail}.",
        "student": {
            "usn": student.usn,
            "name": student.name,
            "gmail": student.gmail
        }
    }

@router.put("/students/{usn}/approve")
def approve_student_registration(
    usn: str,
    req: StudentAdminActionRequest = StudentAdminActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    clean_usn = usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with USN '{clean_usn}' not found.")

    student.registration_status = "Registered"
    student.email_verification_status = "Verified"
    student.is_flagged_for_admin = 0
    student.admin_flag_reason = None
    student.registered_at = datetime.datetime.utcnow()

    # Link/update User
    if student.user:
        student.user.account_status = "Approved"
        student.user.is_active = True
    else:
        user = User(
            username=student.usn.lower(),
            email=student.gmail or student.email,
            password_hash=student.password_hash or "Student@123",
            full_name=student.name,
            usn_or_employee_id=student.usn,
            role="student",
            department_id=student.department_id,
            semester=student.semester,
            section=student.section,
            account_status="Approved",
            is_active=True
        )
        db.add(user)
        db.flush()
        student.user_id = user.id

    db.commit()
    return {"success": True, "message": f"Student {clean_usn} registration successfully approved."}

@router.put("/students/{usn}/reject")
def reject_student_registration(
    usn: str,
    req: StudentAdminActionRequest = StudentAdminActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    clean_usn = usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with USN '{clean_usn}' not found.")

    student.registration_status = "Unregistered"
    student.email_verification_status = "Unverified"
    student.otp_code = None
    if student.user:
        student.user.account_status = "Rejected"

    db.commit()
    return {"success": True, "message": f"Student {clean_usn} registration status reset to Unregistered."}

class ResetPasswordAdminRequest(BaseModel):
    new_password: str

@router.post("/students/{usn}/reset-password")
def admin_reset_student_password(
    usn: str,
    req: ResetPasswordAdminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    from app.utils.security import get_password_hash
    clean_usn = usn.strip().upper()
    student = db.query(Student).filter(Student.usn == clean_usn).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {clean_usn} not found.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    hashed = get_password_hash(req.new_password)
    student.password_hash = hashed

    if student.user:
        student.user.password_hash = hashed

    db.commit()
    return {"success": True, "message": f"Password for student {clean_usn} successfully reset."}

@router.get("/unmatched")
def list_unmatched_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    records = db.query(UnmatchedStudentRecord).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "excel_usn": r.excel_usn,
            "assigned_usn": r.assigned_usn,
            "gmail": r.gmail,
            "phone": r.phone,
            "sheet_name": r.sheet_name,
            "reason": r.reason,
            "status": r.status,
            "notes": r.notes,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]

@router.post("/unmatched/{record_id}/resolve")
def resolve_unmatched_record(
    record_id: int,
    req: ResolveUnmatchedRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    rec = db.query(UnmatchedStudentRecord).filter(UnmatchedStudentRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Unmatched record not found.")

    clean_usn = req.assigned_usn.strip().upper()
    # Check if student already in DB with this USN
    existing = db.query(Student).filter(Student.usn == clean_usn).first()
    if existing:
        # Link email
        if rec.gmail and not existing.gmail:
            existing.gmail = rec.gmail.lower()
        rec.status = "Resolved"
        rec.assigned_usn = clean_usn
    else:
        dept = db.query(Department).first()
        new_student = Student(
            usn=clean_usn,
            name=rec.name,
            email=rec.gmail or f"{clean_usn.lower()}@college.edu",
            gmail=rec.gmail,
            phone=rec.phone,
            semester=req.semester or 5,
            section=req.section or "A",
            department_id=dept.id if dept else 1,
            registration_status="Unregistered",
            email_verification_status="Unverified"
        )
        db.add(new_student)
        rec.status = "Resolved"
        rec.assigned_usn = clean_usn

    db.commit()
    return {"success": True, "message": f"Record resolved and linked to USN {clean_usn}."}

@router.post("/import-excel")
def import_excel_matching(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    from migrate_student_registration import run_migration_and_matching
    run_migration_and_matching()
    return {"success": True, "message": "Excel data successfully re-imported and matched with student records."}

@router.post("/import-pdf")
def import_pdf_matching(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    from app.services.marks_importer import import_all_marks_and_students
    res = import_all_marks_and_students(db)
    return {"success": True, "message": "PDF lists imported and synced.", "result": res}

@router.get("/export")
def export_student_registration_report(
    format: Optional[str] = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    students = db.query(Student).order_by(Student.section, Student.usn).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Sl.No", "USN", "Student Full Name", "Gmail Address",
        "Phone Number", "Semester", "Section", "Department",
        "Registration Status", "Email Verification Status",
        "Account Creation Date", "Admin Flagged", "Flag Reason"
    ])

    for idx, s in enumerate(students):
        dept_name = s.department.name if s.department else "Computer Science and Engineering"
        writer.writerow([
            idx + 1,
            s.usn,
            s.name,
            s.gmail or "Missing",
            s.phone or "",
            s.semester,
            s.section,
            dept_name,
            s.registration_status,
            s.email_verification_status,
            s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else "",
            "YES" if s.is_flagged_for_admin else "NO",
            s.admin_flag_reason or ""
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=student_registration_report_{datetime.date.today()}.csv"}
    )
    return response

