import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.database import get_db
from app.models import (
    StudentActivity, StudentActivityFile, StudentActivityVerification,
    User, Student, Department, Notification
)
from app.schemas.student_activity import (
    StudentActivityCreate, StudentActivityUpdate, StudentActivityOut,
    StudentActivityFileOut, StudentActivityVerificationOut,
    VerifyActivityRequest, RejectActivityRequest, ActivityStatsOut
)
from app.dependencies import get_current_user, require_role, require_any_role
from app.services.notification_service import NotificationService
from app.utils.security import decode_token

router = APIRouter(tags=["Student Activities"])

# Secure private upload directory outside static webroot
if os.environ.get("VERCEL"):
    SECURE_ACTIVITIES_DIR = "/tmp/secure_uploads/activities"
else:
    SECURE_ACTIVITIES_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "secure_uploads", "activities")
    )
try:
    os.makedirs(SECURE_ACTIVITIES_DIR, exist_ok=True)
except Exception:
    pass

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
DISALLOWED_EXTENSIONS = {".exe", ".bat", ".cmd", ".sh", ".js", ".py", ".vbs", ".msi", ".bin"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit


def get_student_for_user(user: User, db: Session) -> Optional[Student]:
    """Retrieve the Student record associated with a student user."""
    if user.student_profile:
        return user.student_profile
    return db.query(Student).filter(
        or_(Student.user_id == user.id, Student.email == user.email)
    ).first()


def format_activity_out(activity: StudentActivity, db: Session) -> dict:
    """Format a StudentActivity into a dictionary matching StudentActivityOut."""
    student = activity.student or db.query(Student).filter(Student.id == activity.student_id).first()
    dept_name = None
    student_name = None
    student_usn = None
    semester = None
    section = None
    department_id = None

    if student:
        student_name = student.name
        student_usn = student.usn or student.student_id
        semester = student.semester
        section = student.section
        department_id = student.department_id
        if student.department:
            dept_name = student.department.name
        elif student.department_id:
            d = db.query(Department).filter(Department.id == student.department_id).first()
            if d:
                dept_name = d.name

    # Format files
    files_out = []
    for f in activity.files:
        files_out.append({
            "id": f.id,
            "activity_id": f.activity_id,
            "file_name": f.file_name,
            "file_path": None,  # Mask the physical storage path for security
            "file_type": f.file_type,
            "file_size": f.file_size,
            "uploaded_at": f.uploaded_at,
            "download_url": f"/api/student-activities/{activity.id}/files/{f.id}/download",
            "view_url": f"/api/student-activities/{activity.id}/files/{f.id}/view",
        })

    # Format verifications
    verifications_out = []
    for v in activity.verifications:
        v_user = v.verifier or (db.query(User).filter(User.id == v.verified_by).first() if v.verified_by else None)
        verifications_out.append({
            "id": v.id,
            "activity_id": v.activity_id,
            "verified_by": v.verified_by,
            "verifier_name": v_user.name if v_user else (v.verification_role.upper() if v.verification_role else "Admin"),
            "verification_role": v.verification_role,
            "status": v.status,
            "rejection_reason": v.rejection_reason,
            "verified_at": v.verified_at,
        })

    latest_ver = verifications_out[0] if verifications_out else None

    return {
        "id": activity.id,
        "student_id": activity.student_id,
        "student_name": student_name,
        "student_usn": student_usn,
        "department_id": department_id,
        "department_name": dept_name or activity.department,
        "semester": semester,
        "section": section,
        "title": activity.title,
        "activity_type": activity.activity_type,
        "description": activity.description,
        "activity_date": activity.activity_date,
        "organizing_institution": activity.organizing_institution,
        "department": activity.department or dept_name,
        "level": activity.level,
        "position_award": activity.position_award,
        "location": activity.location,
        "status": activity.status,
        "remarks": activity.remarks,
        "created_at": activity.created_at,
        "updated_at": activity.updated_at,
        "files": files_out,
        "verifications": verifications_out,
        "latest_verification": latest_ver,
    }


def authenticate_user_optional_token(
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Allow authentication via either Bearer header or token query parameter for file viewing."""
    if current_user:
        return current_user
    if token:
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            email = payload.get("sub")
            if email:
                user = db.query(User).filter(User.email == email).first()
                if user and user.is_active:
                    return user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required to access this file"
    )


# =======================================================================
# 1. LIST ACTIVITIES (Role-Scoped & Filterable)
# =======================================================================
@router.get("/api/student-activities", response_model=List[StudentActivityOut])
def list_student_activities(
    search: Optional[str] = Query(None),
    activity_type: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List activities according to user role permissions:
    - Student: Only their own activities.
    - HOD: Only activities of students in their department.
    - Teacher: Only permitted activities in their department or CSE.
    - Admin: All activities across all departments.
    """
    query = db.query(StudentActivity).join(Student, StudentActivity.student_id == Student.id)

    if current_user.role == "student":
        stud = get_student_for_user(current_user, db)
        if not stud:
            return []
        query = query.filter(StudentActivity.student_id == stud.id)
    elif current_user.role == "hod":
        # Strictly enforce HOD's own department
        dept_id = current_user.department_id
        if not dept_id:
            # Fallback check faculty profile
            if current_user.faculty_profile and current_user.faculty_profile.department_id:
                dept_id = current_user.faculty_profile.department_id
        if dept_id:
            query = query.filter(Student.department_id == dept_id)
        else:
            query = query.filter(1 == 0)
    elif current_user.role == "teacher":
        dept_id = current_user.department_id
        if dept_id:
            query = query.filter(Student.department_id == dept_id)
    # Admin has no role filter

    # Additional user query filters
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if student_id:
        if current_user.role == "student":
            stud = get_student_for_user(current_user, db)
            if not stud or stud.id != student_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another student's activities")
        query = query.filter(StudentActivity.student_id == student_id)
    if activity_type and activity_type != "All":
        query = query.filter(StudentActivity.activity_type.ilike(f"%{activity_type}%"))
    if level and level != "All":
        query = query.filter(StudentActivity.level.ilike(f"%{level}%"))
    if status and status != "All":
        query = query.filter(StudentActivity.status == status.upper())
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                StudentActivity.title.ilike(s),
                StudentActivity.organizing_institution.ilike(s),
                Student.name.ilike(s),
                Student.usn.ilike(s),
                Student.student_id.ilike(s),
            )
        )

    activities = query.order_by(StudentActivity.created_at.desc()).all()
    return [format_activity_out(act, db) for act in activities]


# =======================================================================
# 2. ACTIVITY STATS & SUMMARY (For Student Profile & Dashboard)
# =======================================================================
@router.get("/api/student-activities/stats/summary", response_model=ActivityStatsOut)
def get_activity_stats_summary(
    student_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve statistical summary for profile badges and dashboard counters."""
    query = db.query(StudentActivity).join(Student, StudentActivity.student_id == Student.id)

    target_student_id = student_id
    if current_user.role == "student":
        stud = get_student_for_user(current_user, db)
        if not stud:
            return ActivityStatsOut()
        target_student_id = stud.id
        query = query.filter(StudentActivity.student_id == target_student_id)
    elif target_student_id:
        target_student = db.query(Student).filter(Student.id == target_student_id).first()
        if not target_student:
            raise HTTPException(status_code=404, detail="Student not found")
        if current_user.role == "hod" and current_user.department_id != target_student.department_id:
            raise HTTPException(status_code=403, detail="Unauthorized: HOD cannot view stats of another department")
        query = query.filter(StudentActivity.student_id == target_student_id)
    elif current_user.role == "hod":
        if current_user.department_id:
            query = query.filter(Student.department_id == current_user.department_id)

    activities = query.all()

    total = len(activities)
    verified = sum(1 for a in activities if a.status == "VERIFIED")
    pending = sum(1 for a in activities if a.status == "PENDING")
    rejected = sum(1 for a in activities if a.status == "REJECTED")

    # Certificates count (total uploaded files for these activities)
    act_ids = [a.id for a in activities]
    files_count = db.query(StudentActivityFile).filter(StudentActivityFile.activity_id.in_(act_ids)).count() if act_ids else 0

    # Awards count (position_award is not null and not empty, or position_award not "Participant")
    awards = sum(1 for a in activities if a.position_award and a.position_award.strip() and a.position_award.lower() not in ("none", "-", "n/a", "nil"))

    # Breakdown by category
    def count_by_type(act_list, keywords):
        return sum(1 for a in act_list if any(kw.lower() in (a.activity_type or "").lower() for kw in keywords))

    competitions = count_by_type(activities, ["Competition", "Hackathon"])
    sports = count_by_type(activities, ["Sport"])
    cultural = count_by_type(activities, ["Cultural", "Club"])
    technical = count_by_type(activities, ["Technical", "Hackathon", "Project", "Certification"])
    workshops = count_by_type(activities, ["Workshop"])
    seminars = count_by_type(activities, ["Seminar", "Conference"])
    internships = count_by_type(activities, ["Internship"])
    projects = count_by_type(activities, ["Project"])
    other = count_by_type(activities, ["Other", "Volunteering", "Academic"])

    return ActivityStatsOut(
        total_activities=total,
        total_achievements=verified,  # Verified achievements
        verified_achievements=verified,
        pending_verification=pending,
        rejected=rejected,
        certificates_count=files_count,
        awards_count=awards,
        competitions=competitions,
        sports=sports,
        cultural=cultural,
        technical=technical,
        workshops=workshops,
        seminars=seminars,
        internships=internships,
        projects=projects,
        other_activities=other,
    )


# =======================================================================
# 3. GET SINGLE ACTIVITY DETAILS
# =======================================================================
@router.get("/api/student-activities/{activity_id}", response_model=StudentActivityOut)
def get_student_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full activity details including attached files and verification history."""
    activity = db.query(StudentActivity).filter(StudentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    student = db.query(Student).filter(Student.id == activity.student_id).first()

    # Enforce role-based security
    if current_user.role == "student":
        cur_stud = get_student_for_user(current_user, db)
        if not cur_stud or cur_stud.id != activity.student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view another student's activity"
            )
    elif current_user.role == "hod":
        if student and current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOD cannot view activities belonging to another department"
            )

    return format_activity_out(activity, db)


# =======================================================================
# 4. CREATE ACTIVITY (Student only, initial status PENDING)
# =======================================================================
@router.post("/api/student-activities", response_model=StudentActivityOut, status_code=status.HTTP_201_CREATED)
def create_student_activity(
    payload: StudentActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new student activity submission.
    Status is strictly set to PENDING; student cannot self-verify.
    Dispatches notifications to Admin and Department HOD.
    """
    if current_user.role != "student":
        # If admin wants to add for testing, find first student
        if current_user.role == "admin":
            stud = db.query(Student).first()
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only students can submit activity records."
            )
    else:
        stud = get_student_for_user(current_user, db)

    if not stud:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile not found for the logged in user."
        )

    # Department name from student's department if not provided
    dept_name = payload.department
    if not dept_name and stud.department:
        dept_name = stud.department.name

    new_act = StudentActivity(
        student_id=stud.id,
        title=payload.title,
        activity_type=payload.activity_type,
        description=payload.description,
        activity_date=payload.activity_date,
        organizing_institution=payload.organizing_institution,
        department=dept_name,
        level=payload.level,
        position_award=payload.position_award,
        location=payload.location,
        status="PENDING",  # Strictly PENDING
        remarks=payload.remarks,
    )
    db.add(new_act)
    db.commit()
    db.refresh(new_act)

    # Dispatch notifications to Admin and HOD of this student's department
    try:
        # Notify HOD of student's department
        if stud.department_id:
            hod_users = db.query(User).filter(
                User.role == "hod",
                User.department_id == stud.department_id,
                User.is_active == True
            ).all()
            for h in hod_users:
                NotificationService.send_notification(
                    db=db,
                    user_id=h.id,
                    title="New Achievement Submitted",
                    message="New student achievement submitted for verification.",
                    category="Achievement",
                    link="/hod/student-activities"
                )

        # Notify Admins
        admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
        for a in admins:
            NotificationService.send_notification(
                db=db,
                user_id=a.id,
                title="New Achievement Submitted",
                message=f"New achievement submitted by {stud.name} for verification.",
                category="Achievement",
                link="/admin/student-activities"
            )
    except Exception as err:
        print(f"Notification error on activity submission: {err}")

    return format_activity_out(new_act, db)


# =======================================================================
# 5. EDIT ACTIVITY (Student can edit PENDING or resubmit REJECTED)
# =======================================================================
@router.put("/api/student-activities/{activity_id}", response_model=StudentActivityOut)
def update_student_activity(
    activity_id: int,
    payload: StudentActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Edit activity record:
    - PENDING: Student can edit.
    - REJECTED: Student editing triggers resubmission back to PENDING.
    - VERIFIED: Modification is strictly blocked.
    """
    activity = db.query(StudentActivity).filter(StudentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    student = db.query(Student).filter(Student.id == activity.student_id).first()

    # Permissions check
    if current_user.role == "student":
        cur_stud = get_student_for_user(current_user, db)
        if not cur_stud or cur_stud.id != activity.student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot edit another student's activity"
            )
        # Cannot directly modify verified record
        if activity.status == "VERIFIED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verified records cannot be directly edited. Please contact your department HOD or Admin."
            )
    elif current_user.role not in ("admin", "hod"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    # Update provided fields
    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(activity, field, val)

    # If status was REJECTED and student edited it, resubmit to PENDING!
    was_rejected = (activity.status == "REJECTED")
    if was_rejected:
        activity.status = "PENDING"
        activity.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(activity)

    if was_rejected:
        # Notify HOD / Admin about resubmission
        try:
            if student and student.department_id:
                hod_users = db.query(User).filter(
                    User.role == "hod",
                    User.department_id == student.department_id
                ).all()
                for h in hod_users:
                    NotificationService.send_notification(
                        db=db,
                        user_id=h.id,
                        title="Achievement Resubmitted",
                        message=f"Achievement '{activity.title}' resubmitted for verification by {student.name}.",
                        category="Achievement",
                        link="/hod/student-activities"
                    )
        except Exception as e:
            print(f"Notification error on resubmission: {e}")

    return format_activity_out(activity, db)


# =======================================================================
# 6. DELETE ACTIVITY (PENDING only for student; Admin can delete any)
# =======================================================================
@router.delete("/api/student-activities/{activity_id}")
def delete_student_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete activity:
    - Student: can only delete their own PENDING activities.
    - Admin: can delete any inappropriate record.
    """
    activity = db.query(StudentActivity).filter(StudentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    if current_user.role == "student":
        cur_stud = get_student_for_user(current_user, db)
        if not cur_stud or cur_stud.id != activity.student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
        if activity.status == "VERIFIED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete verified activity records."
            )
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin or owning Student can delete activities")

    # Clean up physical files from disk
    for f in activity.files:
        try:
            if f.file_path and os.path.exists(f.file_path):
                os.remove(f.file_path)
        except Exception as err:
            print(f"Error deleting file {f.file_path}: {err}")

    db.delete(activity)
    db.commit()
    return {"success": True, "message": "Activity deleted successfully"}


# =======================================================================
# 7. UPLOAD EVIDENCE / CERTIFICATE
# =======================================================================
@router.post("/api/student-activities/{activity_id}/upload", response_model=StudentActivityFileOut)
async def upload_activity_evidence(
    activity_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload certificate or evidence file (PDF, JPG, JPEG, PNG).
    Validates file extension and size. Blocks executable files (.exe, .sh, .bat, etc.).
    Stores file securely outside public directory.
    """
    activity = db.query(StudentActivity).filter(StudentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    # Security check: owning student or admin
    if current_user.role == "student":
        cur_stud = get_student_for_user(current_user, db)
        if not cur_stud or cur_stud.id != activity.student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to upload to this activity")
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    original_filename = file.filename or "evidence"
    ext = os.path.splitext(original_filename)[1].lower()

    if ext in DISALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security alert: Executable file type '{ext}' is prohibited."
        )

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Supported formats: PDF, JPG, JPEG, PNG."
        )

    # Read content to validate size
    contents = await file.read()
    file_size = len(contents)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 10MB ({file_size / (1024*1024):.2f}MB provided)."
        )

    # Sanitize and generate safe storage filename
    safe_name = f"{uuid.uuid4().hex}_{original_filename.replace(' ', '_')}"
    destination_path = os.path.join(SECURE_ACTIVITIES_DIR, safe_name)

    with open(destination_path, "wb") as out_file:
        out_file.write(contents)

    # Determine MIME type
    mime = "application/pdf" if ext == ".pdf" else f"image/{ext.replace('.', '')}"
    if ext == ".jpg":
        mime = "image/jpeg"

    act_file = StudentActivityFile(
        activity_id=activity.id,
        file_name=original_filename,
        file_path=destination_path,
        file_type=mime,
        file_size=file_size,
    )
    db.add(act_file)
    db.commit()
    db.refresh(act_file)

    return {
        "id": act_file.id,
        "activity_id": act_file.activity_id,
        "file_name": act_file.file_name,
        "file_path": None,
        "file_type": act_file.file_type,
        "file_size": act_file.file_size,
        "uploaded_at": act_file.uploaded_at,
        "download_url": f"/api/student-activities/{activity.id}/files/{act_file.id}/download",
        "view_url": f"/api/student-activities/{activity.id}/files/{act_file.id}/view",
    }


# =======================================================================
# 8. GET ACTIVITY FILES
# =======================================================================
@router.get("/api/student-activities/{activity_id}/files", response_model=List[StudentActivityFileOut])
def get_activity_files(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve list of files attached to an activity."""
    activity = db.query(StudentActivity).filter(StudentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    student = db.query(Student).filter(Student.id == activity.student_id).first()

    if current_user.role == "student":
        cur_stud = get_student_for_user(current_user, db)
        if not cur_stud or cur_stud.id != activity.student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student must not access another student's private activity files."
            )
    elif current_user.role == "hod":
        if student and current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    res = []
    for f in activity.files:
        res.append({
            "id": f.id,
            "activity_id": f.activity_id,
            "file_name": f.file_name,
            "file_path": None,
            "file_type": f.file_type,
            "file_size": f.file_size,
            "uploaded_at": f.uploaded_at,
            "download_url": f"/api/student-activities/{activity.id}/files/{f.id}/download",
            "view_url": f"/api/student-activities/{activity.id}/files/{f.id}/view",
        })
    return res


# =======================================================================
# 9. SECURE FILE DOWNLOAD & PREVIEW ENDPOINTS
# =======================================================================
@router.get("/api/student-activities/{activity_id}/files/{file_id}/download")
def download_activity_file(
    activity_id: int,
    file_id: int,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Secure, authenticated file download. Checks ownership and permissions."""
    # Resolve user
    user = current_user
    if not user and token:
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            email = payload.get("sub")
            user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    activity = db.query(StudentActivity).filter(StudentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    act_file = db.query(StudentActivityFile).filter(
        StudentActivityFile.id == file_id,
        StudentActivityFile.activity_id == activity_id
    ).first()
    if not act_file:
        raise HTTPException(status_code=404, detail="File record not found")

    student = db.query(Student).filter(Student.id == activity.student_id).first()

    # Permission check: Student must be owner, HOD must be same dept, Admin any
    if user.role == "student":
        cur_stud = get_student_for_user(user, db)
        if not cur_stud or cur_stud.id != activity.student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student must not access another student's private activity files."
            )
    elif user.role == "hod":
        if student and user.department_id and student.department_id != user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOD cannot download evidence belonging to another department."
            )

    if not os.path.exists(act_file.file_path):
        raise HTTPException(status_code=404, detail="Physical file missing on server storage")

    return FileResponse(
        path=act_file.file_path,
        filename=act_file.file_name,
        media_type=act_file.file_type or "application/octet-stream"
    )


@router.get("/api/student-activities/{activity_id}/files/{file_id}/view")
def view_activity_file(
    activity_id: int,
    file_id: int,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Secure, authenticated preview for PDF and Images inline."""
    user = current_user
    if not user and token:
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            email = payload.get("sub")
            user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    activity = db.query(StudentActivity).filter(StudentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    act_file = db.query(StudentActivityFile).filter(
        StudentActivityFile.id == file_id,
        StudentActivityFile.activity_id == activity_id
    ).first()
    if not act_file:
        raise HTTPException(status_code=404, detail="File record not found")

    student = db.query(Student).filter(Student.id == activity.student_id).first()

    if user.role == "student":
        cur_stud = get_student_for_user(user, db)
        if not cur_stud or cur_stud.id != activity.student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student must not access another student's private activity files."
            )
    elif user.role == "hod":
        if student and user.department_id and student.department_id != user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOD cannot view evidence belonging to another department."
            )

    if not os.path.exists(act_file.file_path):
        raise HTTPException(status_code=404, detail="Physical file missing on server storage")

    mime = act_file.file_type or "application/pdf"
    return FileResponse(
        path=act_file.file_path,
        media_type=mime,
        headers={"Content-Disposition": f"inline; filename={act_file.file_name}"}
    )


# =======================================================================
# 10. VERIFY ACTIVITY (Admin or HOD of own department)
# =======================================================================
@router.post("/api/student-activities/{activity_id}/verify", response_model=StudentActivityOut)
def verify_student_activity(
    activity_id: int,
    payload: Optional[VerifyActivityRequest] = None,
    current_user: User = Depends(require_any_role(["admin", "hod"])),
    db: Session = Depends(get_db)
):
    """
    Verify student achievement:
    - Admin: can verify any.
    - HOD: strictly enforced that current_user.department_id == student.department_id.
    - Persists verification in student_activity_verifications.
    - Notifies the student.
    """
    activity = db.query(StudentActivity).filter(StudentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    student = db.query(Student).filter(Student.id == activity.student_id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Associated student record missing")

    # Strict HOD Department Check
    if current_user.role == "hod":
        hod_dept = current_user.department_id
        if not hod_dept and current_user.faculty_profile:
            hod_dept = current_user.faculty_profile.department_id

        if not hod_dept or hod_dept != student.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOD must NOT verify another department's student achievements. Permission denied."
            )

    activity.status = "VERIFIED"
    activity.updated_at = datetime.datetime.utcnow()

    verification = StudentActivityVerification(
        activity_id=activity.id,
        verified_by=current_user.id,
        verification_role=current_user.role,
        status="VERIFIED",
        rejection_reason=None,
        verified_at=datetime.datetime.utcnow(),
    )
    db.add(verification)
    db.commit()
    db.refresh(activity)

    # Dispatch notification to the student user
    try:
        student_user_id = student.user_id
        if not student_user_id:
            u = db.query(User).filter(User.email == student.email).first()
            if u:
                student_user_id = u.id

        if student_user_id:
            NotificationService.send_notification(
                db=db,
                user_id=student_user_id,
                title="Achievement Verified",
                message="Your achievement has been verified.",
                category="Achievement",
                link=f"/student/activities/{activity.id}"
            )
    except Exception as e:
        print(f"Error sending verification notification: {e}")

    return format_activity_out(activity, db)


# =======================================================================
# 11. REJECT ACTIVITY (Admin or HOD of own department, Requires Reason)
# =======================================================================
@router.post("/api/student-activities/{activity_id}/reject", response_model=StudentActivityOut)
def reject_student_activity(
    activity_id: int,
    payload: RejectActivityRequest,
    current_user: User = Depends(require_any_role(["admin", "hod"])),
    db: Session = Depends(get_db)
):
    """
    Reject student achievement with required reason:
    - Admin: can reject any.
    - HOD: strictly enforced that current_user.department_id == student.department_id.
    - Persists rejection reason.
    - Notifies the student with the reason.
    """
    if not payload.rejection_reason or not payload.rejection_reason.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rejection reason is required."
        )

    activity = db.query(StudentActivity).filter(StudentActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    student = db.query(Student).filter(Student.id == activity.student_id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Associated student record missing")

    # Strict HOD Department Check
    if current_user.role == "hod":
        hod_dept = current_user.department_id
        if not hod_dept and current_user.faculty_profile:
            hod_dept = current_user.faculty_profile.department_id

        if not hod_dept or hod_dept != student.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOD must NOT reject another department's student achievements. Permission denied."
            )

    activity.status = "REJECTED"
    activity.updated_at = datetime.datetime.utcnow()

    verification = StudentActivityVerification(
        activity_id=activity.id,
        verified_by=current_user.id,
        verification_role=current_user.role,
        status="REJECTED",
        rejection_reason=payload.rejection_reason.strip(),
        verified_at=datetime.datetime.utcnow(),
    )
    db.add(verification)
    db.commit()
    db.refresh(activity)

    # Dispatch notification to student with reason
    try:
        student_user_id = student.user_id
        if not student_user_id:
            u = db.query(User).filter(User.email == student.email).first()
            if u:
                student_user_id = u.id

        if student_user_id:
            NotificationService.send_notification(
                db=db,
                user_id=student_user_id,
                title="Achievement Rejected",
                message=f"Your achievement was rejected. Reason: {payload.rejection_reason.strip()}",
                category="Achievement",
                link=f"/student/activities/{activity.id}"
            )
    except Exception as e:
        print(f"Error sending rejection notification: {e}")

    return format_activity_out(activity, db)


# =======================================================================
# 12. GET ACTIVITIES FOR SPECIFIC STUDENT
# =======================================================================
@router.get("/api/students/{student_id}/activities", response_model=List[StudentActivityOut])
def get_activities_for_student(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get activities for specific student:
    - Student: only allowed for their own student_id (403 otherwise).
    - HOD: only allowed for students in their department (403 otherwise).
    - Admin: allowed.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if current_user.role == "student":
        cur_stud = get_student_for_user(current_user, db)
        if not cur_stud or cur_stud.id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student must NOT access another student's activities"
            )
    elif current_user.role == "hod":
        if current_user.department_id and student.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HOD cannot access achievements belonging to another department"
            )

    activities = (
        db.query(StudentActivity)
        .filter(StudentActivity.student_id == student_id)
        .order_by(StudentActivity.created_at.desc())
        .all()
    )
    return [format_activity_out(act, db) for act in activities]


# =======================================================================
# 13. ADMIN STUDENT ACTIVITIES DASHBOARD ENDPOINT
# =======================================================================
@router.get("/api/admin/student-activities")
def admin_student_activities_dashboard(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Admin verification dashboard overview with all activities and stats.
    """
    all_acts = (
        db.query(StudentActivity)
        .order_by(StudentActivity.created_at.desc())
        .all()
    )

    total = len(all_acts)
    verified = sum(1 for a in all_acts if a.status == "VERIFIED")
    pending = sum(1 for a in all_acts if a.status == "PENDING")
    rejected = sum(1 for a in all_acts if a.status == "REJECTED")

    return {
        "statistics": {
            "total_activities": total,
            "verified": verified,
            "pending": pending,
            "rejected": rejected,
        },
        "activities": [format_activity_out(a, db) for a in all_acts]
    }


# =======================================================================
# 14. HOD STUDENT ACTIVITIES DASHBOARD ENDPOINT
# =======================================================================
@router.get("/api/hod/student-activities")
def hod_student_activities_dashboard(
    current_user: User = Depends(require_role("hod")),
    db: Session = Depends(get_db)
):
    """
    HOD verification dashboard overview scoped strictly to HOD's department.
    """
    dept_id = current_user.department_id
    if not dept_id and current_user.faculty_profile:
        dept_id = current_user.faculty_profile.department_id

    if not dept_id:
        return {
            "department": None,
            "statistics": {"total_activities": 0, "verified": 0, "pending": 0, "rejected": 0},
            "activities": []
        }

    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_acts = (
        db.query(StudentActivity)
        .join(Student, StudentActivity.student_id == Student.id)
        .filter(Student.department_id == dept_id)
        .order_by(StudentActivity.created_at.desc())
        .all()
    )

    total = len(dept_acts)
    verified = sum(1 for a in dept_acts if a.status == "VERIFIED")
    pending = sum(1 for a in dept_acts if a.status == "PENDING")
    rejected = sum(1 for a in dept_acts if a.status == "REJECTED")

    return {
        "department": {"id": dept.id, "name": dept.name, "code": dept.code} if dept else None,
        "statistics": {
            "total_activities": total,
            "verified": verified,
            "pending": pending,
            "rejected": rejected,
        },
        "activities": [format_activity_out(a, db) for a in dept_acts]
    }
