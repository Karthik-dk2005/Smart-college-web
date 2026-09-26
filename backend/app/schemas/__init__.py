import importlib.util
import os

# 1. First import legacy submodules if they exist so existing endpoints continue to function
try:
    from app.schemas.auth import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest
    from app.schemas.user import UserCreate, UserUpdate, UserOut
    from app.schemas.department import DepartmentCreate as DepCreateLegacy, DepartmentUpdate, DepartmentOut
    from app.schemas.student import StudentCreate, StudentUpdate, StudentOut
    from app.schemas.faculty import FacultyCreate, FacultyUpdate, FacultyOut
    from app.schemas.subject import SubjectCreate as SubCreateLegacy, SubjectUpdate as SubUpdateLegacy, SubjectOut
    from app.schemas.attendance import (
        AttendanceCreate, AttendanceUpdate, AttendanceOut, AttendancePercentageOut,
        StudentAttendanceItem, SessionAttendanceSubmit, StudentSessionItem,
        SessionDetailsResponse, SessionAttendanceResponse, SubjectAttendanceStat,
        StudentAttendanceSummary
    )
    from app.schemas.timetable import TimetableCreate as TTCreateLegacy, TimetableUpdate as TTUpdateLegacy, TimetableOut
    from app.schemas.location import LocationUpdate, LocationOut
    from app.schemas.notice import NoticeCreate, NoticeUpdate, NoticeOut
except Exception:
    pass

# 2. Load schemas defined in app/schemas.py (authoritative schemas for Timetable, Teacher, Subject, Room, etc.)
_schemas_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "schemas.py"))
if os.path.exists(_schemas_file):
    _spec = importlib.util.spec_from_file_location("app._schemas_file", _schemas_file)
    _mod = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)
    for _name in dir(_mod):
        if not _name.startswith("_"):
            globals()[_name] = getattr(_mod, _name)
