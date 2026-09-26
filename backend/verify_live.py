import json
import urllib.request
import urllib.error

BASE = "http://localhost:8000"

def request_json(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8")), response.status
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body), e.code
        except Exception:
            return {"error": err_body}, e.code

def test_live_system():
    print("========================================")
    print("SMART DEPARTMENT LIVE SYSTEM VERIFICATION")
    print("========================================")

    # 1. Health check
    h, status = request_json(f"{BASE}/health")
    print(f"[*] Health Check (HTTP {status}): {h}")
    assert status == 200

    # 2. Login
    res, status = request_json(
        f"{BASE}/api/auth/login",
        method="POST",
        data={"email": "admin@campus.edu", "password": "password123"}
    )
    assert status == 200, f"Login failed: {res}"
    token = res.get("access_token") or res.get("data", {}).get("access_token")
    user_name = res.get("name") or res.get("data", {}).get("name")
    user_role = res.get("role") or res.get("data", {}).get("role")
    print(f"[*] Auth Login: SUCCESS! Logged in as: {user_name} ({user_role})")
    print(f"[*] JWT Token: {token[:25]}...")

    # 3. Dashboard stats
    stats, _ = request_json(f"{BASE}/api/dashboard/stats", token=token)
    s_data = stats["data"]
    metrics = s_data["metrics"]
    print(f"[*] Dashboard Stats: Total Students={metrics['total_students']}, Faculty={metrics['total_faculty']}, Subjects={metrics['total_subjects']}, Today's Classes={metrics['today_classes']}")

    # 4. Students
    stu_res, _ = request_json(f"{BASE}/api/students", token=token)
    students = stu_res["data"]
    print(f"[*] Students API: {len(students)} students loaded from DB.")
    for s in students[:2]:
        print(f"    - USN: {s['usn']} | Name: {s['name']} | Sem: {s['semester']}{s['section']}")

    # 5. Faculty
    fac_res, _ = request_json(f"{BASE}/api/faculty", token=token)
    faculty = fac_res["data"]
    print(f"[*] Faculty API: {len(faculty)} faculty members loaded.")
    for f in faculty[:2]:
        print(f"    - ID: {f['employee_id']} | Name: {f['name']} | Designation: {f['designation']}")

    # 6. Timetable Section A (Room CS-303)
    tt_a_res, _ = request_json(f"{BASE}/api/timetable?semester=5&section=A", token=token)
    tt_a = tt_a_res["data"]
    print(f"[*] Timetable Section 5A (CS-303): {len(tt_a)} slots loaded.")
    slot1 = tt_a[0]
    sub1 = slot1.get("subject", {}).get("subject_code") or slot1.get("subject_id")
    print(f"    - Sample: {slot1['day']} {slot1['start_time']}-{slot1['end_time']} -> Subject: {sub1} (Room {slot1['room_number']})")

    # 7. Timetable Section B (Room CS-304)
    tt_b_res, _ = request_json(f"{BASE}/api/timetable?semester=5&section=B", token=token)
    tt_b = tt_b_res["data"]
    print(f"[*] Timetable Section 5B (CS-304): {len(tt_b)} slots loaded.")
    slot2 = tt_b[0]
    sub2 = slot2.get("subject", {}).get("subject_code") or slot2.get("subject_id")
    print(f"    - Sample: {slot2['day']} {slot2['start_time']}-{slot2['end_time']} -> Subject: {sub2} (Room {slot2['room_number']})")

    # 8. Geofence verification
    # Inside: 12.183700, 76.694200
    loc_in_res, _ = request_json(f"{BASE}/api/location/update", method="POST", data={
        "latitude": 12.183700,
        "longitude": 76.694200,
        "accuracy": 4.5,
        "location_type": "device"
    }, token=token)
    loc_in = loc_in_res["data"]
    print(f"[*] Geofence Check (Campus Center): in_geofence={loc_in['in_geofence']}, distance={loc_in['distance_meters']}m")
    assert loc_in["in_geofence"] is True, "Should be inside geofence"

    # Outside: 12.195000, 76.710000 (~2km away)
    loc_out_res, _ = request_json(f"{BASE}/api/location/update", method="POST", data={
        "latitude": 12.195000,
        "longitude": 76.710000,
        "accuracy": 10.0,
        "location_type": "device"
    }, token=token)
    loc_out = loc_out_res["data"]
    print(f"[*] Geofence Check (Off Campus): in_geofence={loc_out['in_geofence']}, distance={round(loc_out['distance_meters'])}m")
    assert loc_out["in_geofence"] is False, "Should be outside geofence"

    # 9. Notices
    notices_res, _ = request_json(f"{BASE}/api/notices", token=token)
    notices = notices_res["data"]
    print(f"[*] Notices API: {len(notices)} announcements retrieved. First: \"{notices[0]['title']}\"")

    # 10. Attendance percentage calculation
    stu_id = students[0]["id"]
    att_stats_res, _ = request_json(f"{BASE}/api/attendance/percentage/{stu_id}", token=token)
    att_stats = att_stats_res["data"]
    print(f"[*] Attendance Stats (Student {students[0]['usn']}): Percentage={att_stats.get('percentage', 100)}%, Present={att_stats.get('present_classes', 0)}/{att_stats.get('total_classes', 0)}")

    print("\n>>> ALL SYSTEM VERIFICATIONS PASSED 100% SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_live_system()
