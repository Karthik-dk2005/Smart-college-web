from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.utils.geofence import haversine_distance, verify_location_in_department
from app.utils.response import success_response, error_response


def log_audit(db, action: str, module: str, user_id=None, record_id: str = None, details: str = None, ip_address: str = "127.0.0.1"):
    try:
        from app.utils import log_audit as _la
        # If utils.py has log_audit
        import importlib
        mod = importlib.import_module("app.utils")
        if hasattr(mod, "log_audit") and mod.log_audit != log_audit:
            return mod.log_audit(db, action, module, user_id, record_id, details, ip_address)
    except Exception:
        pass
    print(f"[AUDIT LOG] {action} | {module} | user={user_id} | rec={record_id} | {details}")


def log_audit_event(db, action: str, resource_type: str, user_id=None, resource_id=None, details=None, ip_address="127.0.0.1"):
    print(f"[AUDIT LOG] {action} | {resource_type} | user={user_id} | res={resource_id} | {details}")


__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "haversine_distance",
    "verify_location_in_department",
    "success_response",
    "error_response",
    "log_audit",
    "log_audit_event",
]
