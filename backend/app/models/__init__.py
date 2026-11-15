from app.models.department import Department
from app.models.teacher import Teacher
from app.models.faculty import Faculty
from app.models.student import Student
from app.models.subject import Subject
from app.models.room import Room
from app.models.timetable import Timetable
from app.models.attendance import Attendance
from app.models.attendance_session import AttendanceSession
from app.models.attendance_interval import AttendanceInterval
from app.models.student_attendance import StudentAttendance
from app.models.location import Location
from app.models.notice import Notice
from app.models.user import User
from app.models.student_face import StudentFace
from app.models.student_biometric import StudentBiometric
from app.models.bus_route import BusRoute
from app.models.bus_stop import BusStop
from app.models.student_bus_assignment import StudentBusAssignment
from app.models.event import Event, EventRegistration
from app.models.announcement import Announcement
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.models.student_activity import StudentActivity, StudentActivityFile, StudentActivityVerification
from app.models.mark import Mark
from app.models.unmatched_student import UnmatchedStudentRecord
from app.models.email_otp import EmailOTP

__all__ = [
    "Department",
    "Teacher",
    "Faculty",
    "Student",
    "Subject",
    "Room",
    "Timetable",
    "Attendance",
    "AttendanceSession",
    "AttendanceInterval",
    "StudentAttendance",
    "Location",
    "Notice",
    "User",
    "StudentFace",
    "StudentBiometric",
    "BusRoute",
    "BusStop",
    "StudentBusAssignment",
    "Event",
    "EventRegistration",
    "Announcement",
    "Notification",
    "StudentActivity",
    "StudentActivityFile",
    "StudentActivityVerification",
    "Mark",
    "UnmatchedStudentRecord",
    "EmailOTP",
]
