from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

from app.database import get_db
from app.models.attendance import Attendance
from app.models.attendance_session import AttendanceSession
from app.models.attendance_interval import AttendanceInterval
from app.models.student_attendance import StudentAttendance
from app.models.student import Student
from app.models.timetable import Timetable
from app.models.teacher import Teacher
from app.models.subject import Subject
from app.models.user import User
from app.schemas.attendance import (
    SessionAttendanceSubmit,
    SessionDetailsResponse,
    StudentSessionItem,
    SessionAttendanceResponse,
    AttendanceIntervalOut,
    IntervalStudentItem,
    AttendanceUpdate,
    AttendanceOut,
    StudentAttendanceSummary,
    SubjectAttendanceStat,
    AttendancePercentageOut,
)
from app.dependencies import get_current_user, require_role, require_any_role
from app.utils.response import success_response

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def get_user_teacher_id(user: User, db: Session) -> Optional[int]:
    """Helper to resolve a teacher's ID from user profile or email/name match."""
    if user.teacher_id:
        return user.teacher_id
    teacher = db.query(Teacher).filter(
        (Teacher.email == user.email) | (Teacher.name == user.name)
    ).first()
    return teacher.id if teacher else None


def split_into_30min_intervals(start_time_str: str, end_time_str: str) -> List[Dict[str, Any]]:
    """
    Divides any timetable duration into consecutive 30-minute attendance durations.
    09:00 - 10:00 -> 09:00-09:30 (Duration 1), 09:30-10:00 (Duration 2)
    09:00 - 11:00 -> 4 intervals
    14:00 - 16:00 -> 4 intervals
    """
    try:
        t_start = datetime.strptime(start_time_str.strip(), "%H:%M")
        t_end = datetime.strptime(end_time_str.strip(), "%H:%M")
    except Exception:
        # Fallback if time format is non-standard
        return [{
            "duration_number": 1,
            "start_time": start_time_str,
            "end_time": end_time_str,
            "duration_minutes": 60
        }]

    intervals = []
    current = t_start
    duration_number = 1

    while current < t_end:
        next_step = current + timedelta(minutes=30)
        if next_step > t_end:
            step_end = t_end
            dur_mins = max(1, int((step_end - current).total_seconds() / 60))
        else:
            step_end = next_step
            dur_mins = 30

        intervals.append({
            "duration_number": duration_number,
            "start_time": current.strftime("%H:%M"),
            "end_time": step_end.strftime("%H:%M"),
            "duration_minutes": dur_mins
        })
        current = next_step
        duration_number += 1

    return intervals


def get_or_create_session(slot: Timetable, session_date: str, db: Session) -> AttendanceSession:
    """Finds or creates AttendanceSession and its 30-minute intervals."""
    att_session = db.query(AttendanceSession).filter(
        AttendanceSession.timetable_id == slot.id,
        AttendanceSession.date == session_date
    ).first()

    if not att_session:
        att_session = AttendanceSession(
            timetable_id=slot.id,
            date=session_date,
            start_time=slot.start_time,
            end_time=slot.end_time,
            created_at=datetime.utcnow()
        )
        db.add(att_session)
        db.commit()
        db.refresh(att_session)

        # Generate 30-minute intervals
        intervals_data = split_into_30min_intervals(slot.start_time, slot.end_time)
        for idata in intervals_data:
            interval = AttendanceInterval(
                attendance_session_id=att_session.id,
                duration_number=idata["duration_number"],
                start_time=idata["start_time"],
                end_time=idata["end_time"],
                duration_minutes=idata["duration_minutes"]
            )
            db.add(interval)
        db.commit()
        db.refresh(att_session)
    elif not att_session.intervals:
        # Generate missing intervals
        intervals_data = split_into_30min_intervals(slot.start_time, slot.end_time)
        for idata in intervals_data:
            interval = AttendanceInterval(
                attendance_session_id=att_session.id,
                duration_number=idata["duration_number"],
                start_time=idata["start_time"],
                end_time=idata["end_time"],
                duration_minutes=idata["duration_minutes"]
            )
            db.add(interval)
        db.commit()
        db.refresh(att_session)

    return att_session


# ==========================================================
# 1. GET ATTENDANCE SESSION BY TIMETABLE ID
# ==========================================================
@router.get("/session/{timetable_id}")
def get_attendance_session(
    timetable_id: int,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/attendance/session/{timetable_id}
    Retrieves the timetable session details and 30-minute intervals.
    Loads every student of that timetable class (department, semester, section).
    Strictly verifies teacher authorization.
    """
    slot = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
        joinedload(Timetable.department),
    ).filter(Timetable.id == timetable_id).first()

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timetable session #{timetable_id} not found."
        )

    # Teacher Authorization Check: teacher can take attendance ONLY if logged_in_teacher_id == timetable.teacher_id
    if current_user.role.lower() == "teacher":
        teach_id = get_user_teacher_id(current_user, db)
        if teach_id != slot.teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this timetable session."
            )

    now = datetime.now()
    session_date = date if date else now.strftime("%Y-%m-%d")

    # Ensure AttendanceSession and 30-minute intervals exist
    att_session = get_or_create_session(slot, session_date, db)

    # Load ALL students belonging to this semester and section (No student skipped!)
    query = db.query(Student).filter(
        Student.semester == slot.semester,
        Student.section == slot.section
    )
    if slot.department_id:
        query = query.filter(Student.department_id == slot.department_id)
    students = query.order_by(Student.usn.asc(), Student.name.asc()).all()

    # Load existing attendance records for intervals
    interval_records = db.query(StudentAttendance).filter(
        StudentAttendance.attendance_session_id == att_session.id
    ).all()

    # Map: (interval_id, student_id) -> record
    interval_att_map = {(r.attendance_interval_id, r.student_id): r for r in interval_records}

    # Also check legacy Attendance table
    legacy_records = db.query(Attendance).filter(
        Attendance.timetable_id == slot.id,
        Attendance.date == session_date
    ).all()
    legacy_map = {r.student_id: r for r in legacy_records}

    intervals_out = []
    total_conducted_mins = 0
    total_present_mins = 0
    total_absent_mins = 0
    has_any_records = (len(interval_records) > 0) or (len(legacy_records) > 0)

    for interval in att_session.intervals:
        dur_mins = interval.duration_minutes or 30
        int_students = []
        int_present = 0
        int_absent = 0

        for s in students:
            rec = interval_att_map.get((interval.id, s.id))
            if rec:
                s_status = rec.status
                s_method = getattr(rec, "attendance_method", "MANUAL") or "MANUAL"
                s_time = rec.marked_at.strftime("%H:%M") if rec.marked_at else None
            elif s.id in legacy_map:
                s_status = legacy_map[s.id].status
                s_method = getattr(legacy_map[s.id], "attendance_method", "MANUAL") or "MANUAL"
                s_time = legacy_map[s.id].marked_at.strftime("%H:%M") if legacy_map[s.id].marked_at else None
            else:
                s_status = "Present"
                s_method = "MANUAL"
                s_time = None

            if s_status == "Present":
                int_present += 1
                if has_any_records:
                    total_present_mins += dur_mins
            else:
                int_absent += 1
                if has_any_records:
                    total_absent_mins += dur_mins

            if has_any_records:
                total_conducted_mins += dur_mins

            int_students.append(IntervalStudentItem(
                id=s.id,
                student_id=s.id,
                roll_no=s.usn or s.student_id or f"ST-{s.id}",
                name=s.name,
                status=s_status,
                attendance_method=s_method,
                time=s_time,
                marked_at=rec.marked_at if rec else None
            ))

        intervals_out.append(AttendanceIntervalOut(
            id=interval.id,
            attendance_session_id=att_session.id,
            duration_number=interval.duration_number,
            start_time=interval.start_time,
            end_time=interval.end_time,
            duration_minutes=dur_mins,
            present_count=int_present if has_any_records else len(students),
            absent_count=int_absent if has_any_records else 0,
            students=int_students
        ))

    # Build student session items
    student_items = []
    present_cnt = 0
    absent_cnt = 0

    for s in students:
        interval_statuses = {}
        interval_methods = {}
        last_time = None
        last_method = "MANUAL"

        for interval in att_session.intervals:
            rec = interval_att_map.get((interval.id, s.id))
            if rec:
                interval_statuses[str(interval.duration_number)] = rec.status
                m = getattr(rec, "attendance_method", "MANUAL") or "MANUAL"
                interval_methods[str(interval.duration_number)] = m
                last_method = m
                if rec.marked_at:
                    last_time = rec.marked_at.strftime("%H:%M")
            elif s.id in legacy_map:
                interval_statuses[str(interval.duration_number)] = legacy_map[s.id].status
                m = getattr(legacy_map[s.id], "attendance_method", "MANUAL") or "MANUAL"
                interval_methods[str(interval.duration_number)] = m
                last_method = m
                if legacy_map[s.id].marked_at:
                    last_time = legacy_map[s.id].marked_at.strftime("%H:%M")
            else:
                interval_statuses[str(interval.duration_number)] = "Present"
                interval_methods[str(interval.duration_number)] = "MANUAL"

        # Overall student status for session
        overall_stat = "Present" if all(v == "Present" for v in interval_statuses.values()) else "Absent"
        if overall_stat == "Present":
            present_cnt += 1
        else:
            absent_cnt += 1

        student_items.append(StudentSessionItem(
            id=s.id,
            student_id=s.id,
            roll_no=s.usn or s.student_id or f"ST-{s.id}",
            name=s.name,
            status=overall_stat,
            attendance_method=last_method if overall_stat == "Present" else "-",
            time=last_time if overall_stat == "Present" else "-",
            attendance_id=legacy_map.get(s.id).id if s.id in legacy_map else None,
            interval_statuses=interval_statuses,
            interval_methods=interval_methods
        ))

    time_str = f"{slot.start_time} - {slot.end_time}"
    calc_percentage = round((total_present_mins / total_conducted_mins * 100), 1) if total_conducted_mins > 0 else 100.0

    resp = SessionDetailsResponse(
        timetable_id=slot.id,
        session_id=att_session.id,
        subject_id=slot.subject_id,
        subject_name=slot.subject.subject_name if slot.subject else "Subject",
        subject_code=slot.subject.subject_code if slot.subject else None,
        teacher_id=slot.teacher_id,
        teacher_name=slot.teacher.name if slot.teacher else "Teacher",
        semester=slot.semester or 5,
        section=slot.section or "A",
        room_name=slot.room.room_name if slot.room else None,
        date=session_date,
        time=time_str,
        start_time=slot.start_time,
        end_time=slot.end_time,
        day=slot.day,
        attendance_completed=has_any_records,
        total_students=len(students),
        present_count=present_cnt if has_any_records else len(students),
        absent_count=absent_cnt if has_any_records else 0,
        conducted_minutes=total_conducted_mins,
        present_minutes=total_present_mins,
        absent_minutes=total_absent_mins,
        attendance_percentage=calc_percentage,
        intervals=intervals_out,
        students=student_items
    )
    return success_response(data=resp.model_dump(), message="Attendance session loaded successfully")


# ==========================================================
# 2. SUBMIT ATTENDANCE FOR A TIMETABLE SESSION (30-MIN INTERVALS)
# ==========================================================
@router.post("/session/{timetable_id}")
def submit_attendance_session(
    timetable_id: int,
    payload: SessionAttendanceSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher", "faculty"))
):
    """
    POST /api/attendance/session/{timetable_id}
    Submit attendance for a timetable session, divided into 30-minute intervals.
    Teacher Authorization: logged_in_teacher_id == timetable.teacher_id
    Duplicate Prevention: student_id + timetable_id + date + duration_number
    """
    slot = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher),
        joinedload(Timetable.room),
    ).filter(Timetable.id == timetable_id).first()

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timetable session #{timetable_id} not found."
        )

    # Teacher Authorization Check
    if current_user.role.lower() == "teacher":
        teach_id = get_user_teacher_id(current_user, db)
        if teach_id != slot.teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this timetable session."
            )

    now = datetime.now()
    session_date = payload.date if payload.date else now.strftime("%Y-%m-%d")

    # Get or create AttendanceSession & intervals
    att_session = get_or_create_session(slot, session_date, db)
    intervals = att_session.intervals

    # Check for duplicate submission
    existing_intervals_count = db.query(StudentAttendance).filter(
        StudentAttendance.attendance_session_id == att_session.id
    ).count()

    existing_legacy_count = db.query(Attendance).filter(
        Attendance.timetable_id == slot.id,
        Attendance.date == session_date
    ).count()

    if existing_intervals_count > 0 or existing_legacy_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance has already been submitted for this session."
        )

    students_in_class = db.query(Student).filter(
        Student.semester == slot.semester,
        Student.section == slot.section
    ).all()
    student_map = {s.id: s for s in students_in_class}

    total_present_records = 0
    total_absent_records = 0
    total_conducted_mins = 0
    total_present_mins = 0
    total_absent_mins = 0

    # 1. If payload contains intervals explicitly
    if payload.intervals:
        for int_sub in payload.intervals:
            target_interval = None
            if int_sub.interval_id:
                target_interval = next((i for i in intervals if i.id == int_sub.interval_id), None)
            elif int_sub.duration_number:
                target_interval = next((i for i in intervals if i.duration_number == int_sub.duration_number), None)
            if not target_interval and intervals:
                target_interval = intervals[0]

            if not target_interval:
                continue

            dur_mins = target_interval.duration_minutes or 30

            for item in int_sub.attendance:
                status_clean = "Present" if (item.status or "").strip().capitalize() == "Present" else "Absent"
                method_clean = (getattr(item, "attendance_method", None) or payload.attendance_method or "MANUAL").strip().upper()
                if method_clean not in ("FACE", "BIOMETRIC", "MANUAL"):
                    method_clean = "MANUAL"
                st_att = StudentAttendance(
                    attendance_session_id=att_session.id,
                    attendance_interval_id=target_interval.id,
                    student_id=item.student_id,
                    status=status_clean,
                    attendance_method=method_clean,
                    marked_at=datetime.utcnow()
                )
                db.add(st_att)

                total_conducted_mins += dur_mins
                if status_clean == "Present":
                    total_present_records += 1
                    total_present_mins += dur_mins
                else:
                    total_absent_records += 1
                    total_absent_mins += dur_mins

    # 2. If payload contains flat attendance list
    elif payload.attendance:
        # Check if individual items have interval_id or duration_number specified
        has_interval_spec = any(item.interval_id or item.duration_number for item in payload.attendance)

        if has_interval_spec:
            for item in payload.attendance:
                target_interval = None
                if item.interval_id:
                    target_interval = next((i for i in intervals if i.id == item.interval_id), None)
                elif item.duration_number:
                    target_interval = next((i for i in intervals if i.duration_number == item.duration_number), None)
                if not target_interval and intervals:
                    target_interval = intervals[0]

                if not target_interval:
                    continue

                dur_mins = target_interval.duration_minutes or 30
                status_clean = "Present" if (item.status or "").strip().capitalize() == "Present" else "Absent"
                st_att = StudentAttendance(
                    attendance_session_id=att_session.id,
                    attendance_interval_id=target_interval.id,
                    student_id=item.student_id,
                    status=status_clean,
                    marked_at=datetime.utcnow()
                )
                db.add(st_att)
                total_conducted_mins += dur_mins
                if status_clean == "Present":
                    total_present_records += 1
                    total_present_mins += dur_mins
                else:
                    total_absent_records += 1
                    total_absent_mins += dur_mins
        else:
            # Mark all 30-minute intervals for each student
            for interval in intervals:
                dur_mins = interval.duration_minutes or 30
                for item in payload.attendance:
                    status_clean = "Present" if (item.status or "").strip().capitalize() == "Present" else "Absent"
                    st_att = StudentAttendance(
                        attendance_session_id=att_session.id,
                        attendance_interval_id=interval.id,
                        student_id=item.student_id,
                        status=status_clean,
                        marked_at=datetime.utcnow()
                    )
                    db.add(st_att)
                    total_conducted_mins += dur_mins
                    if status_clean == "Present":
                        total_present_records += 1
                        total_present_mins += dur_mins
                    else:
                        total_absent_records += 1
                        total_absent_mins += dur_mins

        # Also insert into legacy Attendance table for backward compatibility
        present_cnt = 0
        absent_cnt = 0
        for item in payload.attendance:
            status_clean = "Present" if (item.status or "").strip().capitalize() == "Present" else "Absent"
            if status_clean == "Present":
                present_cnt += 1
            else:
                absent_cnt += 1
            rec = Attendance(
                student_id=item.student_id,
                timetable_id=slot.id,
                teacher_id=slot.teacher_id,
                subject_id=slot.subject_id,
                date=session_date,
                start_time=slot.start_time,
                end_time=slot.end_time,
                status=status_clean,
                marked_at=datetime.utcnow()
            )
            db.add(rec)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not record attendance: {str(e)}"
        )

    calc_percentage = round((total_present_mins / total_conducted_mins * 100), 1) if total_conducted_mins > 0 else 100.0

    result = {
        "success": True,
        "message": "✓ Attendance submitted successfully.",
        "timetable_id": slot.id,
        "session_id": att_session.id,
        "subject": slot.subject.subject_name if slot.subject else "",
        "teacher": slot.teacher.name if slot.teacher else "",
        "semester": slot.semester,
        "section": slot.section,
        "room": slot.room.room_name if slot.room else "",
        "date": session_date,
        "time": f"{slot.start_time} - {slot.end_time}",
        "present": total_present_records,
        "absent": total_absent_records,
        "total": total_present_records + total_absent_records,
        "conducted_minutes": total_conducted_mins,
        "present_minutes": total_present_mins,
        "absent_minutes": total_absent_mins,
        "attendance_percentage": calc_percentage,
    }
    return success_response(data=result, message="✓ Attendance submitted successfully.")


# ==========================================================
# 3. GET INTERVALS FOR A SESSION
# ==========================================================
@router.get("/session/{timetable_id}/intervals")
def get_session_intervals(
    timetable_id: int,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/attendance/session/{timetable_id}/intervals
    Returns the 30-minute intervals for this timetable session.
    """
    slot = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Timetable session not found.")

    session_date = date or datetime.now().strftime("%Y-%m-%d")
    att_session = get_or_create_session(slot, session_date, db)

    intervals_out = [
        {
            "id": i.id,
            "attendance_session_id": i.attendance_session_id,
            "duration_number": i.duration_number,
            "start_time": i.start_time,
            "end_time": i.end_time,
            "duration_minutes": i.duration_minutes or 30
        }
        for i in att_session.intervals
    ]
    return success_response(data=intervals_out, message="Intervals retrieved successfully")


# ==========================================================
# 4. UPDATE INTERVAL ATTENDANCE
# ==========================================================
@router.put("/interval/{interval_id}")
def update_interval_attendance(
    interval_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher"))
):
    """
    PUT /api/attendance/interval/{interval_id}
    Updates student attendance status for a specific 30-minute interval.
    """
    interval = db.query(AttendanceInterval).options(
        joinedload(AttendanceInterval.session).joinedload(AttendanceSession.timetable)
    ).filter(AttendanceInterval.id == interval_id).first()

    if not interval:
        raise HTTPException(status_code=404, detail="Attendance interval not found.")

    # Authorization
    if current_user.role.lower() == "teacher":
        teach_id = get_user_teacher_id(current_user, db)
        if interval.session and interval.session.timetable and teach_id != interval.session.timetable.teacher_id:
            raise HTTPException(status_code=403, detail="You are not authorized to update this interval.")

    items = payload.get("attendance", [])
    updated_count = 0

    for item in items:
        student_id = item.get("student_id")
        raw_status = (item.get("status") or "Present").strip().capitalize()
        status_clean = "Present" if raw_status == "Present" else "Absent"

        existing = db.query(StudentAttendance).filter(
            StudentAttendance.attendance_interval_id == interval.id,
            StudentAttendance.student_id == student_id
        ).first()

        if existing:
            existing.status = status_clean
            existing.marked_at = datetime.utcnow()
        else:
            new_rec = StudentAttendance(
                attendance_session_id=interval.attendance_session_id,
                attendance_interval_id=interval.id,
                student_id=student_id,
                status=status_clean,
                marked_at=datetime.utcnow()
            )
            db.add(new_rec)
        updated_count += 1

    db.commit()
    return success_response(
        data={"interval_id": interval_id, "updated_count": updated_count},
        message=f"Attendance for interval #{interval.duration_number} updated successfully."
    )


# ==========================================================
# 5. GET STUDENT ATTENDANCE REPORT & MINUTES CALCULATION
# ==========================================================
@router.get("/student/{student_id}")
def get_student_attendance(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/attendance/student/{student_id}
    Returns student attendance report with minutes calculation:
    - Conducted Minutes
    - Present Minutes
    - Absent Minutes
    - Attendance Percentage = (Present Minutes / Conducted Minutes) * 100
    - Subject-wise breakdown with individual 30-minute interval records
    """
    student = db.query(Student).options(
        joinedload(Student.department),
        joinedload(Student.user)
    ).filter(Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Authorization
    if current_user.role.lower() == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can view only your own attendance.")

    # Fetch all interval records for this student
    interval_records = db.query(StudentAttendance).options(
        joinedload(StudentAttendance.interval),
        joinedload(StudentAttendance.session).joinedload(AttendanceSession.timetable).joinedload(Timetable.subject),
        joinedload(StudentAttendance.session).joinedload(AttendanceSession.timetable).joinedload(Timetable.teacher),
    ).filter(StudentAttendance.student_id == student.id).all()

    # Fetch legacy attendance records as fallback / augment
    legacy_records = db.query(Attendance).options(
        joinedload(Attendance.subject),
        joinedload(Attendance.teacher),
        joinedload(Attendance.timetable),
    ).filter(Attendance.student_id == student.id).all()

    # Subject aggregations
    subject_map = {}
    subjects_in_dept = db.query(Subject).filter(
        Subject.semester == student.semester
    ).all()
    for sub in subjects_in_dept:
        subject_map[sub.id] = {
            "subject_id": sub.id,
            "subject_code": sub.subject_code,
            "subject_name": sub.subject_name,
            "teacher_name": sub.teacher.name if sub.teacher else "Faculty",
            "scheduled_sessions": 0,
            "present": 0,
            "absent": 0,
            "percentage": 100.0,
            "conducted_minutes": 0,
            "present_minutes": 0,
            "absent_minutes": 0,
            "intervals": []
        }

    total_conducted_mins = 0
    total_present_mins = 0
    total_absent_mins = 0
    total_intervals_count = 0
    present_intervals_count = 0
    absent_intervals_count = 0

    seen_session_dates = set()

    # Process 30-minute interval records
    for rec in interval_records:
        session = rec.session
        tt = session.timetable if session else None
        sub = tt.subject if tt else None
        teach = tt.teacher if tt else None
        interval = rec.interval

        dur_mins = interval.duration_minutes if interval else 30
        status_val = rec.status
        date_str = session.date if session else "2026-09-26"
        sub_id = sub.id if sub else (tt.subject_id if tt else 1)

        if sub_id not in subject_map:
            subject_map[sub_id] = {
                "subject_id": sub_id,
                "subject_code": sub.subject_code if sub else "SUB",
                "subject_name": sub.subject_name if sub else "Academic Subject",
                "teacher_name": teach.name if teach else "Faculty",
                "scheduled_sessions": 0,
                "present": 0,
                "absent": 0,
                "percentage": 100.0,
                "conducted_minutes": 0,
                "present_minutes": 0,
                "absent_minutes": 0,
                "intervals": []
            }

        s_entry = subject_map[sub_id]
        s_entry["conducted_minutes"] += dur_mins
        total_conducted_mins += dur_mins
        total_intervals_count += 1

        if status_val == "Present":
            s_entry["present_minutes"] += dur_mins
            s_entry["present"] += 1
            total_present_mins += dur_mins
            present_intervals_count += 1
        else:
            s_entry["absent_minutes"] += dur_mins
            s_entry["absent"] += 1
            total_absent_mins += dur_mins
            absent_intervals_count += 1

        s_entry["intervals"].append({
            "date": date_str,
            "duration_number": interval.duration_number if interval else 1,
            "start_time": interval.start_time if interval else "09:00",
            "end_time": interval.end_time if interval else "09:30",
            "status": status_val,
            "teacher_name": teach.name if teach else "Faculty",
            "marked_at": rec.marked_at.isoformat() if rec.marked_at else None
        })
        seen_session_dates.add((sub_id, date_str))

    # Also augment from legacy attendance records if interval records are not present for that session
    for l_rec in legacy_records:
        sub_id = l_rec.subject_id
        date_str = l_rec.date
        if (sub_id, date_str) in seen_session_dates:
            continue

        if sub_id not in subject_map:
            subject_map[sub_id] = {
                "subject_id": sub_id,
                "subject_code": l_rec.subject.subject_code if l_rec.subject else "SUB",
                "subject_name": l_rec.subject.subject_name if l_rec.subject else "Subject",
                "teacher_name": l_rec.teacher.name if l_rec.teacher else "Faculty",
                "scheduled_sessions": 0,
                "present": 0,
                "absent": 0,
                "percentage": 100.0,
                "conducted_minutes": 0,
                "present_minutes": 0,
                "absent_minutes": 0,
                "intervals": []
            }

        s_entry = subject_map[sub_id]
        dur_mins = 60  # Default 60 min session = two 30-min durations
        s_entry["conducted_minutes"] += dur_mins
        total_conducted_mins += dur_mins
        total_intervals_count += 2

        if l_rec.status == "Present":
            s_entry["present_minutes"] += dur_mins
            s_entry["present"] += 2
            total_present_mins += dur_mins
            present_intervals_count += 2
        else:
            s_entry["absent_minutes"] += dur_mins
            s_entry["absent"] += 2
            total_absent_mins += dur_mins
            absent_intervals_count += 2

        s_entry["intervals"].append({
            "date": date_str,
            "duration_number": 1,
            "start_time": l_rec.start_time or "09:00",
            "end_time": "09:30",
            "status": l_rec.status,
            "teacher_name": l_rec.teacher.name if l_rec.teacher else "Faculty",
            "marked_at": l_rec.marked_at.isoformat() if l_rec.marked_at else None
        })
        s_entry["intervals"].append({
            "date": date_str,
            "duration_number": 2,
            "start_time": "09:30",
            "end_time": l_rec.end_time or "10:00",
            "status": l_rec.status,
            "teacher_name": l_rec.teacher.name if l_rec.teacher else "Faculty",
            "marked_at": l_rec.marked_at.isoformat() if l_rec.marked_at else None
        })

    # Calculate subject percentages
    subject_stats = []
    for s_id, s_data in subject_map.items():
        cond = s_data["conducted_minutes"]
        pres = s_data["present_minutes"]
        s_data["percentage"] = round((pres / cond * 100), 1) if cond > 0 else 100.0
        s_data["scheduled_sessions"] = len(s_data["intervals"])
        subject_stats.append(SubjectAttendanceStat(**s_data))

    overall_pct = round((total_present_mins / total_conducted_mins * 100), 2) if total_conducted_mins > 0 else 100.0

    summary = StudentAttendanceSummary(
        student_id=student.id,
        student_name=student.name,
        usn=student.usn or student.student_id or f"ST-{student.id}",
        semester=student.semester,
        section=student.section,
        department_name=student.department.name if student.department else "Computer Science",
        total_sessions=total_intervals_count,
        present_sessions=present_intervals_count,
        absent_sessions=absent_intervals_count,
        conducted_minutes=total_conducted_mins,
        present_minutes=total_present_mins,
        absent_minutes=total_absent_mins,
        attendance_percentage=overall_pct,
        overall_percentage=overall_pct,
        subjects=subject_stats
    )
    return success_response(data=summary.model_dump(), message="Student attendance retrieved successfully")


# ==========================================================
# 6. GET STUDENT ATTENDANCE FOR A SPECIFIC SUBJECT
# ==========================================================
@router.get("/student/{student_id}/subject/{subject_id}")
def get_student_subject_attendance(
    student_id: int,
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/attendance/student/{student_id}/subject/{subject_id}
    Returns detailed 30-minute interval attendance records for a student in a subject.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    # Authorization
    if current_user.role.lower() == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can view only your own attendance.")

    # Fetch interval records
    interval_records = db.query(StudentAttendance).options(
        joinedload(StudentAttendance.interval),
        joinedload(StudentAttendance.session).joinedload(AttendanceSession.timetable).joinedload(Timetable.teacher)
    ).join(AttendanceSession, StudentAttendance.attendance_session_id == AttendanceSession.id
    ).join(Timetable, AttendanceSession.timetable_id == Timetable.id
    ).filter(
        StudentAttendance.student_id == student.id,
        Timetable.subject_id == subject.id
    ).order_by(AttendanceSession.date.desc(), StudentAttendance.attendance_interval_id.asc()).all()

    conducted_mins = 0
    present_mins = 0
    absent_mins = 0
    records = []

    for r in interval_records:
        dur = r.interval.duration_minutes if r.interval else 30
        conducted_mins += dur
        if r.status == "Present":
            present_mins += dur
        else:
            absent_mins += dur

        records.append({
            "date": r.session.date if r.session else "",
            "duration_number": r.interval.duration_number if r.interval else 1,
            "start_time": r.interval.start_time if r.interval else "",
            "end_time": r.interval.end_time if r.interval else "",
            "duration_minutes": dur,
            "status": r.status,
            "teacher_name": r.session.timetable.teacher.name if (r.session and r.session.timetable and r.session.timetable.teacher) else "",
            "marked_at": r.marked_at.isoformat() if r.marked_at else None
        })

    # Also augment with legacy records if no intervals
    if not records:
        legacy_records = db.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.subject_id == subject.id
        ).all()
        for lr in legacy_records:
            conducted_mins += 60
            if lr.status == "Present":
                present_mins += 60
            else:
                absent_mins += 60
            records.append({
                "date": lr.date,
                "duration_number": 1,
                "start_time": lr.start_time or "09:00",
                "end_time": "09:30",
                "duration_minutes": 30,
                "status": lr.status,
                "teacher_name": lr.teacher.name if lr.teacher else "",
                "marked_at": lr.marked_at.isoformat() if lr.marked_at else None
            })
            records.append({
                "date": lr.date,
                "duration_number": 2,
                "start_time": "09:30",
                "end_time": lr.end_time or "10:00",
                "duration_minutes": 30,
                "status": lr.status,
                "teacher_name": lr.teacher.name if lr.teacher else "",
                "marked_at": lr.marked_at.isoformat() if lr.marked_at else None
            })

    pct = round((present_mins / conducted_mins * 100), 1) if conducted_mins > 0 else 100.0

    data = {
        "student_id": student.id,
        "student_name": student.name,
        "usn": student.usn or student.student_id,
        "subject_id": subject.id,
        "subject_name": subject.subject_name,
        "subject_code": subject.subject_code,
        "conducted_minutes": conducted_mins,
        "present_minutes": present_mins,
        "absent_minutes": absent_mins,
        "attendance_percentage": pct,
        "total_records": len(records),
        "records": records
    }
    return success_response(data=data, message="Subject attendance records retrieved successfully")


# ==========================================================
# 7. GET SUBJECT ATTENDANCE REPORT ACROSS ALL STUDENTS
# ==========================================================
@router.get("/subject/{subject_id}")
def get_subject_attendance(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher"))
):
    """
    GET /api/attendance/subject/{subject_id}
    Returns overall attendance metrics for a subject.
    """
    subject = db.query(Subject).options(
        joinedload(Subject.department),
        joinedload(Subject.teacher)
    ).filter(Subject.id == subject_id).first()

    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    # All students in that department and semester
    students = db.query(Student).filter(
        Student.semester == subject.semester,
        Student.status == "active"
    ).all()

    student_stats = []
    total_sub_conducted = 0
    total_sub_present = 0

    for s in students:
        rec_count = db.query(StudentAttendance).join(
            AttendanceSession, StudentAttendance.attendance_session_id == AttendanceSession.id
        ).join(
            Timetable, AttendanceSession.timetable_id == Timetable.id
        ).filter(
            StudentAttendance.student_id == s.id,
            Timetable.subject_id == subject.id
        ).all()

        cond = sum(r.interval.duration_minutes for r in rec_count if r.interval) if rec_count else 0
        pres = sum(r.interval.duration_minutes for r in rec_count if r.interval and r.status == "Present") if rec_count else 0
        
        # Fallback legacy check
        if cond == 0:
            l_recs = db.query(Attendance).filter(
                Attendance.student_id == s.id,
                Attendance.subject_id == subject.id
            ).all()
            cond = len(l_recs) * 60
            pres = sum(60 for r in l_recs if r.status == "Present")

        pct = round((pres / cond * 100), 1) if cond > 0 else 100.0
        total_sub_conducted += cond
        total_sub_present += pres

        student_stats.append({
            "student_id": s.id,
            "name": s.name,
            "usn": s.usn or s.student_id,
            "section": s.section,
            "conducted_minutes": cond,
            "present_minutes": pres,
            "absent_minutes": cond - pres,
            "attendance_percentage": pct,
            "is_shortage": pct < 75.0
        })

    overall_avg = round((total_sub_present / total_sub_conducted * 100), 1) if total_sub_conducted > 0 else 100.0

    return success_response(
        data={
            "subject_id": subject.id,
            "subject_name": subject.subject_name,
            "subject_code": subject.subject_code,
            "teacher_name": subject.teacher.name if subject.teacher else None,
            "total_students": len(students),
            "overall_average_percentage": overall_avg,
            "students": student_stats
        },
        message="Subject attendance retrieved successfully"
    )


# ==========================================================
# 8. GET ATTENDANCE HISTORY FOR A TEACHER
# ==========================================================
@router.get("/teacher/{teacher_id}")
def get_teacher_attendance(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    GET /api/attendance/teacher/{teacher_id}
    Returns attendance sessions conducted by a teacher.
    """
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")

    sessions = db.query(AttendanceSession).join(
        Timetable, AttendanceSession.timetable_id == Timetable.id
    ).options(
        joinedload(AttendanceSession.timetable).joinedload(Timetable.subject),
        joinedload(AttendanceSession.timetable).joinedload(Timetable.room),
        joinedload(AttendanceSession.intervals)
    ).filter(
        Timetable.teacher_id == teacher.id
    ).order_by(AttendanceSession.date.desc()).all()

    session_list = []
    for s in sessions:
        tt = s.timetable
        present_count = db.query(StudentAttendance).filter(
            StudentAttendance.attendance_session_id == s.id,
            StudentAttendance.status == "Present"
        ).count()
        absent_count = db.query(StudentAttendance).filter(
            StudentAttendance.attendance_session_id == s.id,
            StudentAttendance.status == "Absent"
        ).count()

        session_list.append({
            "session_id": s.id,
            "timetable_id": s.timetable_id,
            "date": s.date,
            "time": f"{s.start_time} - {s.end_time}",
            "subject_name": tt.subject.subject_name if (tt and tt.subject) else "Subject",
            "subject_code": tt.subject.subject_code if (tt and tt.subject) else "",
            "semester": tt.semester if tt else 5,
            "section": tt.section if tt else "A",
            "room_name": tt.room.room_name if (tt and tt.room) else "",
            "intervals_count": len(s.intervals),
            "present_count": present_count,
            "absent_count": absent_count
        })

    return success_response(
        data={
            "teacher_id": teacher.id,
            "teacher_name": teacher.name,
            "employee_id": teacher.employee_id,
            "total_sessions_conducted": len(session_list),
            "sessions": session_list
        },
        message="Teacher attendance sessions retrieved successfully"
    )


# ==========================================================
# 9. GET SESSIONS LIST (HOD / ADMIN / TEACHER)
# ==========================================================
@router.get("/sessions")
def list_attendance_sessions(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher", "faculty"))
):
    """
    List conducted attendance sessions for dashboard/management view.
    """
    query = db.query(AttendanceSession).join(
        Timetable, AttendanceSession.timetable_id == Timetable.id
    ).options(
        joinedload(AttendanceSession.timetable).joinedload(Timetable.subject),
        joinedload(AttendanceSession.timetable).joinedload(Timetable.teacher),
        joinedload(AttendanceSession.timetable).joinedload(Timetable.room),
    )

    if current_user.role.lower() == "hod" and current_user.department_id:
        query = query.filter(Timetable.department_id == current_user.department_id)
    elif department_id:
        query = query.filter(Timetable.department_id == department_id)

    if semester:
        query = query.filter(Timetable.semester == semester)
    if section:
        query = query.filter(Timetable.section == section.upper())
    if date:
        query = query.filter(AttendanceSession.date == date)

    sessions = query.order_by(AttendanceSession.date.desc(), AttendanceSession.start_time.asc()).all()

    # Also augment with legacy records
    legacy_query = db.query(Attendance).options(
        joinedload(Attendance.subject),
        joinedload(Attendance.teacher),
        joinedload(Attendance.timetable),
    )
    if current_user.role.lower() == "hod" and current_user.department_id:
        legacy_query = legacy_query.join(Timetable).filter(Timetable.department_id == current_user.department_id)
    legacy_sessions = legacy_query.all()

    seen = set()
    result = []

    for s in sessions:
        tt = s.timetable
        key = (s.timetable_id, s.date)
        seen.add(key)
        result.append({
            "session_id": s.id,
            "timetable_id": s.timetable_id,
            "date": s.date,
            "time": f"{s.start_time} - {s.end_time}",
            "subject_name": tt.subject.subject_name if (tt and tt.subject) else "Subject",
            "subject_code": tt.subject.subject_code if (tt and tt.subject) else "",
            "teacher_name": tt.teacher.name if (tt and tt.teacher) else "Teacher",
            "semester": tt.semester if tt else 5,
            "section": tt.section if tt else "A",
            "room_name": tt.room.room_name if (tt and tt.room) else "",
            "day": tt.day if tt else "Monday"
        })

    for ls in legacy_sessions:
        key = (ls.timetable_id, ls.date)
        if key in seen:
            continue
        seen.add(key)
        tt = ls.timetable
        result.append({
            "session_id": ls.id,
            "timetable_id": ls.timetable_id,
            "date": ls.date,
            "time": f"{ls.start_time} - {ls.end_time}" if ls.start_time else "09:00 - 10:00",
            "subject_name": ls.subject.subject_name if ls.subject else "Subject",
            "subject_code": ls.subject.subject_code if ls.subject else "",
            "teacher_name": ls.teacher.name if ls.teacher else "Teacher",
            "semester": tt.semester if tt else 5,
            "section": tt.section if tt else "A",
            "room_name": tt.room.room_name if (tt and tt.room) else "",
            "day": tt.day if tt else "Monday"
        })

    return success_response(data=result, message=f"Found {len(result)} sessions")


# ==========================================================
# 10. GET LOGGED-IN STUDENT ATTENDANCE (GET /api/attendance/my)
# ==========================================================
@router.get("/my")
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    """
    GET /api/attendance/my
    Convenience endpoint for student dashboard.
    """
    student = db.query(Student).filter(
        (Student.user_id == current_user.id) | (Student.email == current_user.email)
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for this user.")

    return get_student_attendance(student.id, db, current_user)


# ==========================================================
# 11. GET ATTENDANCE SHORTAGE (< 75%) REPORT
# ==========================================================
@router.get("/shortage")
def get_attendance_shortage(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    threshold: float = 75.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher"))
):
    """
    Returns list of students with attendance below threshold (default 75%).
    """
    query = db.query(Student).options(
        joinedload(Student.department)
    ).filter(Student.status == "active")

    if current_user.role.lower() == "hod" and current_user.department_id:
        query = query.filter(Student.department_id == current_user.department_id)
    elif department_id:
        query = query.filter(Student.department_id == department_id)

    if semester:
        query = query.filter(Student.semester == semester)
    if section:
        query = query.filter(Student.section == section.upper())

    students = query.all()
    shortage_list = []

    for s in students:
        # Calculate attendance percentage
        rec_count = db.query(StudentAttendance).options(
            joinedload(StudentAttendance.interval)
        ).filter(StudentAttendance.student_id == s.id).all()

        conducted = sum(r.interval.duration_minutes for r in rec_count if r.interval) if rec_count else 0
        present = sum(r.interval.duration_minutes for r in rec_count if r.interval and r.status == "Present") if rec_count else 0

        if conducted == 0:
            l_recs = db.query(Attendance).filter(Attendance.student_id == s.id).all()
            conducted = len(l_recs) * 60
            present = sum(60 for r in l_recs if r.status == "Present")

        pct = round((present / conducted * 100), 1) if conducted > 0 else 100.0

        if pct < threshold and conducted > 0:
            shortage_list.append({
                "student_id": s.id,
                "name": s.name,
                "usn": s.usn or s.student_id,
                "semester": s.semester,
                "section": s.section,
                "department_name": s.department.name if s.department else None,
                "conducted_minutes": conducted,
                "present_minutes": present,
                "absent_minutes": conducted - present,
                "attendance_percentage": pct,
                "shortage_percentage": round(threshold - pct, 1)
            })

    return success_response(
        data=shortage_list,
        message=f"Found {len(shortage_list)} students with attendance below {threshold}%"
    )


# ==========================================================
# 12. GENERAL ATTENDANCE CRUD & PERCENTAGE ENDPOINTS
# ==========================================================
def format_attendance_record(att: Attendance) -> dict:
    return {
        "id": att.id,
        "student_id": att.student_id,
        "subject_id": att.subject_id,
        "timetable_id": att.timetable_id,
        "teacher_id": att.teacher_id,
        "date": att.date,
        "start_time": att.start_time,
        "end_time": att.end_time,
        "status": att.status,
        "marked_at": att.marked_at.isoformat() if att.marked_at else None,
        "student_name": att.student.name if att.student else None,
        "student_usn": (att.student.usn or att.student.student_id) if att.student else None,
        "subject_name": att.subject.subject_name if att.subject else None,
        "teacher_name": att.teacher.name if att.teacher else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_single_attendance(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher", "faculty"))
):
    student_id = payload.get("student_id")
    subject_id = payload.get("subject_id")
    date_val = payload.get("date") or datetime.now().strftime("%Y-%m-%d")
    status_val = (payload.get("status") or "Present").strip().capitalize()
    teacher_id = payload.get("teacher_id") or get_user_teacher_id(current_user, db) or 1
    timetable_id = payload.get("timetable_id")

    if not timetable_id:
        slot = db.query(Timetable).filter(Timetable.subject_id == subject_id).first()
        timetable_id = slot.id if slot else 1

    att = Attendance(
        student_id=student_id,
        subject_id=subject_id,
        teacher_id=teacher_id,
        timetable_id=timetable_id,
        date=date_val,
        status=status_val,
        start_time=payload.get("start_time", "09:00"),
        end_time=payload.get("end_time", "10:00"),
        marked_at=datetime.utcnow()
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return success_response(data=format_attendance_record(att), message="Attendance marked successfully", status_code=201)


@router.get("")
def list_attendance(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Attendance).options(
        joinedload(Attendance.student),
        joinedload(Attendance.subject),
        joinedload(Attendance.teacher)
    )
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
    if date:
        query = query.filter(Attendance.date == date)
    records = query.order_by(Attendance.date.desc(), Attendance.id.desc()).all()
    return success_response(data=[format_attendance_record(r) for r in records])


@router.get("/date/{date_str}")
def get_attendance_by_date(
    date_str: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(Attendance).options(
        joinedload(Attendance.student),
        joinedload(Attendance.subject),
        joinedload(Attendance.teacher)
    ).filter(Attendance.date == date_str).all()
    return success_response(data=[format_attendance_record(r) for r in records])


@router.get("/percentage/{student_id}")
def get_student_percentage(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    total = len(records)
    present = sum(1 for r in records if r.status.lower() in ("present", "late"))
    absent = total - present
    pct = round((present / total * 100), 2) if total > 0 else 100.0
    return success_response(data={
        "student_id": student.id,
        "student_name": student.name,
        "usn": student.usn or student.student_id,
        "total_classes": total,
        "present_classes": present,
        "absent_classes": absent,
        "percentage": pct
    })


@router.put("/{att_id}")
def update_single_attendance(
    att_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher", "faculty"))
):
    att = db.query(Attendance).filter(Attendance.id == att_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found.")
    if "status" in payload:
        att.status = payload["status"]
    db.commit()
    db.refresh(att)
    return success_response(data=format_attendance_record(att), message="Attendance updated successfully")


@router.delete("/{att_id}")
def delete_single_attendance(
    att_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role("admin", "hod", "teacher", "faculty"))
):
    att = db.query(Attendance).filter(Attendance.id == att_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found.")
    db.delete(att)
    db.commit()
    return success_response(data={"id": att_id}, message="Attendance deleted successfully")

