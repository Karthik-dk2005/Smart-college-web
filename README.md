# 🎓 Smart Department Academic Management System

A production-grade, full-stack academic enterprise platform built with **React**, **FastAPI (Python 3.11+)**, **SQLAlchemy ORM**, **Pydantic**, and **JWT Authentication**.

---

## 🏗️ Architecture Overview

```text
smart-department/
│
├── frontend/                     # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, modals
│   │   ├── context/              # AuthContext (JWT, session persistence, role routing)
│   │   ├── layouts/              # DashboardLayout with responsive sidebar & navbar
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx     # 1-Click demo role picker & login form
│   │   │   ├── student/          # StudentDashboard, Attendance (GPS geofenced), Timetable, Marks, Exams, Materials, Bus, Notices
│   │   │   ├── teacher/          # TeacherDashboard, Attendance session creator, Marks entry
│   │   │   ├── hod/              # HodDashboard, <75% shortage detector, Marks finalization
│   │   │   ├── admin/            # AdminDashboard, User management, Rooms, Audit logs
│   │   │   └── ProfileView.jsx   # Universal authenticated identity profile
│   │   ├── services/
│   │   │   └── api.js            # Unified API service layer connecting to http://localhost:8000/api
│   │   ├── App.jsx               # Role-based route rendering
│   │   └── index.css             # Vanilla CSS design system with glassmorphism & dark theme
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Python 3.11+ FastAPI Backend
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, exception handlers, /health
│   │   ├── database.py           # Engine, SessionLocal, get_db(), init_db() with auto-seeding
│   │   ├── models.py             # 18 SQLAlchemy models (Student, Teacher, Attendance, Timetable, Marks, etc.)
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── auth.py               # Bcrypt password hashing & JWT encoding/decoding
│   │   ├── dependencies.py       # Role-based access control (student, teacher, hod, admin)
│   │   ├── config.py             # Settings reading .env
│   │   ├── utils.py              # Haversine distance formula, session ID generator, audit logger
│   │   │
│   │   ├── routers/              # 16 REST API routers (all prefixed with /api/*)
│   │   │   ├── auth.py
│   │   │   ├── students.py
│   │   │   ├── teachers.py
│   │   │   ├── hod.py
│   │   │   ├── admin.py
│   │   │   ├── attendance.py     # Live GPS geofence validation, session tokens
│   │   │   ├── timetable.py      # Room & teacher conflict checks, substitutes
│   │   │   ├── rooms.py
│   │   │   ├── exams.py
│   │   │   ├── marks.py          # Continuous assessment & VTU letter grades
│   │   │   ├── assignments.py
│   │   │   ├── materials.py
│   │   │   ├── notices.py
│   │   │   ├── notifications.py
│   │   │   ├── bus.py            # Transit routes & timings
│   │   │   └── dashboard.py      # Role-aggregated dashboards
│   │   │
│   │   └── services/
│   │       ├── attendance_service.py # Haversine distance, duplicate prevention
│   │       ├── timetable_service.py  # Collision detection
│   │       └── notification_service.py
│   │
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   └── test_suite.py             # 15-step automated test suite
│
└── README.md
```

---

## 🚀 Running the Application

### 1. Start the Backend Server (Port 8000)

```bash
cd backend

# Create virtual environment & install requirements
uv venv .venv --python 3.11
uv pip install -r requirements.txt

# Or with standard Python venv:
# python -m venv venv
# venv\Scripts\activate
# pip install -r requirements.txt

# Run FastAPI backend server
uv run python -m uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Start the Frontend Server (Port 5173)

```bash
cd frontend
npm install
npm run dev
```

- **Web Portal**: [http://localhost:5173](http://localhost:5173)

---

## 👥 Development Login Credentials

All accounts are pre-seeded upon initial startup. Password for all accounts: **`password123`**.

| Role | Name | Email | Password | Persona & Privileges |
|------|------|-------|----------|----------------------|
| **Student** | Amulya H S | `amulya.h.s@mitt.ac.in` | `password123` | Sem 6 (USN: `4MT22CS010`), live geofence attendance, marks, timetable. |
| **Teacher** | Prof. Ananya Iyer | `ananya.iyer@faculty.campus.edu` | `password123` | CSE Faculty (`FAC-CSE-001`), creates attendance sessions, enters marks. |
| **HOD** | Dr. Vikramaditya Sen | `hod.cse@campus.edu` | `password123` | Department oversight, attendance shortage alerts (&lt;75%), locks & finalizes marks. |
| **Admin** | Dr. Robert Hawthorne | `admin@campus.edu` | `password123` | Master user directory, facilities allocation, bus schedules, audit logs. |

---

## 📍 GPS Geofence Attendance Verification

The system validates attendance marking using the **server-side Haversine formula**:

- **College Coordinates**: `12.183700° N, 76.694200° E` (Configurable via `COLLEGE_LAT`, `COLLEGE_LON` in `.env`)
- **Allowed Radius**: `300 meters` (Configurable via `ATTENDANCE_RADIUS_METERS`)
- **Workflow**:
  1. Teacher opens a session: backend generates a human-readable unique code (e.g. `SESSION-2026-000001`).
  2. Student inputs session code and clicks **"MARK ATTENDANCE"**.
  3. Browser requests device GPS coordinates via HTML5 Geolocation API.
  4. Coordinates are sent to `POST /api/attendance/mark`.
  5. Backend calculates the great-circle distance.
  6. If distance ≤ 300m: attendance marked as `PRESENT`, generates SHA-256 verification hash, records audit log.
  7. If distance &gt; 300m: rejected with `"You are outside the college attendance area"`.
  8. Duplicate check-ins are strictly blocked (`409 Conflict`).
