# 🎓 SmartDept - Smart Department Academic & Campus Management System

A complete, production-ready, full-stack **SmartDept - Smart Department Academic & Campus Management System** built with **React (Vite)**, **Python FastAPI (3.11+)**, **SQLAlchemy ORM**, **Pydantic v2**, **Alembic Migrations**, **SQLite/PostgreSQL**, and **JWT Authentication**.

---

## 🏛️ Project Architecture

```text
smart-department/
│
├── frontend/                     # React + Vite Frontend Application
│   ├── src/
│   │   ├── api/                  # Central Axios API client modules
│   │   │   ├── axios.js          # Central Axios instance with JWT interceptors
│   │   │   ├── auth.js           # Login, register, token refresh
│   │   │   ├── students.js       # Student CRUD
│   │   │   ├── faculty.js        # Faculty CRUD
│   │   │   ├── departments.js    # Department CRUD
│   │   │   ├── subjects.js       # Subject CRUD
│   │   │   ├── attendance.js     # Attendance marking, percentage calculation
│   │   │   ├── timetable.py      # Timetable API with day & section filters
│   │   │   ├── locations.js      # Browser GPS update & history
│   │   │   ├── notices.js        # Circulars and announcements CRUD
│   │   │   ├── dashboard.js      # Metrics & chart datasets
│   │   │   └── users.js          # User profile & credentials management
│   │   ├── components/           # Navbar, Sidebar, Modal, ConfirmDialog, TableSkeleton, Toast
│   │   ├── context/              # AuthContext (JWT tokens, role state, auto-refresh)
│   │   ├── layouts/              # MainLayout (responsive sidebar & header)
│   │   ├── pages/                # All 14 Dedicated Full-Stack Pages
│   │   │   ├── 1. Login.jsx      # JWT Auth with 1-click role quick login
│   │   │   ├── 2. Register.jsx   # Real account creation with role picker
│   │   │   ├── 3. Dashboard.jsx  # Metrics, live charts, today's schedule, circulars
│   │   │   ├── 4. Students.jsx   # Full CRUD, USN search, semester/section filter
│   │   │   ├── 5. Faculty.jsx    # Full CRUD, Employee ID, designation
│   │   │   ├── 6. Departments.jsx# Full CRUD, department statistics & HOD linkage
│   │   │   ├── 7. Subjects.jsx   # Full CRUD, subject code, credits, faculty allocation
│   │   │   ├── 8. Attendance.jsx # Geofence-verified marking, roster, percentages
│   │   │   ├── 9. Timetable.jsx  # 5th Sem ODD 2026-27 (5A: CS-303, 5B: CS-304)
│   │   │   ├── 10. LiveLocation.jsx # navigator.geolocation, radar visualizer, WebSocket
│   │   │   ├── 11. Notices.jsx   # Announcements CRUD, target audience filter
│   │   │   ├── 12. Profile.jsx   # Academic credentials, profile & password edit
│   │   │   ├── 13. Settings.jsx  # Geofence configuration, API health diagnostic
│   │   │   └── 14. Reports.jsx   # VTU attendance shortage (<75%), CSV export, print
│   │   ├── App.jsx               # React Router v6 setup with ProtectedRoute boundaries
│   │   └── index.css             # High-contrast, modern dark theme design system
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Python 3.11+ FastAPI Backend
│   ├── alembic/                  # Alembic database migrations
│   │   ├── versions/
│   │   │   └── 001_initial_schema.py # Initial database schema migration
│   │   └── env.py
│   ├── app/
│   │   ├── main.py               # FastAPI application, CORS, routers mount, /health
│   │   ├── database.py           # SQLAlchemy engine, SessionLocal, Base, SQLite/PostgreSQL
│   │   ├── config.py             # App configuration & geofence parameters
│   │   ├── dependencies.py       # Role-based dependency injection (admin, hod, faculty, student)
│   │   ├── models/               # SQLAlchemy ORM Models
│   │   │   ├── user.py           # User account model
│   │   │   ├── student.py        # Student profile model (USN, Sem, Sec)
│   │   │   ├── faculty.py        # Faculty profile model (Emp ID, Designation)
│   │   │   ├── department.py     # Academic department model
│   │   │   ├── subject.py        # Subject syllabus model (Code, Credits)
│   │   │   ├── attendance.py     # Daily attendance log model
│   │   │   ├── timetable.py      # Weekly timetable slot model
│   │   │   ├── location.py       # Geolocation coordinate model
│   │   │   └── notice.py         # Department circular model
│   │   ├── schemas/              # Pydantic v2 Request/Response validation schemas
│   │   ├── routers/              # 11 REST API Routers
│   │   │   ├── auth.py           # /api/auth (Login, Register, Refresh)
│   │   │   ├── users.py          # /api/users (User CRUD, password change)
│   │   │   ├── students.py       # /api/students (Student CRUD, filters)
│   │   │   ├── faculty.py        # /api/faculty (Faculty CRUD)
│   │   │   ├── departments.py    # /api/departments (Department CRUD)
│   │   │   ├── subjects.py       # /api/subjects (Subject CRUD)
│   │   │   ├── attendance.py     # /api/attendance (Marking, percentage calculation)
│   │   │   ├── timetable.py      # /api/timetable (Weekly schedule, room allocation)
│   │   │   ├── locations.py      # /api/location (Browser GPS updates, WebSocket)
│   │   │   ├── notices.py        # /api/notices (Department bulletins CRUD)
│   │   │   └── dashboard.py      # /api/dashboard (Aggregated metrics & charts)
│   │   └── utils/
│   │       ├── security.py       # Passlib bcrypt & PyJWT token management
│   │       ├── geofence.py       # Haversine distance geofence algorithm
│   │       └── response.py       # Standardized JSON response envelope
│   ├── seed.py                   # Realistic seed script for 2026–2027 ODD Semester
│   ├── test_api.py               # Automated pytest suite (11 test suites)
│   ├── verify_live.py            # Live end-to-end API verification script
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend (Port 8000)

```bash
cd backend

# Create virtual environment & install requirements
uv venv .venv --python 3.11
uv pip install -r requirements.txt

# Run migrations & seed data (Academic Year 2026–2027 ODD Sem)
uv run python seed.py

# Launch FastAPI development server
uv run python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **System Health Probe**: [http://localhost:8000/health](http://localhost:8000/health)

---

### 2. Start the React Frontend (Port 5173)

```bash
cd frontend

# Install dependencies
npm install

# Start Vite server
npm run dev -- --host 0.0.0.0 --port 5173
```

- **Application Web Portal**: [http://localhost:5173](http://localhost:5173)

---

## 👥 Default Demo Credentials

Password for all pre-seeded accounts: **`password123`**

| Role | Name | Email / Username | Persona & Privileges |
|------|------|------------------|----------------------|
| **Admin** | System Administrator | `admin@campus.edu` | Master access across all departments: add/edit/remove students & teachers, rooms, subjects, timetable. |
| **HOD** | Dr. Vikramaditya Sen | `hod.cse@campus.edu` | Professor & HOD (CSE): Manage students and teachers in own department only. Timetable, attendance, reports. |
| **Teacher** | Prof. Ananya Iyer | `ananya.iyer@faculty.campus.edu` | Associate Professor: View assigned timetable, take timetable-based attendance. NO student/teacher CRUD. |
| **Student (5A)** | Karthik D K | `karthik.dk@college.edu` | 5th Sem Sec A (USN: `4MT22CS008`): View own profile, timetable, and attendance history. NO student/teacher CRUD. |
| **Student (5A)** | Aarav Sharma | `aarav.sharma@college.edu` | 5th Sem Sec A (USN: `4MT22CS001`): View own profile, timetable, and attendance history. NO student/teacher CRUD. |

---

## 🛡️ Role-Based Permissions & Management

### Admin
- **Full student & teacher management** across all departments.
- Add, View, Edit, Remove/Deactivate students and teachers.
- Assign departments, semesters, sections.
- Access: `/admin/students`, `/admin/students/add`, `/admin/teachers`, `/admin/teachers/add`.

### HOD
- Manage students and teachers **in own department only** (`current_user.department_id == target.department_id`).
- Backend strictly enforces department boundary (`403 Forbidden` if attempting to modify other departments).
- Access: `/hod/students`, `/hod/students/add`, `/hod/teachers`, `/hod/teachers/add`.

### Teacher & Student Restrictions
- **Zero CRUD Permissions**: Teachers and Students are blocked from creating, editing, or deleting students/teachers.
- Front-end hides action buttons, and back-end strictly returns **`403 Forbidden`** on any unauthorized API request.

### Safe Historical Deactivation
- Before removing a student or teacher, the system checks for existing attendance records or timetable entries.
- If historical data exists, the record is safely set to **`status = "inactive"`** (`Student/Teacher deactivated successfully.`), permanently preserving academic and attendance history.

---

## 🧪 Automated Test Verification

Run all test suites anytime using the Python virtual environment:

```powershell
# 1. Test Attendance Strictly Connected to Timetable (10/10 tests)
backend\.venv\Scripts\python.exe backend\test_attendance.py

# 2. Test Student & Teacher Management Role-Based Permissions
backend\.venv\Scripts\python.exe backend\test_management_permissions.py
```

Both tests verify backend HTTP status codes (`200`, `201`, `403 Forbidden`, `409 Conflict`), safe deactivation, and timetable-linked attendance.
