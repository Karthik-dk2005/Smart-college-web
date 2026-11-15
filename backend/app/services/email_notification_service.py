import os
import smtplib
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.faculty import Faculty
from app.models.department import Department


class EmailNotificationService:
    """
    SMTP-based Email Notification Service for SmartDept.
    Configured for Gmail SMTP with SSL/TLS and background task execution.
    Handles automatic delivery, status tracking, logging, and in-app sync.
    """

    @classmethod
    def get_smtp_config(cls) -> Dict[str, Any]:
        """Retrieve active SMTP credentials from environment or config."""
        host = os.environ.get("SMTP_HOST") or getattr(settings, "SMTP_HOST", "smtp.gmail.com")
        port = int(os.environ.get("SMTP_PORT") or getattr(settings, "SMTP_PORT", 587))
        username = os.environ.get("SMTP_USERNAME") or getattr(settings, "SMTP_USERNAME", "")
        password = os.environ.get("SMTP_PASSWORD") or getattr(settings, "SMTP_PASSWORD", "")
        from_email = os.environ.get("SMTP_FROM_EMAIL") or getattr(settings, "SMTP_FROM_EMAIL", username or "noreply.smartdept@gmail.com")
        from_name = os.environ.get("SMTP_FROM_NAME") or getattr(settings, "SMTP_FROM_NAME", "MITT SmartDept")

        return {
            "host": host,
            "port": port,
            "username": username.strip(),
            "password": password.strip(),
            "from_email": from_email.strip(),
            "from_name": from_name.strip(),
        }

    @classmethod
    def is_real_smtp_configured(cls) -> bool:
        """Check if production SMTP credentials are provided (not placeholders)."""
        cfg = cls.get_smtp_config()
        u = cfg["username"].lower()
        p = cfg["password"].lower()
        if not u or not p:
            return False
        if "your-college" in u or "your-gmail" in p or "app-password" in p:
            return False
        return True

    @classmethod
    def build_branded_html(
        cls,
        title: str,
        message: str,
        badge_text: str = "NOTIFICATION",
        details: Optional[Dict[str, str]] = None,
        action_url: Optional[str] = None,
        action_label: str = "Open SmartDept Portal"
    ) -> str:
        """Generate high-contrast, official MITT branded HTML template."""
        portal_url = action_url or getattr(settings, "FRONTEND_URL", "https://smart-college-web.vercel.app")
        details_html = ""
        if details:
            rows = ""
            for k, v in details.items():
                rows += f"""
                <tr>
                    <td style="padding: 8px 12px; font-weight: 600; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">{k}</td>
                    <td style="padding: 8px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">{v}</td>
                </tr>
                """
            details_html = f"""
            <div style="margin: 20px 0; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                    {rows}
                </table>
            </div>
            """

        action_button_html = f"""
        <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="{portal_url}" style="display: inline-block; background: linear-gradient(135deg, #0c3888 0%, #082866 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 24px; font-weight: 700; font-size: 14px; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(12, 56, 136, 0.25);">
                {action_label} &rarr;
            </a>
        </div>
        """

        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);">
    
    <!-- MITT Header -->
    <div style="background: linear-gradient(145deg, #09255e 0%, #0d2b6b 50%, #082255 100%); padding: 26px 28px; text-align: center; color: #ffffff; border-bottom: 3px solid #f59e0b;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.04em;">MAHARAJA INSTITUTE OF TECHNOLOGY</h2>
      <p style="margin: 3px 0 0 0; font-size: 12px; color: #93c5fd; letter-spacing: 0.08em; text-transform: uppercase;">Thandavapura, Mysuru</p>
      <div style="margin-top: 10px; display: inline-block; background: rgba(245, 158, 11, 0.18); border: 1px solid #f59e0b; color: #fef08a; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em;">
        SMARTDEPT ACADEMIC SYSTEM
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding: 30px 28px; color: #1e293b;">
      <div style="display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px;">
        {badge_text}
      </div>

      <h1 style="margin: 0 0 12px 0; font-size: 19px; font-weight: 800; color: #0c2c68; line-height: 1.35;">
        {title}
      </h1>

      <div style="font-size: 14.5px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
        {message}
      </div>

      {details_html}

      {action_button_html}
    </div>

    <!-- Institutional Footer -->
    <div style="background: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b; line-height: 1.5;">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #475569;">
        Department of Computer Science & Engineering
      </p>
      <p style="margin: 0;">
        Maharaja Institute of Technology Thandavapura &bull; VTU Affiliated, Approved by AICTE
      </p>
      <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 10.5px;">
        This is an automated institutional notification from SmartDept. Please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>
"""

    @classmethod
    def send_smtp_email(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Dispatches email via Gmail SMTP (port 587 with STARTTLS).
        Gracefully handles errors, logs attempts, and simulates if unconfigured.
        """
        clean_email = to_email.strip().lower()
        if not clean_email or "@" not in clean_email:
            return False, "Invalid recipient email address"

        cfg = cls.get_smtp_config()
        from_header = f"{cfg['from_name']} <{cfg['from_email']}>"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_header
        msg["To"] = clean_email

        plain_text = text_content or subject
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if not cls.is_real_smtp_configured():
            # Simulated delivery for development or test runs
            print(f"[SMTP SIMULATION] Sent email to '{clean_email}' | Subject: '{subject}' (Real SMTP credentials not supplied in .env)")
            return True, None

        try:
            with smtplib.SMTP(cfg["host"], cfg["port"], timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(cfg["username"], cfg["password"])
                server.sendmail(cfg["from_email"], [clean_email], msg.as_string())
            print(f"[SMTP SUCCESS] Delivered email to '{clean_email}' | Subject: '{subject}'")
            return True, None
        except Exception as e:
            err_msg = str(e)
            print(f"[SMTP ERROR] Failed sending to '{clean_email}': {err_msg}")
            return False, err_msg

    @classmethod
    def resolve_recipient_email(cls, db: Session, user: User) -> Optional[str]:
        """Fetch the exact registered Gmail or institutional email for a user."""
        if not user:
            return None
        # If student, check Student master table
        if user.role.lower() == "student":
            stud = db.query(Student).filter(
                (Student.user_id == user.id) |
                (func.upper(Student.usn) == (user.usn_or_employee_id or "").upper())
            ).first()
            if stud and stud.gmail and "@" in stud.gmail:
                return stud.gmail.strip().lower()
            if stud and stud.email and "@" in stud.email:
                return stud.email.strip().lower()

        # If faculty/teacher, check Teacher master table
        if user.role.lower() in ("teacher", "faculty"):
            tch = db.query(Teacher).filter(
                (Teacher.user_id == user.id) |
                (func.upper(Teacher.employee_id) == (user.usn_or_employee_id or "").upper())
            ).first()
            if tch and tch.email and "@" in tch.email:
                return tch.email.strip().lower()

        # Fallback to User.email
        if user.email and "@" in user.email:
            return user.email.strip().lower()
        return None

    @classmethod
    def check_user_email_preference(cls, db: Session, user_id: int, notification_type: str) -> bool:
        """Check if user has opted in for this specific notification type."""
        pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == user_id).first()
        if not pref:
            return True  # Default to True for all notifications

        mapping = {
            "attendance": pref.email_attendance,
            "marks": pref.email_marks,
            "timetable": pref.email_timetable,
            "announcement": pref.email_announcements,
            "event": pref.email_events,
            "system": pref.email_system,
        }
        return bool(mapping.get(notification_type, True))

    @classmethod
    def create_and_send_notification(
        cls,
        db: Session,
        user_id: Optional[int],
        title: str,
        message: str,
        notification_type: str = "general",
        category: str = "general",
        link: Optional[str] = None,
        badge_text: str = "NOTIFICATION",
        details: Optional[Dict[str, str]] = None,
        direct_email: Optional[str] = None
    ) -> Notification:
        """
        Creates an in-app Notification record and sends the SMTP email.
        Updates delivery_status, error_log, and sent_at timestamps.
        """
        recipient_email = direct_email
        target_user = None

        if user_id:
            target_user = db.query(User).filter(User.id == user_id).first()
            if not recipient_email and target_user:
                recipient_email = cls.resolve_recipient_email(db, target_user)

        # 1. Create in-app Notification record
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            link=link,
            read=False,
            recipient_email=recipient_email,
            notification_type=notification_type,
            delivery_status="pending"
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # 2. Check preference & email availability
        send_email = bool(recipient_email)
        if user_id and send_email:
            send_email = cls.check_user_email_preference(db, user_id, notification_type)

        if not send_email:
            notif.delivery_status = "in-app"
            db.commit()
            return notif

        # 3. Dispatch Email
        html_body = cls.build_branded_html(
            title=title,
            message=message,
            badge_text=badge_text,
            details=details,
            action_url=link
        )
        success, error_msg = cls.send_smtp_email(
            to_email=recipient_email,
            subject=f"[SmartDept] {title}",
            html_content=html_body,
            text_content=f"{title}\n\n{message}"
        )

        if success:
            notif.delivery_status = "sent"
            notif.sent_at = datetime.datetime.utcnow()
            notif.error_log = None
        else:
            notif.delivery_status = "failed"
            notif.error_log = error_msg

        db.commit()
        db.refresh(notif)
        return notif

    # -----------------------------------------------------------------
    # SPECIFIC DOMAIN TRIGGER METHODS
    # -----------------------------------------------------------------

    @classmethod
    def notify_student_attendance(
        cls,
        db: Session,
        student_id_or_usn: Any,
        subject_name: str,
        status_val: str,
        date_str: str,
        session_info: str = "Regular Class"
    ):
        """Trigger email notification when a student's attendance is marked or updated."""
        student = None
        if isinstance(student_id_or_usn, int):
            student = db.query(Student).filter(Student.id == student_id_or_usn).first()
        else:
            student = db.query(Student).filter(func.upper(Student.usn) == str(student_id_or_usn).upper()).first()

        if not student:
            return None

        user = student.user
        if not user and student.user_id:
            user = db.query(User).filter(User.id == student.user_id).first()

        user_id = user.id if user else None
        target_email = student.gmail or student.email or (user.email if user else None)

        status_formatted = status_val.capitalize()
        status_color = "#16a34a" if status_formatted == "Present" else "#dc2626"

        title = f"Attendance Update: {subject_name} ({status_formatted})"
        message = f"Your attendance for <strong>{subject_name}</strong> on {date_str} has been marked as <span style='color: {status_color}; font-weight: 700;'>{status_formatted}</span>."

        details = {
            "Student Name": student.name,
            "USN": student.usn,
            "Subject": subject_name,
            "Date": date_str,
            "Session": session_info,
            "Status": status_formatted
        }

        return cls.create_and_send_notification(
            db=db,
            user_id=user_id,
            title=title,
            message=message,
            notification_type="attendance",
            category="academic",
            link="/student/attendance",
            badge_text="ATTENDANCE UPDATE",
            details=details,
            direct_email=target_email
        )

    @classmethod
    def notify_student_ia_marks(
        cls,
        db: Session,
        student_id_or_usn: Any,
        subject_name: str,
        test_type: str,
        marks_obtained: float,
        max_marks: float = 30.0,
        remarks: Optional[str] = None
    ):
        """Trigger email notification when a student's IA marks are uploaded or updated."""
        student = None
        if isinstance(student_id_or_usn, int):
            student = db.query(Student).filter(Student.id == student_id_or_usn).first()
        else:
            student = db.query(Student).filter(func.upper(Student.usn) == str(student_id_or_usn).upper()).first()

        if not student:
            return None

        user = student.user
        if not user and student.user_id:
            user = db.query(User).filter(User.id == student.user_id).first()

        user_id = user.id if user else None
        target_email = student.gmail or student.email or (user.email if user else None)

        title = f"IA Marks Published: {subject_name} ({test_type})"
        message = f"Your Internal Assessment marks for <strong>{subject_name}</strong> ({test_type}) have been published."

        pct = round((marks_obtained / max_marks) * 100, 1) if max_marks else 0

        details = {
            "Student Name": student.name,
            "USN": student.usn,
            "Subject": subject_name,
            "Assessment": test_type,
            "Score": f"{marks_obtained} / {max_marks} ({pct}%)",
            "Status": "Passed" if pct >= 40 else "Needs Improvement"
        }
        if remarks:
            details["Remarks"] = remarks

        return cls.create_and_send_notification(
            db=db,
            user_id=user_id,
            title=title,
            message=message,
            notification_type="marks",
            category="academic",
            link="/my-ia-marks",
            badge_text="IA MARKS RELEASE",
            details=details,
            direct_email=target_email
        )

    @classmethod
    def notify_timetable_schedule(
        cls,
        db: Session,
        semester: int,
        section: str,
        subject_name: str,
        day: str,
        time_slot: str,
        room: str,
        teacher_id: Optional[int] = None
    ) -> int:
        """Notify all students of a semester/section and their teacher when a timetable slot is published or updated."""
        count = 0
        students = db.query(Student).filter(
            Student.semester == semester,
            func.upper(Student.section) == section.upper()
        ).all()

        details = {
            "Semester & Section": f"{semester}th Semester - Section {section.upper()}",
            "Subject": subject_name,
            "Day": day,
            "Timing": time_slot,
            "Room / Hall": room
        }

        # 1. Notify students
        for s in students:
            user = s.user or (db.query(User).filter(User.id == s.user_id).first() if s.user_id else None)
            u_id = user.id if user else None
            t_email = s.gmail or s.email or (user.email if user else None)

            cls.create_and_send_notification(
                db=db,
                user_id=u_id,
                title=f"Timetable Schedule Update: {subject_name}",
                message=f"A new class schedule has been updated for {semester}th Sem Section {section.upper()}.",
                notification_type="timetable",
                category="academic",
                link="/timetable",
                badge_text="TIMETABLE UPDATE",
                details=details,
                direct_email=t_email
            )
            count += 1

        # 2. Notify assigned teacher
        if teacher_id:
            tch = db.query(Teacher).filter(Teacher.id == teacher_id).first()
            if tch:
                t_user = tch.user or (db.query(User).filter(User.id == tch.user_id).first() if tch.user_id else None)
                tch_uid = t_user.id if t_user else None
                tch_email = tch.email or (t_user.email if t_user else None)

                cls.create_and_send_notification(
                    db=db,
                    user_id=tch_uid,
                    title=f"Teaching Schedule Assigned: {subject_name}",
                    message=f"You have been assigned to teach {subject_name} for {semester}th Sem Section {section.upper()}.",
                    notification_type="timetable",
                    category="academic",
                    link="/timetable",
                    badge_text="FACULTY SCHEDULE",
                    details=details,
                    direct_email=tch_email
                )
                count += 1

        return count

    @classmethod
    def notify_event_broadcast(
        cls,
        db: Session,
        title: str,
        description: str,
        event_date: str,
        venue: str,
        target_role: str = "all"
    ) -> int:
        """Broadcast event notification email to target audience."""
        users_query = db.query(User).filter(User.is_active == True)
        if target_role.lower() != "all":
            users_query = users_query.filter(func.lower(User.role) == target_role.lower())

        users = users_query.all()
        details = {
            "Event Title": title,
            "Date & Time": event_date,
            "Venue": venue,
            "Target Audience": target_role.capitalize()
        }

        count = 0
        for u in users:
            target_email = cls.resolve_recipient_email(db, u)
            cls.create_and_send_notification(
                db=db,
                user_id=u.id,
                title=f"Campus Event: {title}",
                message=description[:250] + ("..." if len(description) > 250 else ""),
                notification_type="event",
                category="event",
                link="/events",
                badge_text="DEPARTMENT EVENT",
                details=details,
                direct_email=target_email
            )
            count += 1
        return count

    @classmethod
    def notify_announcement_broadcast(
        cls,
        db: Session,
        title: str,
        content: str,
        target_role: str = "all",
        category: str = "announcement"
    ) -> int:
        """Broadcast official announcement email."""
        users_query = db.query(User).filter(User.is_active == True)
        if target_role.lower() != "all":
            users_query = users_query.filter(func.lower(User.role) == target_role.lower())

        users = users_query.all()
        count = 0
        for u in users:
            target_email = cls.resolve_recipient_email(db, u)
            cls.create_and_send_notification(
                db=db,
                user_id=u.id,
                title=f"Announcement: {title}",
                message=content[:250] + ("..." if len(content) > 250 else ""),
                notification_type="announcement",
                category="announcement",
                link="/announcements",
                badge_text="OFFICIAL CIRCULAR",
                direct_email=target_email
            )
            count += 1
        return count

    @classmethod
    def notify_admin_and_user_creation(
        cls,
        db: Session,
        new_user: User,
        created_by_role: str = "Self-Registered"
    ):
        """Notify user of account creation and alert the Admin."""
        # 1. Welcome user
        user_email = cls.resolve_recipient_email(db, new_user)
        if user_email:
            cls.create_and_send_notification(
                db=db,
                user_id=new_user.id,
                title="Welcome to SmartDept – Account Created",
                message=f"Hello {new_user.full_name or new_user.name}, your SmartDept institutional account ({new_user.role.upper()}) is ready.",
                notification_type="system",
                category="general",
                link="/login",
                badge_text="ACCOUNT PROVISIONED",
                details={
                    "Name": new_user.full_name or new_user.name,
                    "Identifier / USN": new_user.usn_or_employee_id or new_user.username or "N/A",
                    "Role": new_user.role.upper(),
                    "Status": getattr(new_user, "account_status", "Approved")
                },
                direct_email=user_email
            )

        # 2. Alert System Admin
        admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
        for a in admins:
            a_email = cls.resolve_recipient_email(db, a)
            cls.create_and_send_notification(
                db=db,
                user_id=a.id,
                title=f"System Alert: New {new_user.role.upper()} Account Registered",
                message=f"A new {new_user.role.upper()} account for {new_user.full_name or new_user.name} ({new_user.email}) was created ({created_by_role}).",
                notification_type="system",
                category="urgent",
                link="/admin/users",
                badge_text="ADMIN SECURITY ALERT",
                details={
                    "User": new_user.full_name or new_user.name,
                    "Role": new_user.role.upper(),
                    "Email / USN": new_user.email or new_user.usn_or_employee_id,
                    "Account Status": getattr(new_user, "account_status", "Approved")
                },
                direct_email=a_email
            )

    @classmethod
    def notify_hod_attendance_report(
        cls,
        db: Session,
        department_id: int,
        report_summary: str,
        details: Optional[Dict[str, str]] = None
    ):
        """Notify HOD of attendance reports and department updates."""
        hod_users = db.query(User).filter(
            User.role == "hod",
            User.is_active == True,
            (User.department_id == department_id) | (User.department_id == None)
        ).all()

        for h in hod_users:
            h_email = cls.resolve_recipient_email(db, h)
            cls.create_and_send_notification(
                db=db,
                user_id=h.id,
                title="HOD Academic Digest: Attendance Summary Report",
                message=report_summary,
                notification_type="attendance",
                category="academic",
                link="/attendance",
                badge_text="HOD DEPARTMENT REPORT",
                details=details,
                direct_email=h_email
            )
