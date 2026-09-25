import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  CalendarCheck,
  Calendar,
  GraduationCap,
  Award,
  BellRing,
  BookOpen,
  Bus,
  Loader2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function StudentDashboardView() {
  const { user, setActiveTab } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.getStudentDashboard();
        setData(res);
      } catch (err) {
        console.error("Dashboard error:", err);
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

  const attendance = data?.attendance || { attendance_percentage: 0, total_classes: 0, attended_classes: 0 };
  const profile = data?.profile || {};
  const todayClasses = data?.today_classes || [];
  const upcomingExams = data?.upcoming_exams || [];
  const marks = data?.latest_marks || [];
  const notices = data?.latest_notices || [];

  return (
    <div>
      {/* Student Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.15))",
          border: "1px solid rgba(99, 102, 241, 0.3)",
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
          <div style={{ fontSize: "0.85rem", color: "#a5b4fc", fontWeight: 600, textTransform: "uppercase" }}>
            Student Academic Portal
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginTop: "0.25rem" }}>
            Welcome back, {profile.name || user?.full_name}!
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            USN: <strong>{profile.usn || "4MT22CS010"}</strong> | {profile.department || "Computer Science & Engineering"} | Semester {profile.semester || 6}, Section {profile.section || "A"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="btn btn-primary" onClick={() => setActiveTab("attendance")}>
            <CalendarCheck size={16} />
            <span>Mark Live Attendance</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        {/* Attendance Rate */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Attendance Rate</span>
            <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="stat-value">{attendance.attendance_percentage}%</div>
          <div className="stat-footer">
            <CheckCircle2 size={14} color="#10b981" />
            <span>{attendance.attended_classes} of {attendance.total_classes} classes attended</span>
          </div>
        </div>

        {/* Classes Today */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Classes Scheduled Today</span>
            <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-value">{todayClasses.length}</div>
          <div className="stat-footer">
            <Clock size={14} color="#6366f1" />
            <span>Regular Semester Routine</span>
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Upcoming Exams</span>
            <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="stat-value">{upcomingExams.length}</div>
          <div className="stat-footer">
            <span>Next: {upcomingExams[0]?.title || "None scheduled"}</span>
          </div>
        </div>

        {/* Cumulative CGPA */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Cumulative CGPA</span>
            <div className="stat-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
              <Award size={20} />
            </div>
          </div>
          <div className="stat-value">{profile.cgpa ? profile.cgpa.toFixed(2) : "8.72"}</div>
          <div className="stat-footer">
            <span style={{ color: "#34d399" }}>Standing: First Class Distinction</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Timetable & Notices */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Today's Timetable */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Calendar size={18} color="#6366f1" />
              <span>Today's Class Schedule</span>
            </h2>
            <button className="btn btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => setActiveTab("timetable")}>
              Full Week
            </button>
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
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.95rem" }}>
                      {cls.subject_name} ({cls.subject_code})
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
                      Faculty: {cls.substitute_teacher ? <span style={{ color: "#fbbf24" }}>Substitute: {cls.substitute_teacher}</span> : cls.teacher_name} | Room: {cls.room_number}
                    </div>
                  </div>
                  <div className="badge badge-info" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    <span>{cls.start_time} - {cls.end_time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Notices */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <BellRing size={18} color="#f59e0b" />
              <span>Department Notices & Circulars</span>
            </h2>
            <button className="btn btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => setActiveTab("notices")}>
              View All
            </button>
          </div>

          {notices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              No active notices right now.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {notices.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "0.85rem 1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>{n.title}</span>
                    <span className={`badge ${n.priority === "Urgent" ? "badge-danger" : "badge-warning"}`}>
                      {n.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                    Category: {n.category} • Posted: {n.created_at}
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
