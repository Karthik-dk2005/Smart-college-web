from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
)
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut
from app.schemas.faculty import FacultyCreate, FacultyUpdate, FacultyOut
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectOut
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceOut,
    AttendancePercentageOut,
)
from app.schemas.timetable import TimetableCreate, TimetableUpdate, TimetableOut
from app.schemas.location import LocationUpdate, LocationOut
from app.schemas.notice import NoticeCreate, NoticeUpdate, NoticeOut

__all__ = [
    "UserRegister",
    "UserLogin",
    "TokenResponse",
    "RefreshTokenRequest",
    "UserCreate",
    "UserUpdate",
    "UserOut",
    "DepartmentCreate",
    "DepartmentUpdate",
    "DepartmentOut",
    "StudentCreate",
    "StudentUpdate",
    "StudentOut",
    "FacultyCreate",
    "FacultyUpdate",
    "FacultyOut",
    "SubjectCreate",
    "SubjectUpdate",
    "SubjectOut",
    "AttendanceCreate",
    "AttendanceUpdate",
    "AttendanceOut",
    "AttendancePercentageOut",
    "TimetableCreate",
    "TimetableUpdate",
    "TimetableOut",
    "LocationUpdate",
    "LocationOut",
    "NoticeCreate",
    "NoticeUpdate",
    "NoticeOut",
]
