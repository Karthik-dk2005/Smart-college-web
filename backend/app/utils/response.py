from typing import Any, Dict, Optional


def success_response(
    data: Any = None,
    message: str = "Operation completed successfully",
    status_code: Optional[int] = None
) -> Dict[str, Any]:
    """Standard success API response format."""
    return {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }


def error_response(
    message: str = "Operation failed",
    error: Optional[str] = None,
    status_code: Optional[int] = None
) -> Dict[str, Any]:
    """Standard error API response format."""
    return {
        "success": False,
        "message": message,
        "error": error if error is not None else message
    }
