import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, Department, Student, Teacher, Attendance, Timetable
from app.utils.security import create_access_token

client = TestClient(app)

def test_permissions():
    db = SessionLocal()
    try:
        # Load or create a second department (e.g. ECE) for cross-department permission testing
        ece_dept = db.query(Department).filter(Department.code == "ECE").first()
        if not ece_dept:
            ece_dept = Department(name="Electronics and Communication Engineering", code="ECE", status="active")
            db.add(ece_dept)
            db.commit()
            db.refresh(ece_dept)

        # Users
        admin_user = db.query(User).filter(User.role == "admin").first()
        hod_user = db.query(User).filter(User.role == "hod").first()
        teacher_user = db.query(User).filter(User.role == "teacher").first()
        student_user = db.query(User).filter(User.role == "student").first()

        token_admin = create_access_token({"sub": admin_user.email, "role": "admin", "type": "access"})
        token_hod = create_access_token({"sub": hod_user.email, "role": "hod", "type": "access"})
        token_teacher = create_access_token({"sub": teacher_user.email, "role": "teacher", "type": "access"})
        token_student = create_access_token({"sub": student_user.email, "role": "student", "type": "access"})

        h_admin = {"Authorization": f"Bearer {token_admin}"}
        h_hod = {"Authorization": f"Bearer {token_hod}"}
        h_teacher = {"Authorization": f"Bearer {token_teacher}"}
        h_student = {"Authorization": f"Bearer {token_student}"}

        print("--- [1] TESTING TEACHER RESTRICTION (NO CRUD) ---")
        # Teacher trying to create student -> 403
        res = client.post("/api/students", json={"name": "Fake Student", "email": "fake.student@test.com", "usn": "FAKE001"}, headers=h_teacher)
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
        print("  -> Teacher blocked from creating student (403):", res.json()["detail"])

        # Teacher trying to list students -> 403
        res = client.get("/api/students", headers=h_teacher)
        assert res.status_code == 403
        print("  -> Teacher blocked from listing students (403)")

        # Teacher trying to create teacher -> 403
        res = client.post("/api/teachers", json={"name": "Fake Teacher", "employee_id": "FAKE_T1", "email": "fake.teacher@test.com"}, headers=h_teacher)
        assert res.status_code == 403
        print("  -> Teacher blocked from creating teacher (403)")

        # Teacher trying to list teachers -> 403
        res = client.get("/api/teachers", headers=h_teacher)
        assert res.status_code == 403
        print("  -> Teacher blocked from listing teachers (403)")

        print("--- [2] TESTING STUDENT RESTRICTION (NO CRUD) ---")
        res = client.post("/api/students", json={"name": "Fake Student 2", "email": "fake.student2@test.com", "usn": "FAKE002"}, headers=h_student)
        assert res.status_code == 403
        print("  -> Student blocked from creating student (403)")

        res = client.get("/api/teachers", headers=h_student)
        assert res.status_code == 403
        print("  -> Student blocked from listing teachers (403)")

        print("--- [3] TESTING HOD PERMISSIONS (OWN DEPARTMENT ONLY) ---")
        hod_dept_id = hod_user.department_id or 1

        # HOD can create student in own department
        new_cse_student_payload = {
            "name": "Naveen Gowda",
            "student_id": "4MT22CS099",
            "usn": "4MT22CS099",
            "email": "naveen.gowda@college.edu",
            "phone": "+91 99999 11111",
            "department_id": hod_dept_id,
            "semester": 5,
            "section": "A",
            "admission_year": 2024,
            "status": "active"
        }
        # Cleanup if exists
        db.query(Student).filter(Student.usn == "4MT22CS099").delete()
        db.query(User).filter(User.email == "naveen.gowda@college.edu").delete()
        db.commit()

        res = client.post("/api/students", json=new_cse_student_payload, headers=h_hod)
        assert res.status_code == 201, f"Failed: {res.text}"
        created_student = res.json()["data"]
        print(f"  -> HOD created student in own dept: {created_student['name']} ({created_student['student_id']})")

        # HOD trying to create student in DIFFERENT department (ECE) -> 403
        ece_student_payload = {
            "name": "ECE Student",
            "student_id": "4MT22EC001",
            "usn": "4MT22EC001",
            "email": "ece.student@college.edu",
            "department_id": ece_dept.id,
            "semester": 5,
            "section": "A",
        }
        res = client.post("/api/students", json=ece_student_payload, headers=h_hod)
        assert res.status_code == 403, f"Expected 403 for HOD creating student in ECE, got {res.status_code}: {res.text}"
        print(f"  -> HOD correctly blocked from creating student in another department (403): {res.json()['detail']}")

        # HOD can create teacher in own department
        new_cse_teacher_payload = {
            "name": "Dr. Pradeep Rao",
            "employee_id": "FAC-CSE-099",
            "email": "pradeep.rao@faculty.campus.edu",
            "phone": "+91 98765 99999",
            "department_id": hod_dept_id,
            "designation": "Associate Professor",
            "status": "active"
        }
        # Cleanup if exists
        db.query(Teacher).filter(Teacher.employee_id == "FAC-CSE-099").delete()
        db.query(User).filter(User.email == "pradeep.rao@faculty.campus.edu").delete()
        db.commit()

        res = client.post("/api/teachers", json=new_cse_teacher_payload, headers=h_hod)
        assert res.status_code == 201, f"Failed: {res.text}"
        created_teacher = res.json()
        print(f"  -> HOD created teacher in own dept: {created_teacher['name']} ({created_teacher['employee_id']})")

        # HOD trying to create teacher in DIFFERENT department (ECE) -> 403
        ece_teacher_payload = {
            "name": "ECE Teacher",
            "employee_id": "FAC-ECE-001",
            "email": "ece.teacher@faculty.campus.edu",
            "department_id": ece_dept.id,
            "designation": "Professor"
        }
        res = client.post("/api/teachers", json=ece_teacher_payload, headers=h_hod)
        assert res.status_code == 403
        print("  -> HOD correctly blocked from creating teacher in another department (403)")

        print("--- [4] TESTING ADMIN FULL MANAGEMENT ---")
        # Admin can create in ECE
        db.query(Teacher).filter(Teacher.employee_id == "FAC-ECE-001").delete()
        db.query(User).filter(User.email == "ece.teacher@faculty.campus.edu").delete()
        db.commit()

        res = client.post("/api/teachers", json=ece_teacher_payload, headers=h_admin)
        assert res.status_code == 201, f"Admin failed to create in ECE: {res.text}"
        ece_teacher = res.json()
        print(f"  -> Admin successfully created teacher in ECE: {ece_teacher['name']}")

        # Admin can list all teachers across departments
        res = client.get("/api/teachers", headers=h_admin)
        assert res.status_code == 200
        all_teachers = res.json()
        print(f"  -> Admin listed {len(all_teachers)} teachers across all departments")

        print("--- [5] TESTING SAFE DEACTIVATION ON REMOVAL ---")
        # Aarav Sharma has historical attendance records.
        # Deleting Aarav Sharma should DEACTIVATE, not delete historical records!
        aarav_student = db.query(Student).filter(Student.usn == "4MT22CS001").first()
        res = client.delete(f"/api/students/{aarav_student.id}", headers=h_admin)
        assert res.status_code == 200
        del_data = res.json()["data"]
        print(f"  -> Student removal result: action={del_data.get('action')}, status={del_data.get('status')}")
        assert del_data.get("action") == "deactivated"
        print("  -> Verified: Student with attendance history was safely deactivated, preserving records!")

        # Prof. Ananya has timetable and attendance records.
        # Deleting Prof. Ananya should DEACTIVATE, not delete historical records!
        ananya_teacher = db.query(Teacher).filter(Teacher.employee_id == "FAC-CSE-001").first()
        res = client.delete(f"/api/teachers/{ananya_teacher.id}", headers=h_admin)
        assert res.status_code == 200
        del_t_data = res.json()["data"]
        print(f"  -> Teacher removal result: action={del_t_data.get('action')}, status={del_t_data.get('status')}")
        assert del_t_data.get("action") == "deactivated"
        print("  -> Verified: Teacher with timetable/attendance history was safely deactivated!")

        # Fresh student (Naveen Gowda has no attendance yet)
        res = client.delete(f"/api/students/{created_student['id']}", headers=h_admin)
        assert res.status_code == 200
        clean_del = res.json()["data"]
        print(f"  -> Fresh student removal: action={clean_del.get('action')}")
        assert clean_del.get("action") == "deleted"

        # Restore test accounts to active for other test suites
        aarav_student.status = "active"
        aarav_u = db.query(User).filter(User.email == "aarav.sharma@campus.edu").first()
        if aarav_u:
            aarav_u.is_active = True
        ananya_teacher.status = "active"
        ananya_u = db.query(User).filter(User.email == "ananya.iyer@faculty.campus.edu").first()
        if ananya_u:
            ananya_u.is_active = True
        db.commit()

        print("\nALL STUDENT & TEACHER MANAGEMENT PERMISSION TESTS PASSED!")

    finally:
        db.close()

if __name__ == "__main__":
    test_permissions()
