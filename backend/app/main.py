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
    events_router,
    announcements_router,
    notifications_router,
    student_activities_router,
    marks_router,
    student_auth_router,
    admin_student_registration_router,
    admin_approval_router,
)



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup in development / serverless
    create_dev_tables()
    # Auto-seed initial department, users, subjects, and timetable if fresh database
    try:
        from app.database import SessionLocal
        from app.models.department import Department
        from app.models.mark import Mark
        with SessionLocal() as db:
            # Always ensure HOD institutional profile name is Dr. Ranjit K.N
            try:
                from app.models.user import User
                from app.models.teacher import Teacher
                from app.models.faculty import Faculty
                db.query(User).filter(User.role == "hod").update({"name": "Dr. Ranjit K.N", "full_name": "Dr. Ranjit K.N"})
                db.query(Teacher).filter((Teacher.email == "hod.cse@campus.edu") | (Teacher.email == "hod.cse@gmail.com")).update({"name": "Dr. Ranjit K.N"})
                db.query(Faculty).filter((Faculty.email == "hod.cse@campus.edu") | (Faculty.email == "hod.cse@gmail.com")).update({"name": "Dr. Ranjit K.N"})
                db.commit()
            except Exception as hod_sync_err:
                print(f"HOD name sync notice: {hod_sync_err}")

            if not db.query(Department).first():
                try:
                    from seed import seed_database
                    seed_database()
                except Exception as seed_err:
                    print(f"Auto-seed notice: {seed_err}")
            else:
                # Ensure bus routes and student bus assignments exist
                try:
                    from app.models.student_bus_assignment import StudentBusAssignment
                    from app.models.bus_route import BusRoute
                    if not db.query(BusRoute).first() or not db.query(StudentBusAssignment).first():
                        from app.utils.bus_seed_data import seed_bus_routes_and_assignments
                        seed_bus_routes_and_assignments(db)
                except Exception as bus_seed_err:
                    print(f"Bus transit auto-seed notice: {bus_seed_err}")
    except Exception as e:
        print(f"Database startup check: {e}")
    yield


app = FastAPI(
    title="SmartDept - Smart Department Academic & Campus Management System",
    description="Production-ready FastAPI backend for SmartDept - Smart Department Academic & Campus Management System.",
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
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
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
@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint returning system status."""
    return {
        "status": "ok",
        "service": "SmartDept - Smart Department Academic & Campus Management System"
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
app.include_router(events_router)
app.include_router(announcements_router)
app.include_router(notifications_router)
app.include_router(student_activities_router)
app.include_router(marks_router)
app.include_router(student_auth_router)
app.include_router(admin_student_registration_router)
app.include_router(admin_approval_router)

# Direct aliases for /api/my-events and /api/my-registrations
from app.routers.events import get_my_created_or_dept_events, get_my_registrations
from app.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

app.add_api_route("/api/my-events", get_my_created_or_dept_events, methods=["GET"], tags=["Events"])
app.add_api_route("/api/my-registrations", get_my_registrations, methods=["GET"], tags=["Events"])

@app.get("/api/ia-marks", tags=["Internal Marks & Gradebook"])
def get_direct_ia_marks(db: Session = Depends(get_db)):
    """Direct alias endpoint for /api/ia-marks delivering full student-grouped component marks."""
    from app.models.mark import Mark
    records = db.query(Mark).filter(Mark.semester == 5, Mark.ia_number == "IA-1").order_by(Mark.section.asc(), Mark.sl_no.asc()).all()
    students_map = {}
    for r in records:
        if r.usn not in students_map:
            students_map[r.usn] = {
                "sl_no": r.sl_no,
                "student_name": r.student_name,
                "usn": r.usn,
                "section": r.section,
                "marks": []
            }
        
        c1 = "AB" if r.is_absent or r.obtained_marks is None else (int(r.obtained_marks) if float(r.obtained_marks).is_integer() else float(r.obtained_marks))
        c2 = "AB" if r.is_absent or r.scaled_marks is None else (int(r.scaled_marks) if float(r.scaled_marks).is_integer() else float(r.scaled_marks))
        
        m1 = int(r.maximum_marks) if r.maximum_marks is not None and float(r.maximum_marks).is_integer() else r.maximum_marks
        m2 = int(r.scaled_max_marks) if r.scaled_max_marks is not None and float(r.scaled_max_marks).is_integer() else r.scaled_max_marks

        students_map[r.usn]["marks"].append({
            "subject_name": r.short_name or r.subject_code,
            "subject_code": r.subject_code,
            "component1": c1,
            "max1": m1,
            "component2": c2,
            "max2": m2
        })
    return list(students_map.values())


# ---------------------------------------------------------
# Static Uploads Directory Mounting
# ---------------------------------------------------------
import os
from fastapi.staticfiles import StaticFiles

if os.environ.get("VERCEL"):
    UPLOADS_DIR = "/tmp/uploads"
else:
    UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))

try:
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
except Exception as e:
    print(f"Notice: /uploads mount skipped: {e}")


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
            return FileResponse(
                index_file,
                headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
            )
        return JSONResponse({"status": "Frontend build not found"}, status_code=404)
