from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.students import router as students_router
from app.routers.faculty import router as faculty_router
from app.routers.teachers import router as teachers_router
from app.routers.rooms import router as rooms_router
from app.routers.departments import router as departments_router
from app.routers.subjects import router as subjects_router
from app.routers.attendance import router as attendance_router
from app.routers.timetable import router as timetable_router
from app.routers.locations import router as locations_router
from app.routers.notices import router as notices_router
from app.routers.dashboard import router as dashboard_router
from app.routers.face import router as face_router
from app.routers.biometric import router as biometric_router
from app.routers.buses import router as buses_router
from app.routers.events import router as events_router
from app.routers.announcements import router as announcements_router
from app.routers.notifications import router as notifications_router
from app.routers.student_activities import router as student_activities_router
from app.routers.marks import router as marks_router
from app.routers.student_auth import router as student_auth_router
from app.routers.admin_student_registration import router as admin_student_registration_router

__all__ = [
    "auth_router",
    "users_router",
    "students_router",
    "faculty_router",
    "teachers_router",
    "rooms_router",
    "departments_router",
    "subjects_router",
    "attendance_router",
    "timetable_router",
    "locations_router",
    "notices_router",
    "dashboard_router",
    "face_router",
    "biometric_router",
    "buses_router",
    "events_router",
    "announcements_router",
    "notifications_router",
    "student_activities_router",
    "marks_router",
    "student_auth_router",
    "admin_student_registration_router",
]
