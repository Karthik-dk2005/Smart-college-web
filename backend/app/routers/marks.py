import io
import csv
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database import get_db
from app.models import Mark, Student, Subject, User, Department
from app.schemas.mark import MarkCreate, MarkUpdate, MarkItemOut, SubjectDashboardCard, StudentMarksProfile
from app.schemas import ApiResponse
from app.dependencies import get_current_user, require_role, require_any_role, get_client_ip
from app.utils import log_audit
from app.services.marks_importer import OFFICIAL_SUBJECTS, parse_ia_pdf, import_5th_sem_marks

router = APIRouter(prefix="/api/marks", tags=["Internal Marks & Gradebook"])


def format_marks_display(val: Optional[float], is_absent: bool) -> str:
    """Format obtained mark display: AB for absent, preserved integer or decimal otherwise."""
    if is_absent or val is None:
        return "AB"
    if float(val).is_integer():
        return str(int(val))
    return str(val)


def serialize_mark_entry(m: Mark) -> Dict[str, Any]:
    """Helper to convert Mark model to dictionary matching user requirements."""
    return {
        "id": m.id,
        "sl_no": m.sl_no,
        "usn": m.usn,
        "student_name": m.student_name,
        "section": m.section,
        "subject_name": m.subject_name,
        "subject_code": m.subject_code,
        "short_name": m.short_name,
        "ia": m.ia_number or "IA-1",
        "maximum_marks": m.maximum_marks,
        "obtained_marks": None if m.is_absent else m.obtained_marks,
        "obtained_marks_display": format_marks_display(m.obtained_marks, m.is_absent),
        "scaled_max_marks": m.scaled_max_marks,
        "scaled_marks": None if m.is_absent else m.scaled_marks,
        "scaled_marks_display": format_marks_display(m.scaled_marks, m.is_absent),
        "status": "Absent" if m.is_absent else "Present",
        "is_absent": bool(m.is_absent),
        "semester": m.semester,
        "department": m.department or "Computer Science and Engineering",
        "academic_year": m.academic_year or "2024-2025",
        "assessment_name": m.assessment_name or "First Internal Assessment",
        "ia2_maximum_marks": m.ia2_maximum_marks,
        "ia2_obtained_marks": None if m.ia2_is_absent else m.ia2_obtained_marks,
        "ia2_obtained_marks_display": format_marks_display(m.ia2_obtained_marks, m.ia2_is_absent) if m.ia2_maximum_marks is not None else None,
        "ia2_is_absent": bool(m.ia2_is_absent),
        "ia2_status": m.ia2_status,
        "notes": m.notes,
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "updated_at": m.updated_at.isoformat() if m.updated_at else None,
    }


@router.get("", response_model=Dict[str, Any])
def get_all_marks(
    semester: int = Query(5, description="Filter by semester"),
    section: Optional[str] = Query(None, description="Filter by section A or B"),
    subject_code: Optional[str] = Query(None, description="Filter by subject code (BCS501, BCS502, etc.)"),
    search: Optional[str] = Query(None, description="Search USN or student name"),
    ia: Optional[str] = Query("IA-1", description="Filter by assessment (IA-1 or IA-2)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Present / Absent)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve complete student marks table.
    Filterable by semester, section, subject, and student search.
    """
    query = db.query(Mark).filter(Mark.semester == semester)

    if section and section.upper() in ("A", "B"):
        query = query.filter(Mark.section == section.upper())

    if subject_code:
        query = query.filter(Mark.subject_code == subject_code.strip())

    if ia:
        query = query.filter(Mark.ia_number == ia.strip())

    if status_filter:
        if status_filter.lower() in ("absent", "ab"):
            query = query.filter(Mark.is_absent == True)
        elif status_filter.lower() == "present":
            query = query.filter(Mark.is_absent == False)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Mark.usn.ilike(search_term),
                Mark.student_name.ilike(search_term)
            )
        )

    # Order logically by section, sl_no, and subject
    query = query.order_by(Mark.section.asc(), Mark.sl_no.asc(), Mark.subject_code.asc())
    marks = query.all()

    serialized = [serialize_mark_entry(m) for m in marks]
    return {
        "success": True,
        "count": len(serialized),
        "total_records": len(serialized),
        "marks": serialized
    }


@router.get("/dashboard", response_model=Dict[str, Any])
def get_subject_dashboard(
    semester: int = Query(5, description="Semester filter"),
    section: Optional[str] = Query(None, description="Section filter"),
    db: Session = Depends(get_db)
):
    """
    Subject-wise marks dashboard cards for:
    1. Software Engineering (SE) – BCS501
    2. Computer Networks (CN) – BCS502
    3. Theory of Computation (TOC) – BCS503
    4. RM & IPR – BRMK557
    5. UNIX – BCS515C
    6. Environmental Studies (ENV) – BCS508
    """
    cards = []

    for sub_meta in OFFICIAL_SUBJECTS:
        code = sub_meta["code"]
        name = sub_meta["name"]
        short = sub_meta["short"]
        raw_max = sub_meta["raw_max"]
        scaled_max = sub_meta["scaled_max"]

        q = db.query(Mark).filter(Mark.semester == semester, Mark.subject_code == code, Mark.ia_number == "IA-1")
        if section and section.upper() in ("A", "B"):
            q = q.filter(Mark.section == section.upper())

        all_records = q.all()
        total_count = len(all_records)
        present_records = [r for r in all_records if not r.is_absent and r.obtained_marks is not None]
        absent_count = total_count - len(present_records)

        scores = [r.obtained_marks for r in present_records]
        avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
        highest_score = max(scores) if scores else 0.0
        lowest_score = min(scores) if scores else 0.0
        pass_count = sum(1 for s in scores if s >= (raw_max * 0.40))  # 40% passing
        pass_percentage = round((pass_count / len(scores) * 100), 1) if scores else 0.0

        # Section A breakdown
        sec_a_records = [r for r in all_records if r.section == "A"]
        sec_a_present = [r for r in sec_a_records if not r.is_absent and r.obtained_marks is not None]
        sec_a_scores = [r.obtained_marks for r in sec_a_present]
        sec_a_avg = round(sum(sec_a_scores) / len(sec_a_scores), 2) if sec_a_scores else 0.0
        sec_a_high = max(sec_a_scores) if sec_a_scores else 0.0

        # Section B breakdown
        sec_b_records = [r for r in all_records if r.section == "B"]
        sec_b_present = [r for r in sec_b_records if not r.is_absent and r.obtained_marks is not None]
        sec_b_scores = [r.obtained_marks for r in sec_b_present]
        sec_b_avg = round(sum(sec_b_scores) / len(sec_b_scores), 2) if sec_b_scores else 0.0
        sec_b_high = max(sec_b_scores) if sec_b_scores else 0.0

        cards.append({
            "subject_code": code,
            "subject_name": name,
            "short_name": short,
            "maximum_marks": raw_max,
            "scaled_max_marks": scaled_max,
            "total_students": total_count,
            "present_count": len(present_records),
            "absent_count": absent_count,
            "avg_marks": avg_score,
            "highest_marks": highest_score,
            "lowest_marks": lowest_score,
            "pass_percentage": pass_percentage,
            "section_a": {
                "total": len(sec_a_records),
                "present": len(sec_a_present),
                "absent": len(sec_a_records) - len(sec_a_present),
                "avg_marks": sec_a_avg,
                "highest_marks": sec_a_high
            },
            "section_b": {
                "total": len(sec_b_records),
                "present": len(sec_b_present),
                "absent": len(sec_b_records) - len(sec_b_present),
                "avg_marks": sec_b_avg,
                "highest_marks": sec_b_high
            }
        })

    return {
        "success": True,
        "semester": semester,
        "academic_year": "2024-2025",
        "assessment_name": "First Internal Assessment",
        "cards": cards
    }


@router.get("/student-wise", response_model=Dict[str, Any])
def get_student_wise_marks(
    semester: int = Query(5, description="Semester filter"),
    section: Optional[str] = Query(None, description="Section filter"),
    search: Optional[str] = Query(None, description="Search USN or Name"),
    db: Session = Depends(get_db)
):
    """
    Retrieve marks grouped by student with all 6 subjects listed.
    """
    query = db.query(Mark).filter(Mark.semester == semester, Mark.ia_number == "IA-1")

    if section and section.upper() in ("A", "B"):
        query = query.filter(Mark.section == section.upper())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Mark.usn.ilike(search_term),
                Mark.student_name.ilike(search_term)
            )
        )

    all_marks = query.order_by(Mark.section.asc(), Mark.sl_no.asc(), Mark.subject_code.asc()).all()

    # Group by USN
    students_dict: Dict[str, Dict[str, Any]] = {}
    for m in all_marks:
        if m.usn not in students_dict:
            students_dict[m.usn] = {
                "sl_no": m.sl_no,
                "usn": m.usn,
                "student_name": m.student_name,
                "section": m.section,
                "department": m.department or "Computer Science and Engineering",
                "semester": f"{m.semester}th Semester",
                "academic_year": m.academic_year or "2024-2025",
                "assessment_name": m.assessment_name or "First Internal Assessment",
                "subjects": []
            }
        students_dict[m.usn]["subjects"].append({
            "subject_id": m.subject_id,
            "subject_code": m.subject_code,
            "subject_name": m.subject_name,
            "short_name": m.short_name,
            "ia1_marks": format_marks_display(m.obtained_marks, m.is_absent),
            "ia2_marks": format_marks_display(m.ia2_obtained_marks, m.ia2_is_absent) if m.ia2_maximum_marks is not None else None,
            "maximum_marks": m.maximum_marks,
            "obtained_marks": None if m.is_absent else m.obtained_marks,
            "obtained_marks_display": format_marks_display(m.obtained_marks, m.is_absent),
            "scaled_marks": None if m.is_absent else m.scaled_marks,
            "scaled_max_marks": m.scaled_max_marks,
            "scaled_marks_display": format_marks_display(m.scaled_marks, m.is_absent),
            "is_absent": bool(m.is_absent),
            "status": "Absent" if m.is_absent else "Present",
            "absent_status": "ABSENT" if m.is_absent else "Present",
            "mark_id": m.id
        })

    student_list = list(students_dict.values())
    return {
        "success": True,
        "count": len(student_list),
        "students": student_list
    }


@router.get("/my", response_model=Dict[str, Any])
@router.get("/my-marks", response_model=Dict[str, Any])
def get_my_marks(
    usn: Optional[str] = Query(None, description="Optional override USN for demo or administrative preview"),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Student-wise marks display when a student logs in.
    Students can view only their own marks.
    Admin, HOD, and Teachers can specify ?usn=... to view marks for any student.
    """
    target_usn = None

    if current_user and current_user.role == "student":
        # Strict privacy: Students can ONLY view their own marks
        if current_user.student_profile and current_user.student_profile.usn:
            target_usn = current_user.student_profile.usn.upper()
        elif current_user.usn_or_employee_id:
            target_usn = current_user.usn_or_employee_id.upper()
        else:
            email_prefix = current_user.email.split("@")[0].upper()
            target_usn = email_prefix
    elif usn and current_user and current_user.role in ("admin", "hod", "teacher", "faculty"):
        target_usn = usn.strip().upper()
    elif usn:
        target_usn = usn.strip().upper()

    if not target_usn:
        # Fallback to the first student in database for easy preview
        first_mark = db.query(Mark).filter(Mark.semester == 5).order_by(Mark.sl_no.asc()).first()
        if first_mark:
            target_usn = first_mark.usn
        else:
            raise HTTPException(status_code=404, detail="No student marks found.")

    marks = db.query(Mark).filter(
        func.upper(Mark.usn) == target_usn,
        Mark.semester == 5,
        Mark.ia_number == "IA-1"
    ).order_by(Mark.subject_code.asc()).all()

    if not marks:
        # Try finding student without case sensitivity
        marks = db.query(Mark).filter(
            Mark.usn.ilike(f"%{target_usn}%"),
            Mark.semester == 5
        ).all()

    if not marks:
        raise HTTPException(
            status_code=404,
            detail=f"No internal assessment marks found for student USN: {target_usn}"
        )

    first_m = marks[0]

    subjects_data = []
    marks_flat_data = []
    for m in marks:
        raw_m = int(m.maximum_marks) if float(m.maximum_marks).is_integer() else m.maximum_marks
        sc_m = int(m.scaled_max_marks) if m.scaled_max_marks and float(m.scaled_max_marks).is_integer() else m.scaled_max_marks
        obt_m = (int(m.obtained_marks) if float(m.obtained_marks).is_integer() else m.obtained_marks) if m.obtained_marks is not None else None
        sc_val = (int(m.scaled_marks) if float(m.scaled_marks).is_integer() else m.scaled_marks) if m.scaled_marks is not None else None

        subjects_data.append({
            "mark_id": m.id,
            "subject_name": m.subject_name,
            "subject_code": m.subject_code,
            "short_name": m.short_name,
            "ia1_marks": format_marks_display(m.obtained_marks, m.is_absent),
            "ia2_marks": format_marks_display(m.ia2_obtained_marks, m.ia2_is_absent) if m.ia2_maximum_marks is not None else None,
            "maximum_marks": m.maximum_marks,
            "obtained_marks": None if m.is_absent else m.obtained_marks,
            "obtained_marks_display": format_marks_display(m.obtained_marks, m.is_absent),
            "scaled_max_marks": m.scaled_max_marks,
            "scaled_marks": None if m.is_absent else m.scaled_marks,
            "scaled_marks_display": format_marks_display(m.scaled_marks, m.is_absent),
            "status": "Absent" if m.is_absent else "Present",
            "is_absent": bool(m.is_absent),
            "absent_status": "ABSENT" if m.is_absent else "Present"
        })

        marks_flat_data.append({
            "id": m.id,
            "subject_name": m.short_name or m.subject_name,
            "subject_code": m.subject_code,
            "assessment": m.ia_number or "IA-1",
            "raw_marks": "AB" if m.is_absent else obt_m,
            "raw_max_marks": raw_m,
            "marks": "AB" if m.is_absent else sc_val,
            "max_marks": sc_m,
            "status": "Absent" if m.is_absent else "Present",
            "is_absent": bool(m.is_absent)
        })

    payload = {
        "success": True,
        "student_name": first_m.student_name,
        "usn": first_m.usn,
        "department": first_m.department or "Computer Science and Engineering",
        "semester": "5th Semester",
        "section": first_m.section,
        "academic_year": first_m.academic_year or "2024-2025",
        "assessment_name": first_m.assessment_name or "First Internal Assessment",
        "ia_number": first_m.ia_number or "IA-1",
        "total_subjects": len(subjects_data),
        "subjects": subjects_data,
        "marks": marks_flat_data,
    }
    # Duplicate inside "data" key so clients accessing res.data or res.data.data always succeed
    payload["data"] = {
        "student_name": first_m.student_name,
        "usn": first_m.usn,
        "section": first_m.section,
        "department": first_m.department or "Computer Science and Engineering",
        "semester": "5th Semester",
        "academic_year": first_m.academic_year or "2024-2025",
        "assessment_name": first_m.assessment_name or "First Internal Assessment",
        "marks": marks_flat_data,
        "subjects": subjects_data
    }

    return payload


@router.get("/student/{usn_or_id}", response_model=Dict[str, Any])
def get_student_marks_by_usn(
    usn_or_id: str,
    db: Session = Depends(get_db)
):
    """Get internal marks for any student by USN or ID (Admin/HOD/Teacher)."""
    clean_val = usn_or_id.strip()

    if clean_val.isdigit():
        marks = db.query(Mark).filter(
            or_(Mark.student_id == int(clean_val), Mark.id == int(clean_val))
        ).all()
    else:
        marks = db.query(Mark).filter(
            func.upper(Mark.usn) == clean_val.upper()
        ).all()

    if not marks:
        marks = db.query(Mark).filter(Mark.usn.ilike(f"%{clean_val}%")).all()

    if not marks:
        raise HTTPException(status_code=404, detail=f"No marks found for student: {usn_or_id}")

    first_m = marks[0]
    subjects_data = [
        {
            "mark_id": m.id,
            "subject_name": m.subject_name,
            "subject_code": m.subject_code,
            "short_name": m.short_name,
            "ia1_marks": format_marks_display(m.obtained_marks, m.is_absent),
            "ia2_marks": format_marks_display(m.ia2_obtained_marks, m.ia2_is_absent) if m.ia2_maximum_marks is not None else None,
            "maximum_marks": m.maximum_marks,
            "obtained_marks": None if m.is_absent else m.obtained_marks,
            "obtained_marks_display": format_marks_display(m.obtained_marks, m.is_absent),
            "scaled_max_marks": m.scaled_max_marks,
            "scaled_marks": None if m.is_absent else m.scaled_marks,
            "scaled_marks_display": format_marks_display(m.scaled_marks, m.is_absent),
            "status": "Absent" if m.is_absent else "Present",
            "is_absent": bool(m.is_absent),
            "absent_status": "ABSENT" if m.is_absent else "Present"
        }
        for m in marks
    ]

    return {
        "success": True,
        "student_name": first_m.student_name,
        "usn": first_m.usn,
        "department": first_m.department or "Computer Science and Engineering",
        "semester": "5th Semester",
        "section": first_m.section,
        "academic_year": first_m.academic_year or "2024-2025",
        "assessment_name": first_m.assessment_name or "First Internal Assessment",
        "subjects": subjects_data
    }


@router.put("/{mark_id}", response_model=ApiResponse)
def update_mark(
    mark_id: int,
    req: MarkUpdate,
    request: Request,
    current_user: User = Depends(require_any_role("teacher", "hod", "admin")),
    db: Session = Depends(get_db)
):
    """
    Enter or edit subject-wise marks.
    Preserves decimal marks, never replaces AB with zero.
    Supports IA-2 marks entry when available.
    """
    mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark entry not found.")

    if req.is_absent is not None:
        mark.is_absent = req.is_absent
        mark.status = "Absent" if req.is_absent else "Present"
        if req.is_absent:
            mark.obtained_marks = None
            mark.scaled_marks = None

    if req.obtained_marks is not None and not mark.is_absent:
        # Validate marks <= maximum_marks
        if req.obtained_marks < 0 or req.obtained_marks > mark.maximum_marks:
            raise HTTPException(
                status_code=400,
                detail=f"Obtained marks ({req.obtained_marks}) cannot exceed maximum marks ({mark.maximum_marks}) or be negative."
            )
        mark.obtained_marks = req.obtained_marks
        mark.is_absent = False
        mark.status = "Present"

        # Calculate proportional scaled mark if scaled_max_marks exists and not explicitly passed
        if req.scaled_marks is not None:
            mark.scaled_marks = req.scaled_marks
        elif mark.scaled_max_marks:
            mark.scaled_marks = round((req.obtained_marks / mark.maximum_marks) * mark.scaled_max_marks, 2)

    if req.maximum_marks is not None:
        mark.maximum_marks = req.maximum_marks

    if req.notes is not None:
        mark.notes = req.notes

    # IA-2 fields
    if req.ia2_is_absent is not None:
        mark.ia2_is_absent = req.ia2_is_absent
        mark.ia2_status = "Absent" if req.ia2_is_absent else "Present"
        if req.ia2_is_absent:
            mark.ia2_obtained_marks = None

    if req.ia2_obtained_marks is not None:
        mark.ia2_obtained_marks = req.ia2_obtained_marks
        mark.ia2_is_absent = False
        mark.ia2_status = "Present"

    if req.ia2_maximum_marks is not None:
        mark.ia2_maximum_marks = req.ia2_maximum_marks

    db.commit()
    db.refresh(mark)

    try:
        from app.services.email_notification_service import EmailNotificationService
        EmailNotificationService.notify_student_ia_marks(
            db=db,
            student_id_or_usn=mark.usn,
            subject_name=mark.subject_name or mark.subject_code,
            test_type=mark.assessment_name or "Internal Assessment",
            marks_obtained=mark.obtained_marks or 0.0,
            max_marks=mark.maximum_marks or 30.0,
            remarks=mark.notes
        )
    except Exception as e:
        print(f"[NOTIFICATION WARNING] Could not send IA mark notification: {e}")

    log_audit(
        db=db,
        action="UPDATE_MARKS",
        module="Internal Assessment",
        user_id=current_user.id,
        record_id=str(mark.id),
        details=f"Updated marks for {mark.usn} in {mark.subject_code}: Obtained={mark.obtained_marks}, Absent={mark.is_absent}",
        ip_address=get_client_ip(request)
    )

    return ApiResponse(
        success=True,
        message="Marks successfully updated.",
        data=serialize_mark_entry(mark)
    )


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_mark(
    req: MarkCreate,
    request: Request,
    current_user: User = Depends(require_any_role("teacher", "hod", "admin")),
    db: Session = Depends(get_db)
):
    """Create a new internal assessment mark record."""
    usn = req.usn.strip().upper()
    subj_code = req.subject_code.strip()

    # Find matching official subject
    sub_meta = next((s for s in OFFICIAL_SUBJECTS if s["code"] == subj_code), None)
    subj_name = sub_meta["name"] if sub_meta else subj_code
    short_name = sub_meta["short"] if sub_meta else subj_code
    raw_max = sub_meta["raw_max"] if sub_meta else req.maximum_marks
    scaled_max = sub_meta["scaled_max"] if sub_meta else 25.0

    student = db.query(Student).filter(func.upper(Student.usn) == usn).first()

    new_mark = Mark(
        student_id=student.id if student else None,
        usn=usn,
        student_name=student.name if student else usn,
        section=req.section or (student.section if student else "A"),
        semester=req.semester or 5,
        department="Computer Science and Engineering",
        academic_year="2024-2025",
        assessment_name="First Internal Assessment",
        ia_number=req.ia_number or "IA-1",
        subject_code=subj_code,
        subject_name=subj_name,
        short_name=short_name,
        maximum_marks=raw_max,
        obtained_marks=None if req.is_absent else req.obtained_marks,
        scaled_max_marks=scaled_max,
        scaled_marks=None if req.is_absent else req.scaled_marks,
        is_absent=req.is_absent,
        status="Absent" if req.is_absent else "Present",
        notes=req.notes,
        evaluated_by_id=current_user.id
    )
    db.add(new_mark)
    db.commit()
    db.refresh(new_mark)

    try:
        from app.services.email_notification_service import EmailNotificationService
        EmailNotificationService.notify_student_ia_marks(
            db=db,
            student_id_or_usn=new_mark.usn,
            subject_name=new_mark.subject_name or new_mark.subject_code,
            test_type=new_mark.assessment_name or "Internal Assessment",
            marks_obtained=new_mark.obtained_marks or 0.0,
            max_marks=new_mark.maximum_marks or 30.0,
            remarks=new_mark.notes
        )
    except Exception as e:
        print(f"[NOTIFICATION WARNING] Could not send IA mark notification: {e}")

    return ApiResponse(
        success=True,
        message="Mark entry created successfully.",
        data=serialize_mark_entry(new_mark)
    )


@router.post("/import-pdf")
async def import_marks_from_pdf(
    file: UploadFile = File(...),
    section: str = Form("A"),
    semester: str = Form("5"),
    assessment: str = Form("IA1"),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Import marks from the original uploaded college PDF file.
    Extracts student details and scores directly using pdfplumber.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please select a PDF file only.")

    content = await file.read()
    temp_path = f"data/marks/temp_upload_{section}_{file.filename}"
    os.makedirs(os.path.dirname(temp_path), exist_ok=True)
    with open(temp_path, "wb") as f:
        f.write(content)

    try:
        parsed_students = parse_ia_pdf(temp_path, section.upper())
        if not parsed_students:
            raise HTTPException(status_code=400, detail="No student marks table could be extracted from this PDF.")

        # Map assessment code to ia_number
        ia_tag = "IA-1" if assessment.upper() in ("IA1", "IA-1") else ("IA-2" if assessment.upper() in ("IA2", "IA-2") else "IA-3")

        # Sync database
        updated_count = 0
        students_result = []

        for st in parsed_students:
            usn = st["usn"]
            name = st["student_name"]
            sl = st["sl_no"]

            # Ensure student in DB
            student = db.query(Student).filter(func.upper(Student.usn) == usn.upper()).first()
            if not student:
                student = Student(
                    usn=usn,
                    name=name,
                    email=f"{usn.lower()}@college.edu",
                    semester=int(semester) if semester.isdigit() else 5,
                    section=section.upper(),
                    department_id=1,
                    status="active"
                )
                db.add(student)
                db.flush()

            for item in st["marks"]:
                code = item["subject_code"]
                existing = db.query(Mark).filter(
                    Mark.usn == usn,
                    Mark.subject_code == code,
                    Mark.ia_number == ia_tag
                ).first()

                if existing:
                    existing.obtained_marks = item["obtained_marks"]
                    existing.scaled_marks = item["scaled_marks"]
                    existing.is_absent = item["is_absent"]
                    existing.status = item["status"]
                else:
                    new_m = Mark(
                        sl_no=sl,
                        student_id=student.id,
                        usn=usn,
                        student_name=name,
                        section=section.upper(),
                        semester=int(semester) if semester.isdigit() else 5,
                        ia_number=ia_tag,
                        subject_code=code,
                        subject_name=item["subject_name"],
                        short_name=item["short_name"],
                        maximum_marks=item["maximum_marks"],
                        obtained_marks=item["obtained_marks"],
                        scaled_max_marks=item["scaled_max_marks"],
                        scaled_marks=item["scaled_marks"],
                        is_absent=item["is_absent"],
                        status=item["status"]
                    )
                    db.add(new_m)
                updated_count += 1

                # Append to flat students_result list for frontend display
                students_result.append({
                    "sl_no": sl,
                    "student_name": name,
                    "usn": usn,
                    "section": section.upper(),
                    "subject": f"{item['short_name'] or item['subject_name']} ({code})",
                    "marks": "AB" if item["is_absent"] else (item["obtained_marks"] if item["obtained_marks"] is not None else "AB"),
                    "max_marks": int(item["maximum_marks"]) if float(item["maximum_marks"]).is_integer() else item["maximum_marks"]
                })

        db.commit()

        return {
            "success": True,
            "message": f"IA marks PDF uploaded and processed successfully ({len(parsed_students)} students, {updated_count} entries).",
            "students": students_result,
            "students_count": len(parsed_students),
            "marks_updated": updated_count
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@router.get("/export")
def export_marks_csv(
    semester: int = Query(5),
    section: Optional[str] = Query(None),
    subject_code: Optional[str] = Query(None),
    format_type: str = Query("subject-wise", description="'subject-wise' or 'student-wise'"),
    db: Session = Depends(get_db)
):
    """
    Export subject-wise and student-wise marks reports in standard CSV format.
    Preserves exact student names, USNs, section, decimal marks, and ABSENT status.
    """
    query = db.query(Mark).filter(Mark.semester == semester, Mark.ia_number == "IA-1")
    if section and section.upper() in ("A", "B"):
        query = query.filter(Mark.section == section.upper())
    if subject_code:
        query = query.filter(Mark.subject_code == subject_code.strip())

    records = query.order_by(Mark.section.asc(), Mark.sl_no.asc(), Mark.subject_code.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    if format_type == "subject-wise":
        # Format matching prompt's table:
        # Sl. No. | USN | Student Name | Section | Subject Name | Subject Code | IA | Maximum Marks | Obtained Marks | Status
        writer.writerow([
            "Sl. No.", "USN", "Student Name", "Section", "Subject Name",
            "Subject Code", "IA", "Maximum Marks", "Obtained Marks", "Status",
            "Scaled Max Marks", "Scaled Marks"
        ])
        for r in records:
            writer.writerow([
                r.sl_no or "",
                r.usn,
                r.student_name,
                r.section,
                r.subject_name,
                r.subject_code,
                r.ia_number or "IA-1",
                r.maximum_marks,
                "ABSENT" if r.is_absent else (r.obtained_marks if r.obtained_marks is not None else ""),
                "ABSENT" if r.is_absent else "Present",
                r.scaled_max_marks or "",
                "ABSENT" if r.is_absent else (r.scaled_marks if r.scaled_marks is not None else "")
            ])
        filename = f"5th_Sem_IA1_Marks_{section or 'All_Sec'}_{subject_code or 'All_Subjects'}.csv"

    else:
        # Student-wise matrix format with all 6 subjects
        writer.writerow([
            "Sl. No.", "USN", "Student Name", "Section",
            "SE [BCS501] (30)", "CN [BCS502] (30)", "TOC [BCS503] (30)",
            "RM & IPR [BRMK557] (30)", "UNIX [BCS515C] (30)", "ENV [BCS508] (25)"
        ])
        students_map = {}
        for r in records:
            if r.usn not in students_map:
                students_map[r.usn] = {
                    "sl_no": r.sl_no,
                    "usn": r.usn,
                    "name": r.student_name,
                    "section": r.section,
                    "marks": {}
                }
            students_map[r.usn]["marks"][r.subject_code] = "ABSENT" if r.is_absent else (r.obtained_marks if r.obtained_marks is not None else "-")

        for usn, st in students_map.items():
            m = st["marks"]
            writer.writerow([
                st["sl_no"] or "",
                st["usn"],
                st["name"],
                st["section"],
                m.get("BCS501", "-"),
                m.get("BCS502", "-"),
                m.get("BCS503", "-"),
                m.get("BRMK557", "-"),
                m.get("BCS515C", "-"),
                m.get("BCS508", "-")
            ])
        filename = f"5th_Sem_Student_Wise_Marks_Matrix_{section or 'All_Sec'}.csv"

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
