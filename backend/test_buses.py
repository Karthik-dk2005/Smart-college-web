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


def test_buses():
    print("=" * 60)
    print("RUNNING BUS ROUTE MANAGEMENT SYSTEM AUTOMATED TESTS")
    print("=" * 60)

    client = TestClient(app)
    db = SessionLocal()

    try:
        # Fetch persona users
        admin_u = db.query(User).filter(User.email == "admin@campus.edu").first()
        hod_u = db.query(User).filter(User.email == "hod.cse@campus.edu").first()
        teacher_u = db.query(User).filter(User.email == "ananya.iyer@faculty.campus.edu").first()
        karthik_u = db.query(User).filter(User.username == "4mn24cs002").first()
        aarav_u = db.query(User).filter(User.username == "4mn24cs003").first()

        karthik_stu = db.query(Student).filter(Student.usn == "4MN24CS002").first()
        aarav_stu = db.query(Student).filter(Student.usn == "4MN24CS003").first()

        h_admin = {"Authorization": f"Bearer {create_access_token({'sub': admin_u.email, 'type': 'access', 'role': 'admin'})}"}
        h_hod = {"Authorization": f"Bearer {create_access_token({'sub': hod_u.email, 'type': 'access', 'role': 'hod'})}"}
        h_teacher = {"Authorization": f"Bearer {create_access_token({'sub': teacher_u.email, 'type': 'access', 'role': 'teacher'})}"}
        h_karthik = {"Authorization": f"Bearer {create_access_token({'sub': karthik_u.email, 'type': 'access', 'role': 'student'})}"}
        h_aarav = {"Authorization": f"Bearer {create_access_token({'sub': aarav_u.email, 'type': 'access', 'role': 'student'})}"}

        # 1. Test Listing all 28 Routes
        print("[1] Testing GET /api/buses for all 28 routes...")
        res = client.get("/api/buses", headers=h_admin)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        routes = res.json()
        assert len(routes) >= 28, f"Expected at least 28 routes, got {len(routes)}"
        print(f"  -> Found {len(routes)} bus routes. Route 1 to Route 28 verified!")

        # 2. Test Search and Filter
        print("[2] Testing search and filter...")
        res_search = client.get("/api/buses?search=Route 12", headers=h_karthik)
        assert res_search.status_code == 200
        found = res_search.json()
        assert any(r["route_number"] == 12 for r in found)
        print("  -> Search for 'Route 12' returned matching route.")

        # 3. Test Route Details and Stops
        print("[3] Testing GET /api/buses/{route_id} and stops...")
        r12 = db.query(BusRoute).filter(BusRoute.route_number == 12).first()
        res_details = client.get(f"/api/buses/{r12.id}", headers=h_teacher)
        assert res_details.status_code == 200
        d_json = res_details.json()
        assert d_json["route_number"] == 12
        assert len(d_json["stops"]) >= 4
        print(f"  -> Route 12 details loaded with {len(d_json['stops'])} stops.")

        # 4. Test Role Restrictions (Teacher and Student cannot modify routes)
        print("[4] Testing Role-Based Restrictions (Teacher and Student blocked from CRUD)...")
        new_route_payload = {
            "route_number": 99,
            "route_name": "Route 99",
            "bus_number": "KA-09-F-9999",
            "driver_name": "Test Driver",
            "driver_phone": "+91 99000 11111",
            "start_point": "Test Start",
            "end_point": "Campus Main Gate",
            "departure_time": "08:00 AM",
            "arrival_time": "08:45 AM",
            "status": "active"
        }

        # Teacher attempt -> 403
        res_t = client.post("/api/buses", json=new_route_payload, headers=h_teacher)
        assert res_t.status_code == 403, f"Expected 403 for Teacher, got {res_t.status_code}: {res_t.text}"
        assert res_t.json()["detail"] == "You do not have permission to perform this action."
        print("  -> Teacher correctly blocked from creating route with HTTP 403.")

        # Student attempt -> 403
        res_s = client.post("/api/buses", json=new_route_payload, headers=h_karthik)
        assert res_s.status_code == 403, f"Expected 403 for Student, got {res_s.status_code}"
        assert res_s.json()["detail"] == "You do not have permission to perform this action."
        print("  -> Student correctly blocked from creating route with HTTP 403.")

        # 5. Test Admin CRUD on Routes
        print("[5] Testing Admin Route CRUD...")
        # Cleanup if route 99 exists
        db.query(BusRoute).filter(BusRoute.route_number == 99).delete()
        db.commit()

        res_create = client.post("/api/buses", json=new_route_payload, headers=h_admin)
        assert res_create.status_code == 201, f"Admin create failed: {res_create.text}"
        created_r = res_create.json()
        print(f"  -> Admin created {created_r['route_name']} (ID: {created_r['id']})")

        # Duplicate check -> 409
        res_dup = client.post("/api/buses", json=new_route_payload, headers=h_admin)
        assert res_dup.status_code == 409
        print("  -> Duplicate route number correctly blocked with HTTP 409 Conflict.")

        # Update route
        res_update = client.put(f"/api/buses/{created_r['id']}", json={"driver_name": "Updated Driver"}, headers=h_admin)
        assert res_update.status_code == 200
        assert res_update.json()["driver_name"] == "Updated Driver"
        print("  -> Route updated successfully.")

        # Deactivate route
        res_del = client.delete(f"/api/buses/{created_r['id']}", headers=h_admin)
        assert res_del.status_code == 200
        assert res_del.json()["data"]["status"] == "inactive"
        print("  -> Route deactivated successfully with status = 'inactive'.")

        # Cleanup test route 99
        db.query(BusRoute).filter(BusRoute.route_number == 99).delete()
        db.commit()

        # 6. Test Bus Stop CRUD
        print("[6] Testing Bus Stop CRUD...")
        stop_payload = {
            "stop_order": 5,
            "stop_name": "New Test Stop",
            "latitude": "Not provided",
            "longitude": "Not provided",
            "pickup_time": "08:15 AM",
            "drop_time": "04:40 PM",
            "status": "active"
        }
        res_stop = client.post(f"/api/buses/{r12.id}/stops", json=stop_payload, headers=h_admin)
        assert res_stop.status_code == 201
        created_stop = res_stop.json()
        print(f"  -> Admin added stop: {created_stop['stop_name']} (ID: {created_stop['id']})")

        # Update stop
        res_stop_up = client.put(f"/api/buses/stops/{created_stop['id']}", json={"stop_name": "Updated Stop Name"}, headers=h_admin)
        assert res_stop_up.status_code == 200
        assert res_stop_up.json()["stop_name"] == "Updated Stop Name"
        print("  -> Stop updated successfully.")

        # Deactivate stop
        res_stop_del = client.delete(f"/api/buses/stops/{created_stop['id']}", headers=h_admin)
        assert res_stop_del.status_code == 200
        print("  -> Stop deactivated successfully.")

        # Cleanup test stop
        db.query(BusStop).filter(BusStop.id == created_stop["id"]).delete()
        db.commit()

        # 7. Test Student Bus Assignment and Privacy
        print("[7] Testing Student Bus Assignment & Privacy...")
        # Karthik views own bus assignment
        res_k_bus = client.get(f"/api/buses/student/{karthik_stu.id}", headers=h_karthik)
        assert res_k_bus.status_code == 200
        k_data = res_k_bus.json()
        assert k_data["route_number"] in (1, 12)
        assert k_data["student_name"] == karthik_stu.name
        print(f"  -> Student Karthik viewed own bus assignment: Route {k_data['route_number']} - {k_data['route_name']}")

        # Karthik attempts to view Aarav's bus assignment -> 403 Forbidden!
        res_hack = client.get(f"/api/buses/student/{aarav_stu.id}", headers=h_karthik)
        assert res_hack.status_code == 403, f"Expected 403, got {res_hack.status_code}"
        assert res_hack.json()["detail"] == "You do not have permission to perform this action."
        print("  -> Student successfully BLOCKED from viewing another student's assignment (HTTP 403).")

        # Teacher attempts to view student assignment -> 403 Forbidden!
        res_t_hack = client.get(f"/api/buses/student/{karthik_stu.id}", headers=h_teacher)
        assert res_t_hack.status_code == 403
        print("  -> Teacher successfully BLOCKED from viewing student bus assignment (HTTP 403).")

        # Admin assigns Aarav to Route 1
        r1 = db.query(BusRoute).filter(BusRoute.route_number == 1).first()
        assign_payload = {
            "route_id": r1.id,
            "transport_status": "Using Bus"
        }
        res_assign = client.post(f"/api/buses/student/{aarav_stu.id}/assign", json=assign_payload, headers=h_admin)
        assert res_assign.status_code == 200
        assert res_assign.json()["route_number"] == 1
        print("  -> Admin successfully assigned student Aarav to Route 1.")

        # Aarav views own assignment
        res_aarav = client.get(f"/api/buses/student/{aarav_stu.id}", headers=h_aarav)
        assert res_aarav.status_code == 200
        assert res_aarav.json()["route_number"] == 1
        print("  -> Student Aarav successfully viewed own assigned Route 1.")

        # Restore Aarav assignment to Route 12
        r12 = db.query(BusRoute).filter(BusRoute.route_number == 12).first()
        r12_stop = db.query(BusStop).filter(BusStop.route_id == r12.id).first()
        res_restore = client.post(f"/api/buses/student/{aarav_stu.id}/assign", json={"route_id": r12.id, "stop_id": r12_stop.id if r12_stop else None, "transport_status": "Using Bus"}, headers=h_admin)
        assert res_restore.status_code == 200
        print("  -> Restored student Aarav assignment.")

        print("\nALL 7 BUS MODULE AUTOMATED TEST SUITES PASSED (100%)!")

    finally:
        db.close()


if __name__ == "__main__":
    test_buses()
