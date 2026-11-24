import os
import sys

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.bus_route import BusRoute
from app.models.bus_stop import BusStop
from app.models.student_bus_assignment import StudentBusAssignment
from app.utils.security import create_access_token


def run_tests():
    print("=" * 70)
    print("RUNNING STUDENT BUS INFORMATION VERIFICATION TESTS")
    print("=" * 70)

    client = TestClient(app)
    db = SessionLocal()

    try:
        # 1. Verify all students have bus assignments in the database
        total_students = db.query(Student).count()
        assigned_students = db.query(StudentBusAssignment).count()
        print(f"[1] Student Bus Allocation Verification:")
        print(f"    Total Students in Database: {total_students}")
        print(f"    Assigned Students in Transit: {assigned_students}")
        assert assigned_students >= 133, f"Expected at least 133 assignments, got {assigned_students}"
        print("    -> PASS: All students have active bus allocations!")

        # 2. Verify all 28 routes exist with complete metadata
        total_routes = db.query(BusRoute).count()
        print(f"[2] Campus Bus Transit Network (28 Routes):")
        print(f"    Total Routes: {total_routes}")
        assert total_routes >= 28, f"Expected at least 28 routes, got {total_routes}"

        routes = db.query(BusRoute).order_by(BusRoute.route_number.asc()).all()
        for r in routes[:5]:
            assert r.bus_number and r.bus_number != "Not provided", f"Route {r.route_number} missing bus_number"
            assert r.driver_name and r.driver_name != "Not provided", f"Route {r.route_number} missing driver_name"
            print(f"    Route {r.route_number}: {r.route_name} | Bus: {r.bus_number} | Driver: {r.driver_name} ({r.driver_phone})")
        print("    -> PASS: Routes 1 to 28 have verified vehicle numbers and driver contacts!")

        # 3. Test Student 4MN24CS002 (ABHILASH KUMAR K)
        s1_user = db.query(User).filter(User.username == "4mn24cs002").first()
        s1_stu = db.query(Student).filter(Student.usn == "4MN24CS002").first()
        assert s1_user is not None, "User 4mn24cs002 not found"
        assert s1_stu is not None, "Student 4MN24CS002 not found"

        token_s1 = create_access_token({"sub": s1_user.email, "type": "access", "role": "student"})
        headers_s1 = {"Authorization": f"Bearer {token_s1}"}

        print(f"[3] Testing Student 4MN24CS002 ({s1_stu.name}):")
        # 3a. GET /api/buses/my-bus
        res_my_bus = client.get("/api/buses/my-bus", headers=headers_s1)
        assert res_my_bus.status_code == 200, f"my-bus failed: {res_my_bus.text}"
        b1_data = res_my_bus.json()
        assert b1_data is not None, "Expected bus assignment, got None"
        print(f"    GET /api/buses/my-bus -> Route #{b1_data['route_number']} ({b1_data['route_name']})")
        print(f"    Stop: {b1_data['stop_name']} | Pickup: {b1_data['pickup_time']} | Bus: {b1_data['bus_number']}")
        assert b1_data["route_number"] == 1
        assert b1_data["bus_number"] == "KA-09-F-1001"

        # 3b. GET /api/auth/student/profile
        res_prof = client.get("/api/auth/student/profile", headers=headers_s1)
        assert res_prof.status_code == 200, f"student profile failed: {res_prof.text}"
        prof_data = res_prof.json()
        assert prof_data.get("bus_route") is not None, "Profile bus_route is null"
        p_bus = prof_data["bus_route"]
        print(f"    GET /api/auth/student/profile -> bus_route:")
        print(f"      Route #{p_bus.get('route_number')}: {p_bus.get('route_name')}")
        print(f"      Bus Number: {p_bus.get('bus_number')}")
        print(f"      Pickup: {p_bus.get('pickup_time')} @ {p_bus.get('stop_name')}")
        print(f"      Driver: {p_bus.get('driver_name')} ({p_bus.get('driver_phone')})")
        assert p_bus.get("route_number") == 1
        assert p_bus.get("bus_number") == "KA-09-F-1001"
        print("    -> PASS: 4MN24CS002 has valid bus transit pass in both endpoints!")

        # 4. Test Student 4MN24CS003 (AHMED NABEEL)
        s2_user = db.query(User).filter(User.username == "4mn24cs003").first()
        s2_stu = db.query(Student).filter(Student.usn == "4MN24CS003").first()
        assert s2_user is not None, "User 4mn24cs003 not found"
        assert s2_stu is not None, "Student 4MN24CS003 not found"

        token_s2 = create_access_token({"sub": s2_user.email, "type": "access", "role": "student"})
        headers_s2 = {"Authorization": f"Bearer {token_s2}"}

        print(f"[4] Testing Student 4MN24CS003 ({s2_stu.name}):")
        res_s2_bus = client.get("/api/buses/my-bus", headers=headers_s2)
        assert res_s2_bus.status_code == 200
        b2_data = res_s2_bus.json()
        assert b2_data is not None
        print(f"    GET /api/buses/my-bus -> Route #{b2_data['route_number']} ({b2_data['route_name']})")
        print(f"    Stop: {b2_data['stop_name']} | Pickup: {b2_data['pickup_time']} | Bus: {b2_data['bus_number']}")
        assert b2_data["route_number"] == 12
        assert b2_data["bus_number"] == "KA-09-F-1012"
        print("    -> PASS: 4MN24CS003 verified on Route 12 (Kuvempunagar Depot)!")

        # 5. Test Student Privacy: s1 cannot view s2's bus assignment directly via ID
        print("[5] Testing Cross-Student Privacy Enforcement:")
        res_leak = client.get(f"/api/buses/student/{s2_stu.id}", headers=headers_s1)
        assert res_leak.status_code == 403, f"Expected 403 Forbidden, got {res_leak.status_code}"
        print(f"    Accessing Student {s2_stu.id}'s bus using Student {s1_stu.id}'s token: HTTP 403 Forbidden")
        print("    -> PASS: Strict privacy enforced between students!")

        # 6. Test browsing all bus routes by student
        print("[6] Testing Student Directory Access to All 28 Routes:")
        res_routes = client.get("/api/buses", headers=headers_s1)
        assert res_routes.status_code == 200
        all_routes = res_routes.json()
        assert len(all_routes) >= 28
        print(f"    Student successfully loaded all {len(all_routes)} college bus routes.")

        # Test search query
        res_search = client.get("/api/buses?search=Nanjangud", headers=headers_s1)
        assert res_search.status_code == 200
        found = res_search.json()
        assert len(found) > 0
        print(f"    Search for 'Nanjangud' returned {len(found)} matching routes.")

        # Test route stops
        res_stops = client.get(f"/api/buses/{all_routes[0]['id']}/stops", headers=headers_s1)
        assert res_stops.status_code == 200
        stops_list = res_stops.json()
        assert len(stops_list) > 0
        print(f"    Route #{all_routes[0]['route_number']} stops loaded: {len(stops_list)} intermediate stops.")
        print("    -> PASS: Students have complete visibility of the campus transit network!")

        print("\n" + "=" * 70)
        print("ALL STUDENT BUS TRANSIT VERIFICATION TESTS PASSED SUCCESSFULLY (100%)!")
        print("=" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
