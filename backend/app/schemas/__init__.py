import importlib.util
import os
from pydantic import BaseModel
from typing import Optional, Any

class ApiResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    data: Optional[Any] = None
    error: Optional[str] = None

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
    from app.schemas.bus import (
        BusStopBase, BusStopCreate, BusStopUpdate, BusStopOut,
        BusRouteBase, BusRouteCreate, BusRouteUpdate, BusRouteOut, BusRouteDetailOut,
        StudentBusAssignCreate, StudentBusAssignmentOut
    )
    from app.schemas.event import (
        EventBase, EventCreate, EventUpdate, EventOut, EventRegistrationOut,
        EventAttendanceItem, EventAttendanceUpdate
    )
    from app.schemas.announcement import (
        AnnouncementBase, AnnouncementCreate, AnnouncementUpdate, AnnouncementOut
    )
    from app.schemas.notification import (
        NotificationCreate, NotificationOut
    )
    from app.schemas.student_activity import (
        StudentActivityBase, StudentActivityCreate, StudentActivityUpdate,
        StudentActivityOut, StudentActivityFileOut, StudentActivityVerificationOut,
        VerifyActivityRequest, RejectActivityRequest, ActivityStatsOut
    )
    from app.schemas.mark import (
        MarkBase, MarkCreate, MarkUpdate, MarkItemOut, SubjectDashboardCard, StudentMarksProfile
    )
    from app.schemas.student_auth import (
        VerifyUSNResponse, StudentRegisterRequest, StudentVerifyEmailRequest,
        StudentResendOTPRequest, StudentLoginRequest, StudentProfileOut, StudentAuthResponse
    )
except Exception as e:
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
