import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../api";
import CollegeLogo from "../components/CollegeLogo";
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
  CheckCircle2,
  CalendarDays,
  Megaphone,
  ArrowRight,
  UserCheck,
  Trophy,
  Award,
  RefreshCw,
} from "lucide-react";
import { eventsApi, announcementsApi, studentActivitiesApi } from "../api";

export default function Dashboard() {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [latestAnnouncements, setLatestAnnouncements] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [activityStats, setActivityStats] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, eventsRes, annRes, myRegsRes, actStatsRes] = await Promise.allSettled([
        dashboardApi.getStats(),
        eventsApi.getAll({ upcoming_only: true }),
        announcementsApi.getAll({ active_only: true }),
        eventsApi.getMyRegistrations(),
        studentActivitiesApi.getStatsSummary(),
      ]);

      if (statsRes.status === "fulfilled") {
        setData(statsRes.value.data || statsRes.value);
      }

      if (actStatsRes.status === "fulfilled") {
        setActivityStats(actStatsRes.value.data || null);
      }

      if (eventsRes.status === "fulfilled") {
        const evList = Array.isArray(eventsRes.value) ? eventsRes.value : eventsRes.value.data || [];
        setUpcomingEvents(evList);
        const todayStr = new Date().toISOString().substring(0, 10);
        setTodaysEvents(evList.filter((e) => e.event_date === todayStr || e.computed_status === "Ongoing"));
      }

      if (annRes.status === "fulfilled") {
        const annList = Array.isArray(annRes.value) ? annRes.value : annRes.value.data || [];
        setLatestAnnouncements(annList);
      }

      if (myRegsRes.status === "fulfilled") {
        const myRegsList = Array.isArray(myRegsRes.value) ? myRegsRes.value : myRegsRes.value.data || [];
        setMyRegistrations(myRegsList);
      }
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
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          <CollegeLogo
            size="lg"
            style={{
              height: "68px",
              width: "auto",
              objectFit: "contain",
              background: "#ffffff",
              padding: "5px",
              borderRadius: "14px",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
            }}
          />
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
              Maharaja Institute of Technology Thandavapura • Dept of Computer Science & Engineering
            </p>
          </div>
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

      {/* Student Academic Identification Card (Requirement 5) */}
      {(role || user?.role || "").toLowerCase() === "student" && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "14px",
            padding: "1.25rem 1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Student Name
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.25rem" }}>
              {user?.full_name || user?.name || "Student"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              University Seat Number (USN)
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#818cf8", fontFamily: "monospace", marginTop: "0.25rem" }}>
              {user?.usn || user?.usn_or_employee_id || "N/A"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Registered Gmail
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#38bdf8", fontFamily: "monospace", marginTop: "0.25rem" }}>
              {user?.gmail || user?.email || "Registered"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Academic Class
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#34d399", marginTop: "0.25rem" }}>
              Semester {user?.semester || 5} • Section {user?.section || "A"}
            </div>
          </div>
        </div>
      )}

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
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* STUDENT ACHIEVEMENTS Card for Student (Section 22) */}
        {(role || user?.role || "").toLowerCase() === "student" && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 15px rgba(245, 158, 11, 0.08)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "#fbbf24", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Trophy size={16} /> STUDENT ACHIEVEMENTS
                </span>
                <span style={{ fontSize: "0.7rem", color: "#fbbf24", background: "rgba(245, 158, 11, 0.15)", padding: "2px 8px", borderRadius: "10px" }}>
                  Active
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", textAlign: "center", margin: "0.75rem 0" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.5rem 0.25rem", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>🏆 Verified</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#fbbf24", marginTop: "2px" }}>
                    {activityStats?.verified_achievements || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.5rem 0.25rem", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>📜 Certs</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#38bdf8", marginTop: "2px" }}>
                    {activityStats?.certificates_count || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.5rem 0.25rem", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>⏳ Pending</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#fbbf24", marginTop: "2px" }}>
                    {activityStats?.pending_verification || 0}
                  </div>
                </div>
              </div>
            </div>
            <Link
              to="/student/activities"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "6px",
                padding: "0.45rem",
                color: "#fbbf24",
                fontSize: "0.78rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              View Activities <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* STUDENT ACTIVITY VERIFICATION Card for Admin / HOD (Section 22) */}
        {["admin", "hod"].includes((role || user?.role || "").toLowerCase()) && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.08)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "#818cf8", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Trophy size={16} /> ACTIVITY VERIFICATION
                </span>
                <span style={{ fontSize: "0.7rem", color: "#fbbf24", background: "rgba(251, 191, 36, 0.12)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                  Queue
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", textAlign: "center", margin: "0.75rem 0" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.5rem 0.25rem", borderRadius: "6px", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
                  <div style={{ fontSize: "0.68rem", color: "#fbbf24" }}>Pending</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#fbbf24", marginTop: "2px" }}>
                    {activityStats?.pending_verification || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.5rem 0.25rem", borderRadius: "6px", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
                  <div style={{ fontSize: "0.68rem", color: "#34d399" }}>Verified</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#34d399", marginTop: "2px" }}>
                    {activityStats?.verified_achievements || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.5rem 0.25rem", borderRadius: "6px", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                  <div style={{ fontSize: "0.68rem", color: "#fb7185" }}>Rejected</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#fb7185", marginTop: "2px" }}>
                    {activityStats?.rejected || 0}
                  </div>
                </div>
              </div>
            </div>
            <Link
              to={((role || user?.role || "").toLowerCase() === "hod") ? "/hod/student-activities" : "/admin/student-activities"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                background: "rgba(99, 102, 241, 0.2)",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                borderRadius: "6px",
                padding: "0.45rem",
                color: "#818cf8",
                fontSize: "0.78rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Review Activities <ArrowRight size={13} />
            </Link>
          </div>
        )}

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

      {/* ========================================================== */}
      {/* EVENTS & ANNOUNCEMENTS MODULE SECTIONS                     */}
      {/* ========================================================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
        {/* UPCOMING EVENTS */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarDays size={18} color="#818cf8" />
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  Upcoming Events
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#818cf8", fontWeight: 600 }}>
                  {upcomingEvents.length} Upcoming Event{upcomingEvents.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <Link to="/events" style={{ color: "#818cf8", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
              View All →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.9rem" }}>
              No upcoming events scheduled.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {upcomingEvents.slice(0, 4).map((ev) => {
                const d = new Date(ev.event_date + "T00:00:00");
                const dayMonth = isNaN(d.getTime())
                  ? ev.event_date
                  : d.toLocaleDateString("en-US", { day: "numeric", month: "short" });

                return (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "10px",
                      textDecoration: "none",
                      transition: "transform 0.15s ease, background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.9rem" }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                        {ev.category} • {ev.venue}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          background: "rgba(99, 102, 241, 0.15)",
                          color: "#c7d2fe",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                        }}
                      >
                        {dayMonth}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* LATEST ANNOUNCEMENTS */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Megaphone size={18} color="#f59e0b" />
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  Latest Announcements
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: 600 }}>
                  Official Notices & Circulars
                </span>
              </div>
            </div>
            <Link to="/announcements" style={{ color: "#818cf8", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
              View All →
            </Link>
          </div>

          {latestAnnouncements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.9rem" }}>
              No announcements published.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {latestAnnouncements.slice(0, 4).map((a) => {
                const priority = (a.priority || "Normal").toLowerCase();
                const badgeColor =
                  priority === "urgent" ? "#ef4444" : priority === "important" ? "#f59e0b" : "#60a5fa";
                const badgeBg =
                  priority === "urgent"
                    ? "rgba(239, 68, 68, 0.15)"
                    : priority === "important"
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(96, 165, 250, 0.15)";

                return (
                  <Link
                    key={a.id}
                    to="/announcements"
                    style={{
                      padding: "0.85rem 1rem",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "10px",
                      textDecoration: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                      transition: "transform 0.15s ease, background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          background: badgeBg,
                          color: badgeColor,
                          textTransform: "uppercase",
                        }}
                      >
                        {a.priority || "Normal"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {a.publish_date}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.88rem" }}>
                      {a.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "#94a3b8",
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {a.content}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* TODAY'S EVENTS */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={18} color="#34d399" />
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  Today's Events
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#34d399", fontWeight: 600 }}>
                  Active on Campus Today
                </span>
              </div>
            </div>
            <Link to="/events" style={{ color: "#818cf8", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
              Calendar →
            </Link>
          </div>

          {todaysEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.9rem" }}>
              No campus events scheduled for today. Check upcoming events calendar.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {todaysEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: "0.85rem 1rem",
                    background: "rgba(16, 185, 129, 0.06)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.9rem" }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                      {ev.start_time} - {ev.end_time} • {ev.venue}
                    </div>
                  </div>
                  <Link
                    to={`/events/${ev.id}`}
                    style={{
                      background: "rgba(16, 185, 129, 0.2)",
                      color: "#6ee7b7",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MY REGISTERED EVENTS */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UserCheck size={18} color="#c084fc" />
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  My Registered Events
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#c084fc", fontWeight: 600 }}>
                  {myRegistrations.length} Confirmed Registration{myRegistrations.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <Link to="/my-events" style={{ color: "#818cf8", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
              Manage →
            </Link>
          </div>

          {myRegistrations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.9rem" }}>
              You haven't registered for any events yet. Browse upcoming events to register.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {myRegistrations.slice(0, 4).map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: "0.85rem 1rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.9rem" }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                      {ev.event_date} • {ev.venue}
                    </div>
                  </div>
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#34d399",
                      padding: "0.25rem 0.55rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
