import math
import hashlib
import datetime
from sqlalchemy.orm import Session
from app.models import AuditLog, Session as SessionModel


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in meters.
    Authoritative server-side Haversine formula.
    """
    R = 6371000.0  # Earth's radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = R * c
    return round(distance, 2)


def generate_session_id(db: Session, prefix: str = "SESSION") -> str:
    """Generate a sequential unique session code like SESSION-2026-000001."""
    current_year = datetime.date.today().year
    count = db.query(SessionModel).count() + 1
    return f"{prefix}-{current_year}-{count:06d}"


def generate_verification_hash(student_id: int, lat: float, lon: float, timestamp: str) -> str:
    """Generate a SHA-256 verification token for audit validation."""
    raw = f"{student_id}:{lat:.6f}:{lon:.6f}:{timestamp}:THANDAVAPURA_GEOFENCE_SALT"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16].upper()
    return f"GEO-VER-{digest}"


def log_audit(
    db: Session,
    action: str,
    module: str,
    user_id: int = None,
    record_id: str = None,
    details: str = None,
    ip_address: str = "127.0.0.1"
):
    """Save an immutable audit log record to the database."""
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            record_id=str(record_id) if record_id else None,
            details=details,
            ip_address=ip_address,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to record audit log: {e}")


def log_audit_event(
    db: Session,
    action: str,
    module: str,
    user_id: int = None,
    record_id: str = None,
    details: str = None,
    ip_address: str = "127.0.0.1"
):
    """Alias for log_audit ensuring flexible keyword argument order."""
    return log_audit(
        db=db,
        action=action,
        module=module,
        user_id=user_id,
        record_id=record_id,
        details=details,
        ip_address=ip_address
    )

