from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager

from app.config import settings
from app.database import create_dev_tables
from app.routers import (
    auth_router,
    users_router,
    students_router,
    faculty_router,
    teachers_router,
    rooms_router,
    departments_router,
    subjects_router,
    attendance_router,
    timetable_router,
    locations_router,
    notices_router,
    dashboard_router,
    face_router,
    biometric_router,
    buses_router,
)



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup in development / serverless
    create_dev_tables()
    # Auto-seed initial department, users, subjects, and timetable if fresh database
    try:
        from app.database import SessionLocal
        from app.models.department import Department
        with SessionLocal() as db:
            if not db.query(Department).first():
                try:
                    from seed import seed_database
                    seed_database()
                except Exception as seed_err:
                    print(f"Auto-seed notice: {seed_err}")
    except Exception as e:
        print(f"Database startup check: {e}")
    yield


app = FastAPI(
    title="Smart Department Backend",
    description="Production-ready FastAPI backend for Smart Department Academic Management System.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Authentication", "description": "JWT authentication, login, registration, token refresh, and profile endpoints"},
        {"name": "Users", "description": "User account management and role administration"},
        {"name": "Students", "description": "Student academic profiles and management"},
        {"name": "Faculty", "description": "Faculty staff profiles and designations"},
        {"name": "Departments", "description": "Academic department records and HOD assignment"},
        {"name": "Subjects", "description": "Department subjects, credits, and syllabus courses"},
        {"name": "Attendance", "description": "Attendance tracking, geofence verification, and percentage statistics"},
        {"name": "Timetable", "description": "Weekly class schedules, room allocations, and period timings"},
        {"name": "Locations", "description": "Live GPS location updates, campus geofencing, and WebSocket streams"},
        {"name": "Notices", "description": "Department announcements and targeted broadcast notices"},
    ]
)

# ---------------------------------------------------------
# CORS Middleware Configuration
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Standard Consistent JSON Error Handling
# ---------------------------------------------------------
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail),
            "error": str(exc.detail),
            "detail": str(exc.detail),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", [])])
        msg = err.get("msg", "Invalid input")
        error_messages.append(f"{field}: {msg}")

    msg_summary = "; ".join(error_messages)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": f"Validation failed: {msg_summary}",
            "error": msg_summary,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": f"Internal server error: {str(exc)}",
            "error": str(exc),
        },
    )


# ---------------------------------------------------------
# Health Check Endpoint (Required format)
# ---------------------------------------------------------
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint returning system status."""
    return {
        "status": "ok",
        "service": "Smart Department Backend"
    }




# ---------------------------------------------------------
# Mount All 11 API Routers
# ---------------------------------------------------------
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(students_router)
app.include_router(faculty_router)
app.include_router(teachers_router)
app.include_router(rooms_router)
app.include_router(departments_router)
app.include_router(subjects_router)
app.include_router(attendance_router)
app.include_router(timetable_router)
app.include_router(locations_router)
app.include_router(notices_router)
app.include_router(dashboard_router)
app.include_router(face_router)
app.include_router(biometric_router)
app.include_router(buses_router)


# ---------------------------------------------------------
# Combined Frontend Mounting & SPA Fallback Route
# ---------------------------------------------------------
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa_frontend(request: Request, full_path: str):
        # Allow API routes, docs, and health checks to pass through
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json", "health"):
            raise StarletteHTTPException(status_code=404, detail="Not Found")

        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)

        # Fallback to index.html for React Router client-side routing
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse({"status": "Frontend build not found"}, status_code=404)
