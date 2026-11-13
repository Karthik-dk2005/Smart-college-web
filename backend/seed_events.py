import datetime
from app.database import SessionLocal
from app.models import Event, EventRegistration, Announcement, Notification, User, Department, Student

db = SessionLocal()

try:
    admin_user = db.query(User).filter(User.role == "admin").first()
    hod_user = db.query(User).filter(User.role == "hod").first()
    teacher_user = db.query(User).filter(User.role == "teacher").first()
    student_user = db.query(User).filter(User.role == "student").first()
    cse_dept = db.query(Department).first()

    creator_id = admin_user.id if admin_user else 1
    dept_id = cse_dept.id if cse_dept else 1

    # Check if events already exist
    existing_events = db.query(Event).count()
    if existing_events == 0:
        events_data = [
            {
                "title": "Python & AI Workshop",
                "description": "Comprehensive hands-on workshop covering Python fundamentals, NumPy, Pandas, Scikit-Learn, and Deep Learning model building. Includes live coding sessions and certificate of completion.",
                "category": "Workshop",
                "event_date": datetime.date(2026, 10, 15),
                "start_time": "10:00 AM",
                "end_time": "01:00 PM",
                "venue": "Seminar Hall",
                "organizer": "Computer Science Department",
                "department_id": dept_id,
                "target_audience": "All Students",
                "registration_required": True,
                "registration_deadline": datetime.datetime(2026, 10, 14, 23, 59, 59),
                "max_participants": 80,
                "status": "Upcoming",
                "is_published": True,
                "image_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
                "created_by": creator_id,
            },
            {
                "title": "Annual Sports Meet 2026",
                "description": "Inter-departmental athletic competitions including 100m sprint, relay, long jump, volleyball, and badminton tournament. Refreshments and trophies for winners.",
                "category": "Sports",
                "event_date": datetime.date(2026, 10, 20),
                "start_time": "08:30 AM",
                "end_time": "05:00 PM",
                "venue": "Main Sports Ground",
                "organizer": "Physical Education Department",
                "department_id": None,
                "target_audience": "All Users",
                "registration_required": True,
                "registration_deadline": datetime.datetime(2026, 10, 18, 18, 0, 0),
                "max_participants": 250,
                "status": "Upcoming",
                "is_published": True,
                "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
                "created_by": creator_id,
            },
            {
                "title": "National Level Hackathon - CodeCraft 2026",
                "description": "24-hour sprint to solve real-world problems in Healthcare, FinTech, and Smart Agriculture. Exciting cash prizes, industry mentors, and internship opportunities for top teams.",
                "category": "Hackathon",
                "event_date": datetime.date(2026, 10, 24),
                "start_time": "09:00 AM",
                "end_time": "06:00 PM",
                "venue": "Advanced Computing Lab 3",
                "organizer": "CSE Department & Tech Club",
                "department_id": dept_id,
                "target_audience": "Students",
                "registration_required": True,
                "registration_deadline": datetime.datetime(2026, 10, 22, 23, 59),
                "max_participants": 120,
                "status": "Upcoming",
                "is_published": True,
                "image_url": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
                "created_by": creator_id,
            },
            {
                "title": "Technical Seminar on Cloud Architecture & DevOps",
                "description": "Guest lecture by Senior Solutions Architect at AWS on Cloud Native infrastructure, Kubernetes orchestration, and CI/CD pipelines.",
                "category": "Seminar",
                "event_date": datetime.date(2026, 10, 25),
                "start_time": "11:00 AM",
                "end_time": "01:30 PM",
                "venue": "Auditorium Block B",
                "organizer": "Department of Computer Science",
                "department_id": dept_id,
                "target_audience": "Students",
                "registration_required": True,
                "registration_deadline": datetime.datetime(2026, 10, 24, 18, 0),
                "max_participants": 150,
                "status": "Upcoming",
                "is_published": True,
                "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
                "created_by": creator_id,
            },
            {
                "title": "Faculty Academic Review & Curriculum Meeting",
                "description": "Quarterly review of syllabus completion, NBA accreditation benchmarks, and upcoming semester elective offerings.",
                "category": "Meeting",
                "event_date": datetime.date.today(),
                "start_time": "09:30 AM",
                "end_time": "06:00 PM",
                "venue": "Department Board Room",
                "organizer": "HOD CSE",
                "department_id": dept_id,
                "target_audience": "Teachers",
                "registration_required": False,
                "registration_deadline": None,
                "max_participants": 30,
                "status": "Ongoing",
                "is_published": True,
                "image_url": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
                "created_by": hod_user.id if hod_user else creator_id,
            },
        ]

        created_events = []
        for edata in events_data:
            ev = Event(**edata)
            db.add(ev)
            created_events.append(ev)
        db.commit()

        # Seed sample registrations for students and teachers
        students = db.query(Student).limit(5).all()
        for idx, student in enumerate(students):
            if student.user_id:
                # Register for first event
                reg = EventRegistration(
                    event_id=created_events[0].id,
                    user_id=student.user_id,
                    student_id=student.id,
                    registration_date=datetime.datetime.utcnow() - datetime.timedelta(days=2),
                    registration_status="Registered",
                    attendance_status="Present" if idx % 2 == 0 else "Not Marked",
                )
                db.add(reg)
                # Register for second event
                reg2 = EventRegistration(
                    event_id=created_events[1].id,
                    user_id=student.user_id,
                    student_id=student.id,
                    registration_date=datetime.datetime.utcnow() - datetime.timedelta(days=1),
                    registration_status="Registered",
                    attendance_status="Not Marked",
                )
                db.add(reg2)

        db.commit()
        print(f"Seeded {len(created_events)} events with registrations.")

    # Check Announcements
    existing_ann = db.query(Announcement).count()
    if existing_ann == 0:
        announcements_data = [
            {
                "title": "Internal Examination Schedule Updated",
                "content": "The revised timetable for the 1st Internal Assessment (IA-1) for Academic Year 2026–2027 has been finalized. Examinations begin from 15th October 2026. Hall tickets, room allocations, and seating layout are available on the student portal.",
                "category": "Examination",
                "priority": "Urgent",
                "target_audience": "All Students",
                "department_id": dept_id,
                "publish_date": datetime.date(2026, 10, 10),
                "created_by": creator_id,
                "status": "Active",
            },
            {
                "title": "Library Working Hours Extended During Exam Weeks",
                "content": "To accommodate student preparation for upcoming assessments, the Central Library will remain open until 10:00 PM on all weekdays and Saturdays with digital lab access and Wi-Fi enabled.",
                "category": "Academic",
                "priority": "Important",
                "target_audience": "All Users",
                "department_id": None,
                "publish_date": datetime.date(2026, 10, 8),
                "created_by": creator_id,
                "status": "Active",
            },
            {
                "title": "Hostel Fee Clearance & Dining Timing Notice",
                "content": "All residential students must verify their mess and hostel dues by 20th October 2026. New dining hall menus with dietary options are posted on the notice board.",
                "category": "Administration",
                "priority": "Normal",
                "target_audience": "Students",
                "department_id": None,
                "publish_date": datetime.date(2026, 10, 5),
                "created_by": creator_id,
                "status": "Active",
            },
        ]

        for adata in announcements_data:
            ann = Announcement(**adata)
            db.add(ann)
        db.commit()
        print(f"Seeded {len(announcements_data)} announcements.")

    # Check Notifications
    existing_notifs = db.query(Notification).count()
    if existing_notifs == 0:
        notifs = [
            Notification(
                user_id=None,
                title="New Event: Python & AI Workshop",
                message="Technical workshop on Python & AI scheduled for 15 October 2026 in Seminar Hall.",
                category="event",
                link="/events/1",
                read=False,
            ),
            Notification(
                user_id=None,
                title="New Announcement: Internal Examination Schedule",
                message="Revised examination schedule for odd semester released. Please check timetable.",
                category="announcement",
                link="/announcements",
                read=False,
            ),
        ]
        for n in notifs:
            db.add(n)
        db.commit()
        print("Seeded sample notifications.")

finally:
    db.close()
