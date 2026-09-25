import React from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Shield, Building, Award, Calendar } from "lucide-react";

export default function ProfileView() {
  const { user, role } = useAuth();
  const student = user?.student || {};
  const teacher = user?.teacher || {};

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Academic Profile & Identity
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Authenticated Role-Based Identity & Department Credentials
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "700px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: 800,
            }}
          >
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>

          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>
              {user?.full_name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
              <span className="badge badge-purple" style={{ textTransform: "uppercase" }}>
                {role}
              </span>
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{user?.email}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "10px" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>DEPARTMENT</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", marginTop: "2px" }}>
              {student.department || teacher.department || "Computer Science & Engineering"}
            </div>
          </div>

          {role === "student" && (
            <>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>UNIVERSITY USN</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#a5b4fc", marginTop: "2px" }}>
                  {student.usn || "4MT22CS010"}
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>SEMESTER & SECTION</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", marginTop: "2px" }}>
                  Semester {student.semester || 6}, Section {student.section || "A"}
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>CUMULATIVE CGPA</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#34d399", marginTop: "2px" }}>
                  {student.cgpa ? student.cgpa.toFixed(2) : "8.72"} / 10.0
                </div>
              </div>
            </>
          )}

          {role === "teacher" && (
            <>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>FACULTY ID</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#a5b4fc", marginTop: "2px" }}>
                  {teacher.faculty_id || "FAC-CSE-001"}
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>DESIGNATION</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", marginTop: "2px" }}>
                  {teacher.designation || "Assistant Professor"}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
