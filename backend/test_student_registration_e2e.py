"""
End-to-End Student Registration Verification Script
Tests: check-usn -> register (OTP dispatch) -> verify-otp -> unified login -> student profile
Restores tested student cleanly back to Unregistered after verification.
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.student import Student
from app.models.user import User

client = TestClient(app)


def run_e2e():
    test_usn = "4MN25CS410"
    test_pw = "MittSecure@2026"
    print("=" * 65)
    print(f"TESTING END-TO-END STUDENT REGISTRATION FOR {test_usn}")
    print("=" * 65)

    try:
        # 1. Check USN
        r1 = client.post("/api/auth/student/check-usn", json={"usn": test_usn})
        assert r1.status_code == 200, f"check-usn failed: {r1.text}"
        d1 = r1.json()
        assert d1["name"] == "KARTHIKA D K"
        assert d1["gmail"] == "karthikdk1169@gmail.com"
        assert d1["can_register"] is True
        print(f"[PASS 1] check-usn: {d1['name']} | {d1['gmail']} | Sec {d1['section']}")

        # 2. Register & send OTP
        r2 = client.post(
            "/api/auth/student/register",
            json={"usn": test_usn, "password": test_pw, "confirm_password": test_pw},
        )
        assert r2.status_code == 200, f"register failed: {r2.text}"
        d2 = r2.json()
        assert d2["success"] is True
        otp = d2.get("demo_otp")
        if not otp:
            # Read OTP from DB if live SMTP was configured
            db = SessionLocal()
            st = db.query(Student).filter(Student.usn == test_usn).first()
            otp = st.otp_code
            db.close()
        assert otp and len(otp) == 6, f"Expected 6-digit OTP, got: {otp}"
        print(f"[PASS 2] register & OTP dispatch: simulation_mode={d2.get('simulation_mode')}, otp_len={len(otp)}")

        # 3. Verify OTP -> activates account & returns JWT
        r3 = client.post("/api/auth/student/verify-otp", json={"usn": test_usn, "otp": otp})
        assert r3.status_code == 200, f"verify-otp failed: {r3.text}"
        d3 = r3.json()
        assert d3["success"] is True
        assert d3.get("access_token")
        assert d3["user"]["usn"] == test_usn
        print(f"[PASS 3] verify-otp: Account activated! JWT issued for {d3['user']['name']}")

        # 4. Prevent duplicate registration
        r_dup = client.post(
            "/api/auth/student/register",
            json={"usn": test_usn, "password": test_pw, "confirm_password": test_pw},
        )
        assert r_dup.status_code == 400, f"Duplicate registration should be blocked: {r_dup.status_code}"
        print("[PASS 4] Duplicate registration cleanly blocked (400)")

        # 5. Unified Login with USN + Password
        r4 = client.post("/api/auth/login", json={"username_or_email": test_usn, "password": test_pw})
        assert r4.status_code == 200, f"Unified login failed: {r4.text}"
        d4 = r4.json()
        assert d4["role"] == "student"
        token = d4["access_token"]
        print(f"[PASS 5] Unified /api/auth/login succeeded for USN {test_usn}")

        # 6. Access Student Profile with JWT
        r5 = client.get("/api/auth/student/profile", headers={"Authorization": f"Bearer {token}"})
        assert r5.status_code == 200, f"profile fetch failed: {r5.text}"
        d5 = r5.json()
        assert d5["usn"] == test_usn
        assert d5["name"] == "KARTHIKA D K"
        print(f"[PASS 6] GET /api/auth/student/profile verified ({d5['name']}, Sem {d5['semester']} Sec {d5['section']})")

        print("\nALL 6 STUDENT REGISTRATION E2E CHECKS PASSED! (100% PASS)")

    finally:
        # Cleanly restore student back to Unregistered so real student can register fresh
        db = SessionLocal()
        try:
            st = db.query(Student).filter(Student.usn == test_usn).first()
            if st:
                uid = st.user_id
                st.user_id = None
                st.password_hash = None
                st.otp_code = None
                st.otp_expires_at = None
                st.registration_status = "Unregistered"
                st.email_verification_status = "Unverified"
                st.registered_at = None
                db.commit()
                if uid:
                    u = db.query(User).filter(User.id == uid).first()
                    if u and u.role == "student":
                        db.delete(u)
                        db.commit()
            print(f"[CLEANUP] Restored {test_usn} to clean Unregistered state.")
        finally:
            db.close()


if __name__ == "__main__":
    run_e2e()
