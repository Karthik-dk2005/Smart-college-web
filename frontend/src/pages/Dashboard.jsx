import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../api";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Calendar,
  Activity,
  Bell,
  Clock,
  MapPin,
  TrendingUp,
  BarChart3,
  PieChart,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

export default function Dashboard() {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getStats();
      setData(res.data || res);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metrics = data?.metrics || {
    total_students: 0,
    total_faculty: 0,
    total_subjects: 0,
    today_classes: 0,
    today_attendance: 0,
    average_attendance: 0,
    active_users: 0,
  };

  const charts = data?.charts || {};
  const todayClasses = data?.today_classes || [];
  const recentNotices = data?.recent_notices || [];
  const studentOverview = data?.student_overview;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "16px",
          padding: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              style={{
                background: "rgba(99, 102, 241, 0.3)",
                color: "#c7d2fe",
                padding: "0.2rem 0.6rem",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {role || "STUDENT"}
            </span>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Semester 5 (ODD)</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
            Welcome back, {user?.name || "Scholar"}!
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            Department of Computer Science & Engineering • Academic Year 2026–2027
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={fetchStats}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "0.6rem 1rem",
              color: "#f8fafc",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
          <Link
            to="/attendance"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#6366f1",
              borderRadius: "8px",
              padding: "0.6rem 1.1rem",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
            }}
          >
            <CalendarCheck size={16} />
            <span>Mark Attendance</span>
          </Link>
        </div>
      </div>

      {/* Student Personal Attendance Progress (Shown if logged in as student) */}
      {studentOverview && (
        <div
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase" }}>
              Your Attendance Record
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
              USN: {studentOverview.usn} • Semester {studentOverview.semester} Section {studentOverview.section}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.2rem" }}>
              Classes Attended: {studentOverview.present_classes} of {studentOverview.total_classes}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 900,
                  color: studentOverview.attendance_percentage >= 75 ? "#10b981" : "#ef4444",
                }}
              >
                {studentOverview.attendance_percentage}%
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                {studentOverview.attendance_percentage >= 75 ? "Good Standing" : "Attendance Shortage Warning"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Required High-Level Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Total Students */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>Total Students</span>
            <div style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", padding: "0.5rem", borderRadius: "8px" }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f8fafc", marginTop: "0.5rem" }}>
            {metrics.total_students}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>Sections A & B Enrolled</div>
        </div>

        {/* Total Faculty */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>Total Faculty</span>
            <div style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", padding: "0.5rem", borderRadius: "8px" }}>
              <GraduationCap size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f8fafc", marginTop: "0.5rem" }}>
            {metrics.total_faculty}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>Teaching & Research Staff</div>
        </div>

        {/* Total Subjects */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>Total Subjects</span>
            <div style={{ background: "rgba(6, 182, 212, 0.15)", color: "#38bdf8", padding: "0.5rem", borderRadius: "8px" }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f8fafc", marginTop: "0.5rem" }}>
            {metrics.total_subjects}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>5th Semester Courses</div>
        </div>

        {/* Today's Classes */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>Today's Classes</span>
            <div style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", padding: "0.5rem", borderRadius: "8px" }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f8fafc", marginTop: "0.5rem" }}>
            {metrics.today_classes}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>Scheduled for Today</div>
        </div>

        {/* Average Attendance */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>Average Attendance</span>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "0.5rem", borderRadius: "8px" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f8fafc", marginTop: "0.5rem" }}>
            {metrics.average_attendance}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>Department Overall Ratio</div>
        </div>

        {/* Active Users */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>Active Users</span>
            <div style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa", padding: "0.5rem", borderRadius: "8px" }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f8fafc", marginTop: "0.5rem" }}>
            {metrics.active_users}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>Logged into Portal</div>
        </div>
      </div>

      {/* Charts Section: Attendance Statistics & Daily Attendance Trend */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.25rem" }}>
        {/* Chart 1: Attendance Statistics Breakdown */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>Attendance Breakdown</h3>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Recorded student statuses</p>
            </div>
            <PieChart size={18} color="#818cf8" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {charts.attendance_statistics?.map((item) => {
              const total = charts.attendance_statistics.reduce((acc, curr) => acc + curr.count, 0) || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                    <span style={{ color: "#cbd5e1", fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: item.color, borderRadius: "4px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Daily Attendance Trend (Past 7 Days) */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>Daily Attendance Trend</h3>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Present vs Absent (Past 7 Days)</p>
            </div>
            <BarChart3 size={18} color="#38bdf8" />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", height: "180px", paddingTop: "1rem" }}>
            {charts.daily_attendance?.map((item) => {
              const maxVal = Math.max(...charts.daily_attendance.map((d) => d.total || 1), 10);
              const presentHeight = Math.max((item.present / maxVal) * 140, 8);
              const absentHeight = Math.max((item.absent / maxVal) * 140, 4);

              return (
                <div key={item.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "140px" }}>
                    <div
                      title={`Present: ${item.present}`}
                      style={{
                        width: "12px",
                        height: `${presentHeight}px`,
                        background: "#10b981",
                        borderRadius: "3px 3px 0 0",
                      }}
                    />
                    <div
                      title={`Absent: ${item.absent}`}
                      style={{
                        width: "12px",
                        height: `${absentHeight}px`,
                        background: "#ef4444",
                        borderRadius: "3px 3px 0 0",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "0.68rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {item.day.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem", fontSize: "0.75rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10b981" }}>
              <span style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "2px" }} /> Present
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#ef4444" }}>
              <span style={{ width: "8px", height: "8px", background: "#ef4444", borderRadius: "2px" }} /> Absent
            </span>
          </div>
        </div>
      </div>

      {/* Row: Today's Classes & Recent Notices */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.25rem" }}>
        {/* Today's Schedule */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>Today's Classes</h3>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Academic Year 2026–2027 Schedule</p>
            </div>
            <Link to="/timetable" style={{ color: "#818cf8", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
              View All →
            </Link>
          </div>

          {todayClasses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.9rem" }}>
              No classes scheduled for today. Check the weekly timetable for upcoming sessions.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {todayClasses.slice(0, 5).map((cls) => (
                <div
                  key={cls.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.9rem" }}>
                      {cls.subject_name} ({cls.subject_code})
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                      {cls.faculty_name} • Sec {cls.section} • Room {cls.room_number}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <div
                      style={{
                        background: "rgba(99, 102, 241, 0.15)",
                        color: "#c7d2fe",
                        padding: "0.3rem 0.65rem",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {cls.start_time} - {cls.end_time}
                    </div>

                    {cls.attendance_completed ? (
                      <span
                        style={{
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#34d399",
                          padding: "0.3rem 0.65rem",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    ) : (
                      ["teacher", "faculty", "admin", "hod"].includes(role?.toLowerCase()) && (
                        <Link
                          to={`/attendance/session/${cls.id}`}
                          style={{
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            color: "#fff",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            boxShadow: "0 2px 6px rgba(99, 102, 241, 0.3)",
                          }}
                        >
                          <CalendarCheck size={13} /> Take Attendance
                        </Link>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>Recent Notices</h3>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Departmental Announcements</p>
            </div>
            <Link to="/notices" style={{ color: "#818cf8", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
              View All →
            </Link>
          </div>

          {recentNotices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.9rem" }}>
              No recent announcements posted.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentNotices.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "0.85rem 1rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.9rem" }}>{n.title}</div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "10px",
                        background: "rgba(168, 85, 247, 0.15)",
                        color: "#c084fc",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {n.target_role}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.35rem", lineHeight: 1.4 }}>
                    {n.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
