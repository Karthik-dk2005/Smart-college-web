import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models.student import Student
from app.models.user import User
from app.models.mark import Mark
from app.services.marks_importer import import_5th_sem_marks

def execute_import():
    print("=" * 60)
    print("IMPORTING 5TH SEMESTER SECTION A & B STUDENTS FROM PDFS")
    print("=" * 60)

    db = SessionLocal()
    try:
        res = import_5th_sem_marks(db, force_reload=True)
        print("Import Result:", res)

        # Verification
        sec_a_count = db.query(Student).filter(Student.semester == 5, Student.section == "A").count()
        sec_b_count = db.query(Student).filter(Student.semester == 5, Student.section == "B").count()
        total_students = db.query(Student).filter(Student.semester == 5).count()
        total_users = db.query(User).filter(User.role == "student").count()
        total_marks = db.query(Mark).filter(Mark.semester == 5, Mark.ia_number == "IA-1").count()

        print(f"\n[VERIFICATION]")
        print(f" - Section A Students: {sec_a_count} (Expected: 66)")
        print(f" - Section B Students: {sec_b_count} (Expected: 65)")
        print(f" - Total Students:     {total_students} (Expected: 131)")
        print(f" - Student User Accounts: {total_users} (Expected: 131)")
        print(f" - IA-1 Marks Rows:    {total_marks} (Expected: 786 = 131 * 6)")

        assert sec_a_count == 66, f"Section A count mismatch: {sec_a_count} != 66"
        assert sec_b_count == 65, f"Section B count mismatch: {sec_b_count} != 65"
        assert total_students == 131, f"Total students mismatch: {total_students} != 131"
        assert total_marks == 786, f"Total marks mismatch: {total_marks} != 786"

        print("\nFirst 3 students in Section A:")
        for s in db.query(Student).filter(Student.section == "A").order_by(Student.usn.asc()).limit(3).all():
            print(f"  USN: {s.usn} | Name: {s.name} | Email: {s.email} | User ID: {s.user_id}")

        print("\nFirst 3 students in Section B:")
        for s in db.query(Student).filter(Student.section == "B").order_by(Student.usn.asc()).limit(3).all():
            print(f"  USN: {s.usn} | Name: {s.name} | Email: {s.email} | User ID: {s.user_id}")

        print("\n✓ 131 STUDENTS AND 786 MARKS SUCCESSFULLY IMPORTED AND VERIFIED!")

    finally:
        db.close()

if __name__ == "__main__":
    execute_import()

