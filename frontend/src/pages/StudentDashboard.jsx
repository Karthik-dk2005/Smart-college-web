import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import studentAuthApi from "../api/studentAuth";
import { useAuth } from "../context/AuthContext";
import CollegeLogo from "../components/CollegeLogo";
import {
  GraduationCap,
  IdCard,
  Mail,
  Building2,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Bus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trophy,
  UserCheck,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import DashboardNotifications from "../components/DashboardNotifications";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    return today === "Sunday" ? "Monday" : today;
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await studentAuthApi.getProfile();
      setProfile(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to load your student academic profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          color: "#94a3b8",
        }}
      >
        <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
        <p style={{ fontSize: "1rem", fontWeight: 600 }}>Loading your academic profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "1.5rem" }}>
        <div
          style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "1.5rem",
            color: "#fca5a5",
            textAlign: "center",
          }}
        >
          <AlertTriangle size={36} style={{ margin: "0 auto 0.75rem auto" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>Profile Unavailable</h3>
          <p style={{ margin: "0 0 1rem 0" }}>{error || "Student record not found. Please contact your Admin."}</p>
          <button
            onClick={fetchProfile}
            style={{
              padding: "0.6rem 1.25rem",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter timetable for selected day
  const filteredTimetable = (profile.timetable || []).filter(
    (t) => (t.day || t.day_of_week || "").toLowerCase() === selectedDay.toLowerCase()
  );

  const daysList = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "1.5rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      {/* 1. STUDENT IDENTITY BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%, #172554 100%)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "18px",
          padding: "1.75rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "1.8rem",
              fontWeight: 800,
              boxShadow: "0 4px 15px rgba(79, 70, 229, 0.4)",
            }}
          >
            {profile.name ? profile.name.charAt(0) : "S"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                {profile.name}
              </h1>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "2px 10px",
                  borderRadius: "20px",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                }}
              >
                Active Student
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.4rem", fontSize: "0.88rem", color: "#94a3b8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#818cf8", fontFamily: "monospace", fontWeight: 700 }}>
                <IdCard size={15} /> USN: {profile.usn}
              </span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#38bdf8" }}>
                <Mail size={15} /> {profile.gmail}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Tag Pills */}
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
              Department
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#f8fafc", marginTop: "2px" }}>
              CSE
            </div>
          </div>

          <div
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
              Semester
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#a5b4fc", marginTop: "2px" }}>
              Sem {profile.semester}
            </div>
          </div>

          <div
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
              Section
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#34d399", marginTop: "2px" }}>
              Section {profile.section}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Notifications Feed */}
      <DashboardNotifications limit={5} />

      {/* 2. STATS SUMMARY TILES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Attendance Card */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "14px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase" }}>
              Overall Attendance
            </span>
            <UserCheck size={18} style={{ color: "#10b981" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f8fafc", margin: "0.5rem 0 0.2rem 0" }}>
            {profile.attendance?.percentage || 85.0}%
          </div>
          <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            Attended {profile.attendance?.attended_classes || 42} of {profile.attendance?.total_classes || 48} classes
          </div>
          <div style={{ marginTop: "0.6rem" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "10px",
                background:
                  (profile.attendance?.percentage || 85) >= 75
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(239, 68, 68, 0.2)",
                color:
                  (profile.attendance?.percentage || 85) >= 75 ? "#34d399" : "#f87171",
              }}
            >
              {profile.attendance?.status || "Good Standing"}
            </span>
          </div>
        </div>

        {/* IA Marks Card */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "14px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>
              1st Internal Assessment
            </span>
            <Award size={18} style={{ color: "#818cf8" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f8fafc", margin: "0.5rem 0 0.2rem 0" }}>
            {profile.ia_marks?.length || 0}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            Subjects Evaluated (Max 30 marks each)
          </div>
          <div style={{ marginTop: "0.6rem" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.2)",
                color: "#a5b4fc",
              }}
            >
              Official VTU IA-1
            </span>
          </div>
        </div>

        {/* Bus Route Transport Card */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "14px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "#fbbf24", fontWeight: 700, textTransform: "uppercase" }}>
              Bus Route Info
            </span>
            <Bus size={18} style={{ color: "#fbbf24" }} />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0.5rem 0 0.2rem 0" }}>
            {profile.bus_route ? `Route #${profile.bus_route.route_number}` : "Day Scholar"}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            {profile.bus_route
              ? `${profile.bus_route.route_name} • ${profile.bus_route.stop_name}`
              : "Private Transport / Campus Hostel"}
          </div>
          {profile.bus_route?.driver_phone && (
            <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "#fbbf24" }}>
              Driver: {profile.bus_route.driver_name} ({profile.bus_route.driver_phone})
            </div>
          )}
          <Link
            to="/student/bus"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              marginTop: "0.65rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#93c5fd",
              textDecoration: "none",
            }}
          >
            <span>Transit Pass & All 28 Routes</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* 3. TIMETABLE SCHEDULE */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock style={{ color: "#6366f1" }} size={20} />
              Class Timetable — Semester {profile.semester} Section {profile.section}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "0.2rem 0 0 0" }}>
              Select day to view scheduled periods, lecture halls, and faculty
            </p>
          </div>

          {/* Day selection tabs */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {daysList.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  padding: "0.4rem 0.85rem",
                  background:
                    selectedDay === day ? "#4f46e5" : "rgba(255, 255, 255, 0.05)",
                  color: selectedDay === day ? "#ffffff" : "#94a3b8",
                  border:
                    selectedDay === day
                      ? "1px solid #6366f1"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Timetable List */}
        {filteredTimetable.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {filteredTimetable.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "#a5b4fc",
                      fontFamily: "monospace",
                    }}
                  >
                    {item.subject_code || "SUB"}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>
                    {item.start_time} - {item.end_time}
                  </span>
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>
                  {item.subject_name || "Academic Class"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                  <span>Room: {item.room_number || "Lecture Hall"}</span>
                  <span>Faculty: {item.teacher_name || "Faculty"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "#64748b",
              background: "rgba(30, 41, 59, 0.3)",
              borderRadius: "12px",
            }}
          >
            No regular lectures scheduled for {selectedDay}.
          </div>
        )}
      </div>

      {/* 4. IA MARKS (FIRST INTERNAL ASSESSMENT) */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "1.5rem",
        }}
      >
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Award style={{ color: "#818cf8" }} size={20} />
            First Internal Assessment (IA-1) Marks — Official Department Record
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "0.2rem 0 0 0" }}>
            Marks extracted from official VTU department assessment sheets for {profile.usn}
          </p>
        </div>

        {profile.ia_marks && profile.ia_marks.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
                    color: "#94a3b8",
                    fontSize: "0.78rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <th style={{ padding: "0.85rem 1rem" }}>Subject Code</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Subject Name</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Assessment</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Obtained Marks</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Max Marks</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {profile.ia_marks.map((m, idx) => {
                  const isAb = m.is_absent || m.status === "Absent";
                  return (
                    <tr
                      key={m.id || idx}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                        background: idx % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontWeight: 700, color: "#818cf8" }}>
                        {m.subject_code}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "#f8fafc", fontWeight: 600 }}>
                        {m.subject_name}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "center", color: "#94a3b8" }}>
                        {m.assessment || "IA-1"}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 800, fontSize: "1.05rem", color: isAb ? "#f87171" : "#34d399" }}>
                        {isAb ? "AB" : m.raw_marks !== null && m.raw_marks !== undefined ? m.raw_marks : m.marks}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right", color: "#94a3b8" }}>
                        {m.raw_max_marks || m.max_marks || 30.0}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "12px",
                            background: isAb ? "rgba(239, 68, 68, 0.18)" : "rgba(16, 185, 129, 0.18)",
                            color: isAb ? "#f87171" : "#34d399",
                          }}
                        >
                          {isAb ? "Absent" : "Present"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "#64748b",
              background: "rgba(30, 41, 59, 0.3)",
              borderRadius: "12px",
            }}
          >
            No IA marks entered yet. Marks will appear here once published by faculty.
          </div>
        )}
      </div>

      {/* 5. EVENTS & ACHIEVEMENTS TWO-COLUMN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Events */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar style={{ color: "#38bdf8" }} size={18} />
              Upcoming Events & Workshops
            </h3>
            <Link to="/events" style={{ fontSize: "0.78rem", color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>
              View All →
            </Link>
          </div>

          {profile.events && profile.events.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {profile.events.map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  style={{
                    background: "rgba(30, 41, 59, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "0.85rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#f8fafc" }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
                      Venue: {ev.venue || "Campus Auditorium"} • Category: {ev.category}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "rgba(56, 189, 248, 0.15)",
                      color: "#38bdf8",
                    }}
                  >
                    {ev.event_date}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b", background: "rgba(30, 41, 59, 0.3)", borderRadius: "10px" }}>
              No upcoming events posted at this time.
            </div>
          )}
        </div>

        {/* Student Activities & Achievements */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Trophy style={{ color: "#fbbf24" }} size={18} />
              Activities & Achievements
            </h3>
            <Link to="/student-activities" style={{ fontSize: "0.78rem", color: "#fbbf24", textDecoration: "none", fontWeight: 600 }}>
              Submit Activity →
            </Link>
          </div>

          {profile.activities && profile.activities.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {profile.activities.map((act, idx) => (
                <div
                  key={act.id || idx}
                  style={{
                    background: "rgba(30, 41, 59, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "0.85rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#f8fafc" }}>
                      {act.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
                      Category: {act.category} {act.activity_date && `• ${act.activity_date}`}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background:
                        act.status === "VERIFIED"
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(245, 158, 11, 0.15)",
                      color: act.status === "VERIFIED" ? "#34d399" : "#fbbf24",
                    }}
                  >
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b", background: "rgba(30, 41, 59, 0.3)", borderRadius: "10px" }}>
              No extracurricular activities submitted yet. Click above to submit certificates & achievements.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

