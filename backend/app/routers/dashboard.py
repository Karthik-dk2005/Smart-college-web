from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, date, timedelta
from typing import Dict, Any, List

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.department import Department
from app.models.subject import Subject
from app.models.attendance import Attendance
from app.models.timetable import Timetable
from app.models.notice import Notice
from app.dependencies import get_current_user
from app.utils.response import success_response

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
@router.get("/stats")
@router.get("/student")
@router.get("/teacher")
@router.get("/faculty")
@router.get("/hod")
@router.get("/admin")
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve unified, real-time dashboard statistics and analytics.
    Supplies all metric cards and chart datasets directly from database.
    """
    today_str = date.today().isoformat()
    today_weekday = datetime.today().strftime("%A")

    # 1. High-Level Metrics
    total_students = db.query(Student).count()
    total_faculty = db.query(Faculty).count()
    total_subjects = db.query(Subject).count()
    total_departments = db.query(Department).count()
    active_users = db.query(User).filter(User.is_active == True).count()

    # 2. Today's Classes
    tt_query = db.query(Timetable).options(
        joinedload(Timetable.subject),
        joinedload(Timetable.teacher)
    ).filter(Timetable.day == today_weekday)

    if current_user.role == "student" and current_user.student_profile:
        tt_query = tt_query.filter(
            Timetable.semester == current_user.student_profile.semester,
            Timetable.section == current_user.student_profile.section
        )
    elif current_user.role in ("teacher", "faculty"):
        t_id = current_user.teacher_id or (current_user.faculty_profile.id if hasattr(current_user, "faculty_profile") and current_user.faculty_profile else None)
        if t_id:
            tt_query = tt_query.filter(Timetable.teacher_id == t_id)

    today_classes = tt_query.order_by(Timetable.start_time).all()
    today_classes_count = len(today_classes)

    today_classes_list = [
        {
            "id": c.id,
            "subject_name": c.subject.subject_name if c.subject else "N/A",
            "subject_code": c.subject.subject_code if c.subject else "N/A",
            "faculty_name": c.teacher.name if c.teacher else "Faculty",
            "room_number": c.room.room_name if c.room else (c.room_number or "Classroom"),
            "start_time": c.start_time,
            "end_time": c.end_time,
            "section": c.section,
            "semester": c.semester,
        }
        for c in today_classes
    ]

    # 3. Attendance Metrics
    today_attendance_records = db.query(Attendance).filter(Attendance.date == today_str).all()
    today_attendance_count = len(today_attendance_records)

    all_att_records = db.query(Attendance).all()
    total_att_count = len(all_att_records)
    total_present_count = sum(1 for a in all_att_records if a.status == "present")
    average_attendance = round((total_present_count / total_att_count * 100), 1) if total_att_count > 0 else 100.0

    # 4. Recent Notices
    recent_notices_query = db.query(Notice)
    if current_user.role == "student":
        recent_notices_query = recent_notices_query.filter(Notice.target_role.in_(["all", "student"]))
    recent_notices = recent_notices_query.order_by(Notice.created_at.desc()).limit(5).all()

    recent_notices_list = [
        {
            "id": n.id,
            "title": n.title,
            "description": n.description,
            "target_role": n.target_role,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in recent_notices
    ]

    # 5. Charts Datasets
    # 5a. Attendance Statistics (Status Breakdown)
    status_counts = {"present": 0, "absent": 0, "late": 0, "leave": 0}
    for a in all_att_records:
        if a.status in status_counts:
            status_counts[a.status] += 1

    attendance_stats_chart = [
        {"name": "Present", "count": status_counts["present"], "color": "#10b981"},
        {"name": "Absent", "count": status_counts["absent"], "color": "#ef4444"},
        {"name": "Late", "count": status_counts["late"], "color": "#f59e0b"},
        {"name": "Leave", "count": status_counts["leave"], "color": "#6366f1"},
    ]

    # 5b. Student Distribution by Semester & Section
    students = db.query(Student).all()
    dist_map = {}
    for s in students:
        key = f"Sem {s.semester} - {s.section}"
        dist_map[key] = dist_map.get(key, 0) + 1

    student_distribution_chart = [
        {"name": k, "count": v} for k, v in dist_map.items()
    ]

    # 5c. Daily Attendance Trend (Past 7 Days)
    daily_attendance_trend = []
    for i in range(6, -1, -1):
        day_d = date.today() - timedelta(days=i)
        day_str = day_d.isoformat()
        day_label = day_d.strftime("%a (%b %d)")
        day_records = [a for a in all_att_records if a.date == day_str]
        p_cnt = sum(1 for a in day_records if a.status == "present")
        a_cnt = sum(1 for a in day_records if a.status == "absent")
        daily_attendance_trend.append({
            "date": day_str,
            "day": day_label,
            "present": p_cnt,
            "absent": a_cnt,
            "total": len(day_records)
        })

    # 5d. Subject Credits Statistics
    subjects = db.query(Subject).all()
    subject_stats_chart = [
        {
            "name": s.subject_code,
            "full_name": s.subject_name,
            "credits": s.credits,
            "semester": s.semester,
        }
        for s in subjects
    ]

    # 6. Student Specific Overview (if student)
    student_stats = None
    if current_user.role == "student" and current_user.student_profile:
        st_id = current_user.student_profile.id
        my_records = [a for a in all_att_records if a.student_id == st_id]
        my_total = len(my_records)
        my_present = sum(1 for a in my_records if a.status == "present")
        my_pct = round((my_present / my_total * 100), 1) if my_total > 0 else 100.0

        student_stats = {
            "student_id": st_id,
            "usn": current_user.student_profile.usn,
            "semester": current_user.student_profile.semester,
            "section": current_user.student_profile.section,
            "total_classes": my_total,
            "present_classes": my_present,
            "attendance_percentage": my_pct,
        }

    data = {
        "metrics": {
            "total_students": total_students,
            "total_faculty": total_faculty,
            "total_subjects": total_subjects,
            "total_departments": total_departments,
            "active_users": active_users,
            "today_classes": today_classes_count,
            "today_attendance": today_attendance_count,
            "average_attendance": average_attendance,
        },
        "today_classes": today_classes_list,
        "recent_notices": recent_notices_list,
        "charts": {
            "attendance_statistics": attendance_stats_chart,
            "student_distribution": student_distribution_chart,
            "daily_attendance": daily_attendance_trend,
            "subject_statistics": subject_stats_chart,
        },
        "student_overview": student_stats,
    }

    return success_response(data=data, message="Dashboard statistics retrieved successfully")
