# Smart Department Backend API

Production-ready **Python FastAPI** backend for the **Smart Department Academic Management System**. Built with Python 3.11+, SQLAlchemy, Pydantic v2, Alembic migrations, JWT Authentication, and WebSockets.

---

## Technology Stack

- **Python**: 3.11+
- **FastAPI**: Modern, fast web framework for building REST APIs & WebSockets
- **SQLAlchemy 2.0**: Relational ORM mapping
- **Alembic**: Database migrations management
- **PostgreSQL / SQLite**: PostgreSQL with SQLite development fallback
- **Pydantic v2**: High-performance data validation
- **Passlib & bcrypt**: Secure password hashing
- **Python-Jose**: Cryptographic JWT access & refresh tokens
- **Uvicorn**: Lightning-fast ASGI production server
- **Pytest**: Automated test suite

---

## Directory Architecture

```text
backend/
├── app/
│   ├── main.py                   # FastAPI app, CORS, OpenAPI tags, lifespan, exception handlers
│   ├── database.py               # Engine, SessionLocal, Base, get_db(), create_dev_tables()
│   ├── config.py                 # Pydantic Settings with .env loading & CORS configuration
│   ├── dependencies.py           # JWT security, get_current_user, require_role, require_any_role
│   │
│   ├── models/                   # Modular SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py               # User authentication & role model
│   │   ├── department.py         # Academic departments & HOD assignment
│   │   ├── student.py            # Student profiles, USN, semester & section
│   │   ├── faculty.py            # Faculty profiles, employee IDs, designation
│   │   ├── subject.py            # Subject courses, codes, credits & faculty assignment
│   │   ├── attendance.py         # Attendance tracking with geofence verification
│   │   ├── timetable.py          # Weekly class schedule slots with rooms & periods
│   │   ├── location.py           # Real-time GPS location coordinates & history
│   │   └── notice.py             # Department announcements & targeted broadcasts
│   │
│   ├── schemas/                  # Pydantic v2 request/response schemas
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── department.py
│   │   ├── student.py
│   │   ├── faculty.py
│   │   ├── subject.py
│   │   ├── attendance.py
│   │   ├── timetable.py
│   │   ├── location.py
│   │   └── notice.py
│   │
│   ├── routers/                  # Modular API Routers
│   │   ├── __init__.py
│   │   ├── auth.py               # POST /api/auth/register, /login, /refresh, /me, /logout
│   │   ├── users.py              # Full CRUD: /api/users
│   │   ├── students.py           # Full CRUD: /api/students
│   │   ├── faculty.py            # Full CRUD: /api/faculty
│   │   ├── departments.py        # Full CRUD: /api/departments
│   │   ├── subjects.py           # Full CRUD: /api/subjects
│   │   ├── attendance.py         # Full CRUD: /api/attendance + student, subject, date, percentage
│   │   ├── timetable.py          # Full CRUD: /api/timetable with semester, section, day filters
│   │   ├── locations.py          # POST /update, GET /current, /history + WebSocket /ws/{user_id}
│   │   └── notices.py            # Full CRUD: /api/notices
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── security.py           # Bcrypt hashing & JWT access/refresh token generation
│   │   ├── geofence.py           # Haversine distance & campus boundary check
│   │   └── response.py           # Standard success_response and error_response builders
│   │
├── alembic/                      # Database migrations
│   ├── versions/
│   │   └── 001_initial_schema.py # Initial migration with all 9 core tables
│   ├── env.py
│   └── script.py.mako
├── alembic.ini                   # Alembic configuration
├── seed.py                       # Academic Year 2026-27 5th Sem Sections A & B seed script
├── test_api.py                   # Pytest test suite covering all endpoints & roles
├── requirements.txt              # Production dependency specifications
├── .env.example                  # Environment configuration template
└── README.md
```

---

## User Roles & Permissions

| Role | Access Privileges |
|---|---|
| **admin** | Full CRUD access across all models (Users, Students, Faculty, Departments, Subjects, Attendance, Timetable, Notices, Locations) |
| **hod** | Department management, Faculty & Student management, Attendance oversight, Timetable scheduling, Notices publishing |
| **faculty** | View assigned subjects, Mark student attendance, Update attendance records, View enrolled students, View weekly timetable |
| **student** | View profile, View own attendance history & percentage, View class timetable, View enrolled subjects, Read campus notices |

---

## Installation & Setup

### 1. Clone repository & Navigate to backend

```bash
cd backend
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your database and geofence parameters:
```ini
# Development (SQLite)
DATABASE_URL=sqlite:///./smart_department.db

# Production (PostgreSQL)
# DATABASE_URL=postgresql://postgres:password@localhost:5432/smart_department_db

SECRET_KEY=your_production_secret_key_jwt_2026
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# Campus Geofence Coordinates
DEPARTMENT_LATITUDE=12.183700
DEPARTMENT_LONGITUDE=76.694200
DEPARTMENT_RADIUS_METERS=300
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Alembic Migrations

```bash
alembic upgrade head
```

### 5. Seed Database

Populates Academic Year 2026–2027 ODD SEM 5th Semester Sections A (Room CS-303) and B (Room CS-304), subjects, users, attendance, and notices:

```bash
python seed.py
```

### 6. Run the ASGI Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Interactive API Documentation

Interactive Swagger and ReDoc documentation are available out of the box:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`
- **Health Check**: `http://localhost:8000/health`

---

## API Endpoints Overview

### Health
- `GET /health`: System health status `{"status": "ok", "service": "Smart Department Backend"}`

### Authentication
- `POST /api/auth/register`: Register user account
- `POST /api/auth/login`: Authenticate and obtain JWT access & refresh tokens
- `POST /api/auth/refresh`: Refresh expired access token
- `GET /api/auth/me`: Retrieve current user profile and linked academic profile
- `POST /api/auth/logout`: Stateless logout

### Users
- `POST /api/users`: Create user (Admin)
- `GET /api/users`: List users (Admin, HOD)
- `GET /api/users/{id}`: Get user details
- `PUT /api/users/{id}`: Update user profile
- `DELETE /api/users/{id}`: Delete user (Admin)

### Students
- `POST /api/students`: Register student and credentials (Admin, HOD)
- `GET /api/students`: Filter students by semester, section, department
- `GET /api/students/{id}`: Get student record
- `PUT /api/students/{id}`: Update student record
- `DELETE /api/students/{id}`: Delete student record

### Faculty
- `POST /api/faculty`: Register faculty member and credentials
- `GET /api/faculty`: List faculty members
- `GET /api/faculty/{id}`: Get faculty details
- `PUT /api/faculty/{id}`: Update faculty profile
- `DELETE /api/faculty/{id}`: Delete faculty record

### Departments
- `POST /api/departments`: Create department (Admin)
- `GET /api/departments`: List all departments
- `GET /api/departments/{id}`: Get department details
- `PUT /api/departments/{id}`: Update department
- `DELETE /api/departments/{id}`: Delete department

### Subjects
- `POST /api/subjects`: Register subject course (Admin, HOD)
- `GET /api/subjects`: List subjects with filters (sem, dept, faculty)
- `GET /api/subjects/{id}`: Get subject details
- `PUT /api/subjects/{id}`: Update subject
- `DELETE /api/subjects/{id}`: Delete subject

### Attendance
- `POST /api/attendance`: Mark attendance with optional GPS geofence verification
- `GET /api/attendance`: List attendance records with filters
- `GET /api/attendance/student/{student_id}`: All attendance for a student
- `GET /api/attendance/subject/{subject_id}`: All attendance for a subject
- `GET /api/attendance/date/{date}`: Attendance records on date (YYYY-MM-DD)
- `GET /api/attendance/percentage/{student_id}`: Calculate percentage `(present / total) * 100` and breakdown
- `GET /api/attendance/{id}`: Get single attendance entry
- `PUT /api/attendance/{id}`: Update attendance status/remarks
- `DELETE /api/attendance/{id}`: Delete attendance record

### Timetable
- `POST /api/timetable`: Create timetable slot
- `GET /api/timetable`: List slots with filters (`semester`, `section`, `department`, `faculty`, `day`)
- `GET /api/timetable/{id}`: Get slot by ID
- `PUT /api/timetable/{id}`: Update slot
- `DELETE /api/timetable/{id}`: Delete slot

### Locations & Geofence
- `POST /api/location/update`: Post GPS coordinates, evaluate department geofence, and broadcast
- `GET /api/location/current/{user_id}`: Get latest user GPS location & distance from campus
- `GET /api/location/history/{user_id}`: Get chronological location history
- `WS /api/location/ws/{user_id}`: Real-time WebSocket connection for live GPS streaming

### Notices
- `POST /api/notices`: Publish notice (Faculty, HOD, Admin)
- `GET /api/notices`: List notices targeted to role or 'all'
- `GET /api/notices/{id}`: Get notice details
- `PUT /api/notices/{id}`: Update notice
- `DELETE /api/notices/{id}`: Delete notice

---

## Running Automated Tests

Run the complete Pytest suite:

```bash
pytest test_api.py -v
```

All 11 tests verify:
- Authentication & JWT token life-cycle
- Role-based authorization & permission rejection
- Student, Faculty, Department, and Subject CRUD
- Attendance tracking, status updates, and percentage calculation
- Timetable CRUD and filtering by Section A (CS-303) and Section B (CS-304)
- Geofence calculation (Haversine formula within 300m)
- Notice broadcasts
- System health probe
