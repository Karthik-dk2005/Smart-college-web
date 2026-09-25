import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  CalendarCheck,
  Calendar,
  Users,
  Award,
  BellRing,
  BookOpen,
  Loader2,
  Clock,
  PlusCircle,
} from "lucide-react";

export default function TeacherDashboardView() {
  const { user, setActiveTab } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.getTeacherDashboard();
        setData(res);
      } catch (err) {
        console.error("Teacher dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  const profile = data?.profile || {};
  const todayClasses = data?.today_classes || [];
  const sessions = data?.attendance_sessions || [];
  const subjects = data?.subjects || [];
  const pendingMarks = data?.pending_marks_count || 0;

  return (
    <div>
      {/* Faculty Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.15))",
          border: "1px solid rgba(6, 182, 212, 0.3)",
          borderRadius: "16px",
          padding: "1.75rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.85rem", color: "#67e8f9", fontWeight: 600, textTransform: "uppercase" }}>
            Faculty Portal
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginTop: "0.25rem" }}>
            Welcome, {profile.name || user?.full_name}!
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Faculty ID: <strong>{profile.faculty_id || "FAC-CSE-001"}</strong> | {profile.designation || "Assistant Professor"} | {profile.department || "Computer Science & Engineering"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="btn btn-primary" onClick={() => setActiveTab("attendance")}>
            <PlusCircle size={16} />
            <span>Open Attendance Session</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Classes Today</span>
            <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-value">{todayClasses.length}</div>
          <div className="stat-footer">Teaching Routine</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Conducted Sessions</span>
            <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-footer">Session tokens issued</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Assigned Subjects</span>
            <div className="stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
              <BookOpen size={20} />
            </div>
          </div>
          <div className="stat-value">{subjects.length}</div>
          <div className="stat-footer">Theory & Lab Courses</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Draft Marks (Pending Lock)</span>
            <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
              <Award size={20} />
            </div>
          </div>
          <div className="stat-value">{pendingMarks}</div>
          <div className="stat-footer">Requires HOD finalization</div>
        </div>
      </div>

      {/* Today's Classes & Recent Sessions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Calendar size={18} color="#6366f1" />
              <span>Today's Assigned Lecture Slots</span>
            </h2>
          </div>

          {todayClasses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              No classes scheduled for today.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  style={{
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#fff" }}>
                      {cls.subject_name} ({cls.subject_code})
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
                      Sem {cls.semester} {cls.section} • Room: {cls.room}
                    </div>
                  </div>
                  <span className="badge badge-info">{cls.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <CalendarCheck size={18} color="#10b981" />
              <span>Recent Attendance Sessions</span>
            </h2>
            <button className="btn btn-outline" style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }} onClick={() => setActiveTab("attendance")}>
              Manage
            </button>
          </div>

          {sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              No attendance sessions created yet. Click "Open Attendance Session" above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: "0.85rem 1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{s.session_id}</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      {s.subject} • Room {s.room} ({s.timing})
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="badge badge-purple">{s.attendee_count} Checked in</span>
                    <span className={`badge ${s.status === "ACTIVE" ? "badge-success" : "badge-info"}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
