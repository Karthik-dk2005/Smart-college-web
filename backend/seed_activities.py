import os
import uuid
import datetime
from app.database import SessionLocal, create_dev_tables
from app.models import (
    StudentActivity, StudentActivityFile, StudentActivityVerification,
    Student, User, Department
)

# Secure storage directory
SECURE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "secure_uploads", "activities"))
os.makedirs(SECURE_DIR, exist_ok=True)


def create_minimal_pdf(title: str, recipient: str, date_str: str) -> bytes:
    """Generate a clean, valid PDF byte string for certificate previews."""
    stream_content = (
        f"BT\n/F1 22 Tf\n80 700 Td\n(MIT THANDAVAPURA - CERTIFICATE OF MERIT) Tj\n"
        f"0 -40 Td\n/F1 14 Tf\n(Presented with pride to: {recipient}) Tj\n"
        f"0 -30 Td\n(Activity: {title}) Tj\n"
        f"0 -25 Td\n(Date: {date_str}) Tj\n"
        f"0 -25 Td\n(Status: Official Academic Record) Tj\nET"
    )
    stream_len = len(stream_content)
    pdf = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {stream_len} >>
stream
{stream_content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000400 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
460
%%EOF"""
    return pdf.encode("utf-8")


def get_sample_png() -> bytes:
    # 1x1 transparent PNG fallback if no file
    return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'


def seed_activities():
    create_dev_tables()
    db = SessionLocal()
    try:
        # Check if activities already exist
        if db.query(StudentActivity).count() > 0:
            print("[*] Student activities already present in database.")
            return

        student = db.query(Student).filter(Student.id == 1).first()
        if not student:
            student = db.query(Student).first()
        if not student:
            print("[-] No student found to seed activities for.")
            return

        admin = db.query(User).filter(User.role == "admin").first()
        hod = db.query(User).filter(User.role == "hod").first()

        print(f"[+] Seeding realistic student activities for {student.name} ({student.usn})...")

        activities_data = [
            {
                "title": "🏆 AI Hackathon 2026",
                "activity_type": "Competition",
                "level": "University",
                "position_award": "Winner",
                "activity_date": datetime.date(2026, 9, 15),
                "organizing_institution": "Visvesvaraya Technological University (VTU)",
                "department": "Computer Science and Engineering",
                "location": "VTU Belagavi Main Campus",
                "description": "Developed an AI-driven smart classroom resource scheduler using neural networks and real-time edge computing. Awarded 1st place among 64 participating university teams.",
                "remarks": "Gold medal and cash prize of Rs. 50,000 received.",
                "status": "VERIFIED",
                "verified_by": admin.id if admin else None,
                "verification_role": "admin",
                "file_name": "AI_Hackathon_2026_Certificate.pdf",
                "file_type": "application/pdf",
                "file_content": create_minimal_pdf("AI Hackathon 2026", student.name, "15 September 2026"),
            },
            {
                "title": "National Robotics & Edge Computing Championship",
                "activity_type": "Technical",
                "level": "National",
                "position_award": "Runner-up",
                "activity_date": datetime.date(2026, 8, 20),
                "organizing_institution": "IIT Madras Shaastra",
                "department": "Computer Science and Engineering",
                "location": "Chennai, Tamil Nadu",
                "description": "Engineered an autonomous campus delivery rover equipped with LiDAR obstacle detection and ROS2 communication protocols.",
                "remarks": "Silver trophy with national publication credit.",
                "status": "VERIFIED",
                "verified_by": hod.id if hod else None,
                "verification_role": "hod",
                "file_name": "Robotics_National_Certificate.png",
                "file_type": "image/png",
                "file_content": get_sample_png(),
            },
            {
                "title": "AWS Cloud Solutions Architect Workshop",
                "activity_type": "Workshop",
                "level": "College",
                "position_award": "Certified Architect",
                "activity_date": datetime.date(2026, 7, 12),
                "organizing_institution": "MIT Thandavapura & AWS Academy",
                "department": "Computer Science and Engineering",
                "location": "Seminar Hall A, MITT",
                "description": "Comprehensive 3-day hands-on workshop covering AWS serverless infrastructure, DynamoDB, API Gateway, and Docker orchestration.",
                "remarks": "Completed all 6 micro-projects with perfect assessment score.",
                "status": "VERIFIED",
                "verified_by": hod.id if hod else None,
                "verification_role": "hod",
                "file_name": "AWS_Workshop_Certificate.pdf",
                "file_type": "application/pdf",
                "file_content": create_minimal_pdf("AWS Cloud Solutions Architect Workshop", student.name, "12 July 2026"),
            },
            {
                "title": "Inter-College Basketball Championship 2026",
                "activity_type": "Sports",
                "level": "District",
                "position_award": "First Place",
                "activity_date": datetime.date(2026, 6, 18),
                "organizing_institution": "Mysuru District Sports Council",
                "department": "Physical Education & Sports",
                "location": "Chamundi Vihar Stadium, Mysuru",
                "description": "Captain of the MITT College Basketball team. Led team through 5 undefeated rounds to clinch the district championship trophy.",
                "remarks": "Awarded Most Valuable Player (MVP) of the tournament.",
                "status": "VERIFIED",
                "verified_by": hod.id if hod else None,
                "verification_role": "hod",
                "file_name": "Basketball_District_Trophy.pdf",
                "file_type": "application/pdf",
                "file_content": create_minimal_pdf("Inter-College Basketball Championship", student.name, "18 June 2026"),
            },
            {
                "title": "Enterprise Full-Stack Cloud Internship",
                "activity_type": "Internship",
                "level": "State",
                "position_award": "Excellence Certificate",
                "activity_date": datetime.date(2026, 5, 30),
                "organizing_institution": "Infosys Springboard",
                "department": "Computer Science and Engineering",
                "location": "Bengaluru (Hybrid)",
                "description": "8-week intensive industrial software engineering internship focusing on React, FastAPI, CI/CD pipelines, and microservices architecture.",
                "remarks": "Recommended for pre-placement interview round.",
                "status": "VERIFIED",
                "verified_by": hod.id if hod else None,
                "verification_role": "hod",
                "file_name": "Infosys_Internship_Certificate.pdf",
                "file_type": "application/pdf",
                "file_content": create_minimal_pdf("Full-Stack Cloud Internship", student.name, "30 May 2026"),
            },
            {
                "title": "Smart Campus IoT Energy Optimization System",
                "activity_type": "Project",
                "level": "Department",
                "position_award": "Best Department Project",
                "activity_date": datetime.date(2026, 9, 2),
                "organizing_institution": "MIT Thandavapura",
                "department": "Computer Science and Engineering",
                "location": "CS Department R&D Lab",
                "description": "Automated energy monitoring system utilizing ESP32 microcontrollers, current sensors, and MQTT streams to regulate smart lighting and air conditioning.",
                "remarks": "Pending review by Department Evaluation Committee.",
                "status": "PENDING",
                "verified_by": None,
                "verification_role": None,
                "file_name": "IoT_Project_Synopsis.pdf",
                "file_type": "application/pdf",
                "file_content": create_minimal_pdf("Smart Campus IoT Energy Optimization System", student.name, "02 September 2026"),
            },
            {
                "title": "State Classical Music & Performing Arts Fest",
                "activity_type": "Cultural",
                "level": "State",
                "position_award": "Second Place",
                "activity_date": datetime.date(2026, 4, 14),
                "organizing_institution": "Karnataka State Cultural Academy",
                "department": "Cultural Club",
                "location": "Kalamandira, Mysuru",
                "description": "Represented collegiate cultural troupe in Carnatic violin solo and classical fusion ensemble.",
                "remarks": "Certificate uploaded for co-curricular credit approval.",
                "status": "PENDING",
                "verified_by": None,
                "verification_role": None,
                "file_name": "State_Cultural_Fest_Evidence.pdf",
                "file_type": "application/pdf",
                "file_content": create_minimal_pdf("State Classical Music Fest", student.name, "14 April 2026"),
            },
            {
                "title": "International Cyber Security Symposium",
                "activity_type": "Seminar",
                "level": "International",
                "position_award": "Delegate",
                "activity_date": datetime.date(2026, 3, 10),
                "organizing_institution": "IEEE Computer Society Global",
                "department": "Computer Science and Engineering",
                "location": "Virtual / Hybrid (Singapore Hub)",
                "description": "Attended technical sessions on zero-trust network architectures, quantum-safe encryption, and offensive security methodologies.",
                "remarks": "Resubmitting once official institutional digital credential is regenerated.",
                "status": "REJECTED",
                "verified_by": hod.id if hod else None,
                "verification_role": "hod",
                "rejection_reason": "Certificate information is incomplete. Please upload the official certificate with the organizer's verified seal and signature.",
                "file_name": "Draft_Seminar_Attendance_Slip.pdf",
                "file_type": "application/pdf",
                "file_content": create_minimal_pdf("International Cyber Security Symposium", student.name, "10 March 2026"),
            },
        ]

        for item in activities_data:
            act = StudentActivity(
                student_id=student.id,
                title=item["title"],
                activity_type=item["activity_type"],
                description=item["description"],
                activity_date=item["activity_date"],
                organizing_institution=item["organizing_institution"],
                department=item["department"],
                level=item["level"],
                position_award=item["position_award"],
                location=item["location"],
                status=item["status"],
                remarks=item["remarks"],
            )
            db.add(act)
            db.commit()
            db.refresh(act)

            # Write physical sample file
            safe_fname = f"{uuid.uuid4().hex}_{item['file_name']}"
            phys_path = os.path.join(SECURE_DIR, safe_fname)
            with open(phys_path, "wb") as f_out:
                f_out.write(item["file_content"])

            act_file = StudentActivityFile(
                activity_id=act.id,
                file_name=item["file_name"],
                file_path=phys_path,
                file_type=item["file_type"],
                file_size=len(item["file_content"]),
            )
            db.add(act_file)
            db.commit()

            # Record verification history if verified or rejected
            if item["status"] in ("VERIFIED", "REJECTED"):
                ver = StudentActivityVerification(
                    activity_id=act.id,
                    verified_by=item.get("verified_by"),
                    verification_role=item.get("verification_role"),
                    status=item["status"],
                    rejection_reason=item.get("rejection_reason"),
                    verified_at=datetime.datetime.utcnow(),
                )
                db.add(ver)
                db.commit()

        print(f"[+] Successfully seeded {len(activities_data)} activities for {student.name}!")
    except Exception as e:
        db.rollback()
        print(f"[-] Error seeding activities: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_activities()
