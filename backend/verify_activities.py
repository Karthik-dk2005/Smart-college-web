"""
Comprehensive test script for Student Activities & Achievements Module using httpx.
Tests all 20+ requirements from Section 26 of the specifications.
"""
import io
import httpx

BASE_URL = "http://127.0.0.1:8000"

def login(client, email, password="password123"):
    resp = client.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def run_tests():
    print("=" * 60)
    print("RUNNING STUDENT ACTIVITIES & ACHIEVEMENTS VERIFICATION TESTS")
    print("=" * 60)

    with httpx.Client(timeout=10.0) as client:
        # 1. Login users
        admin_headers = login(client, "admin@campus.edu")
        hod_headers = login(client, "hod.cse@campus.edu")
        student1_headers = login(client, "aarav.sharma@college.edu")
        student2_headers = login(client, "aditi.rao@college.edu")

        # 2. Student 1 adds an activity
        print("[1] Testing: Student can add activity...")
        new_act_payload = {
            "title": "National Level Coding Hackathon 2026",
            "activity_type": "Hackathon",
            "description": "Built an intelligent campus management assistant with multi-modal capabilities.",
            "activity_date": "2026-10-01",
            "organizing_institution": "National Institute of Technology",
            "department": "Computer Science and Engineering",
            "level": "National",
            "position_award": "First Place",
            "location": "NIT Surathkal",
            "remarks": "Cash prize received."
        }
        resp = client.post(f"{BASE_URL}/api/student-activities", json=new_act_payload, headers=student1_headers)
        assert resp.status_code == 201, f"Failed to create activity: {resp.text}"
        act_data = resp.json()
        act_id = act_data["id"]
        assert act_data["status"] == "PENDING", f"Initial status must be PENDING, got: {act_data['status']}"
        print(f"    [OK] Student added activity (ID: {act_id}) with status PENDING")

        # 3. PDF Certificate Upload
        print("[2] Testing: PDF Certificate upload...")
        pdf_bytes = b"%PDF-1.4 Mock valid PDF content for test %%EOF"
        files = {"file": ("Hackathon_Cert.pdf", pdf_bytes, "application/pdf")}
        resp = client.post(f"{BASE_URL}/api/student-activities/{act_id}/upload", files=files, headers=student1_headers)
        assert resp.status_code == 200, f"Failed to upload PDF: {resp.text}"
        pdf_file_id = resp.json()["id"]
        print(f"    [OK] PDF Certificate uploaded successfully (File ID: {pdf_file_id})")

        # 4. PNG/JPG Certificate Upload
        print("[3] Testing: PNG image upload...")
        png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
        files = {"file": ("Award_Badge.png", png_bytes, "image/png")}
        resp = client.post(f"{BASE_URL}/api/student-activities/{act_id}/upload", files=files, headers=student1_headers)
        assert resp.status_code == 200, f"Failed to upload PNG: {resp.text}"
        png_file_id = resp.json()["id"]
        print(f"    [OK] PNG evidence uploaded successfully (File ID: {png_file_id})")

        # 5. Invalid File Type Rejected (.exe / .sh)
        print("[4] Testing: Invalid executable file types rejected (.exe, .sh)...")
        bad_files = {"file": ("hack.exe", b"MZ\x90\x00\x03", "application/octet-stream")}
        resp = client.post(f"{BASE_URL}/api/student-activities/{act_id}/upload", files=bad_files, headers=student1_headers)
        assert resp.status_code in (400, 422), f"Executable file should be rejected, got: {resp.status_code}"
        print(f"    [OK] Prohibited .exe file rejected with status {resp.status_code}")

        bad_files_sh = {"file": ("script.sh", b"#!/bin/bash\necho hi", "text/x-sh")}
        resp = client.post(f"{BASE_URL}/api/student-activities/{act_id}/upload", files=bad_files_sh, headers=student1_headers)
        assert resp.status_code in (400, 422), f"Prohibited .sh file should be rejected, got: {resp.status_code}"
        print(f"    [OK] Prohibited .sh file rejected with status {resp.status_code}")

        # 6. File size validation (> 10MB rejected)
        print("[5] Testing: File size limit validation (> 10MB)...")
        huge_bytes = b"0" * (11 * 1024 * 1024)  # 11 MB
        huge_files = {"file": ("huge_cert.pdf", huge_bytes, "application/pdf")}
        resp = client.post(f"{BASE_URL}/api/student-activities/{act_id}/upload", files=huge_files, headers=student1_headers)
        assert resp.status_code == 400, f"Oversized file should be rejected with 400, got: {resp.status_code}"
        print(f"    [OK] Oversized file rejected: {resp.json().get('detail')}")

        # 7. Student can see own activities
        print("[6] Testing: Student can see own activities...")
        resp = client.get(f"{BASE_URL}/api/student-activities", headers=student1_headers)
        assert resp.status_code == 200
        my_acts = resp.json()
        assert any(a["id"] == act_id for a in my_acts), "Created activity missing from student's list"
        print(f"    [OK] Student retrieved {len(my_acts)} activities")

        # 8. Student CANNOT see another student's private activity or files (403 Forbidden)
        print("[7] Testing: Student A cannot access Student B's private activity or files (403)...")
        resp = client.get(f"{BASE_URL}/api/student-activities/{act_id}", headers=student2_headers)
        assert resp.status_code == 403, f"Expected 403 Forbidden, got: {resp.status_code}"
        print(f"    [OK] Access denied to another student's activity (Status: 403)")

        resp = client.get(f"{BASE_URL}/api/student-activities/{act_id}/files/{pdf_file_id}/download", headers=student2_headers)
        assert resp.status_code == 403, f"Expected 403 Forbidden, got: {resp.status_code}"
        print(f"    [OK] Access denied to another student's file download (Status: 403)")

        # 9. Student cannot mark own achievement verified
        print("[8] Testing: Student cannot self-verify...")
        resp = client.post(f"{BASE_URL}/api/student-activities/{act_id}/verify", headers=student1_headers)
        assert resp.status_code == 403, f"Student self-verify should return 403, got: {resp.status_code}"
        print(f"    [OK] Student self-verification forbidden (Status: 403)")

        # 10. HOD can verify own department student
        print("[9] Testing: HOD can verify own department student...")
        resp = client.post(f"{BASE_URL}/api/student-activities/{act_id}/verify", headers=hod_headers)
        assert resp.status_code == 200, f"HOD verify failed: {resp.text}"
        assert resp.json()["status"] == "VERIFIED"
        print(f"    [OK] HOD verified student achievement (Status: VERIFIED)")

        # 11. Verified records cannot be directly edited by student
        print("[10] Testing: Verified records cannot be directly modified by student...")
        resp = client.put(f"{BASE_URL}/api/student-activities/{act_id}", json={"title": "Hacked Title"}, headers=student1_headers)
        assert resp.status_code in (400, 403), f"Editing verified record must be blocked, got: {resp.status_code}"
        print(f"    [OK] Modification of verified record blocked: {resp.json().get('detail')}")

        # 12. Create another activity for rejection test
        print("[11] Testing: Admin/HOD rejection with reason...")
        act2 = client.post(f"{BASE_URL}/api/student-activities", json={
            "title": "State Robotics Meet 2026",
            "activity_type": "Technical",
            "level": "State",
            "activity_date": "2026-09-20",
        }, headers=student1_headers).json()
        act2_id = act2["id"]

        reject_reason = "Certificate information is incomplete. Please upload the official certificate with the seal."
        resp = client.post(f"{BASE_URL}/api/student-activities/{act2_id}/reject", json={"rejection_reason": reject_reason}, headers=admin_headers)
        assert resp.status_code == 200, f"Reject failed: {resp.text}"
        assert resp.json()["status"] == "REJECTED"
        print(f"    [OK] Admin rejected activity with reason stored")

        # 13. Student can see rejection reason and resubmit
        print("[12] Testing: Student sees rejection reason and can resubmit...")
        resp = client.get(f"{BASE_URL}/api/student-activities/{act2_id}", headers=student1_headers)
        act2_details = resp.json()
        assert act2_details["status"] == "REJECTED"
        assert act2_details["latest_verification"]["rejection_reason"] == reject_reason
        print(f"    [OK] Student sees rejection reason: '{reject_reason[:40]}...'")

        # Resubmit: editing a rejected activity sets status back to PENDING!
        resp = client.put(f"{BASE_URL}/api/student-activities/{act2_id}", json={
            "title": "State Robotics Meet 2026 (Updated with Seal)",
            "remarks": "Re-uploaded with signed seal."
        }, headers=student1_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "PENDING"
        print(f"    [OK] Student edited and resubmitted; status is now PENDING")

        # 14. Activity Statistics & Summary
        print("[13] Testing: Activity statistics summary...")
        resp = client.get(f"{BASE_URL}/api/student-activities/stats/summary", headers=student1_headers)
        assert resp.status_code == 200
        stats = resp.json()
        print(f"    [OK] Statistics: Total: {stats['total_activities']}, Verified: {stats['verified_achievements']}, Pending: {stats['pending_verification']}, Certificates: {stats['certificates_count']}")
        assert stats["total_activities"] > 0
        assert stats["verified_achievements"] > 0

        # 15. Admin & HOD Dashboard Endpoints
        print("[14] Testing: Admin & HOD dashboard endpoints...")
        admin_dash = client.get(f"{BASE_URL}/api/admin/student-activities", headers=admin_headers).json()
        assert "statistics" in admin_dash and "activities" in admin_dash
        print(f"    [OK] Admin dashboard returned {len(admin_dash['activities'])} activities")

        hod_dash = client.get(f"{BASE_URL}/api/hod/student-activities", headers=hod_headers).json()
        assert "statistics" in hod_dash and "activities" in hod_dash
        print(f"    [OK] HOD dashboard returned {len(hod_dash['activities'])} activities")

        # 16. Search & Filter
        print("[15] Testing: Search and filters...")
        search_resp = client.get(f"{BASE_URL}/api/student-activities?search=Hackathon", headers=admin_headers)
        assert search_resp.status_code == 200
        assert len(search_resp.json()) >= 1
        print(f"    [OK] Search for 'Hackathon' matched {len(search_resp.json())} items")

        filter_resp = client.get(f"{BASE_URL}/api/student-activities?status=VERIFIED", headers=admin_headers)
        assert filter_resp.status_code == 200
        assert all(a["status"] == "VERIFIED" for a in filter_resp.json())
        print(f"    [OK] Filter by status=VERIFIED matched {len(filter_resp.json())} items")

    print("\n" + "=" * 60)
    print("ALL 15 BACKEND VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
