import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { attendanceApi, timetableApi, subjectsApi, departmentsApi, teachersApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import TableSkeleton from "../components/TableSkeleton";
import Modal from "../components/Modal";
import AttendanceMethodSelector from "../components/AttendanceMethodSelector";
import FaceScanner from "../components/FaceScanner";
import BiometricScanner from "../components/BiometricScanner";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  User,
  BookOpen,
  Calendar,
  ArrowLeft,
  Check,
  X,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  AlertCircle,
  GraduationCap,
  ScanFace,
  Fingerprint,
  Edit3,
} from "lucide-react";

// Helper to determine the current 30-minute interval duration string
export function getCurrentDuration(startTime, endTime) {
  if (!startTime) return "09:00–09:30";
  // If time string passed is "09:00 - 10:00" or "09:00-10:00"
  if (startTime.includes("-") || startTime.includes("–")) {
    const parts = startTime.split(/[-–]/);
    startTime = parts[0].trim();
    endTime = parts[1]?.trim();
  }

  const parseMins = (tStr) => {
    if (!tStr) return 0;
    const parts = tStr.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const sMins = parseMins(startTime);
  const eMins = endTime ? parseMins(endTime) : sMins + 60;
  const midMins = sMins + 30;

  const fmt = (m) => {
    const hh = String(Math.floor(m / 60) % 24).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes >= midMins && currentMinutes < eMins) {
    return `${fmt(midMins)}–${fmt(eMins)}`;
  }
  return `${fmt(sMins)}–${fmt(midMins)}`;
}

export default function Attendance() {
  const { timetableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { success, error, warning } = useToast();

  const currentRole = role?.toLowerCase() || "student";
  const isTeacher = ["teacher", "faculty"].includes(currentRole);
  const isStudent = currentRole === "student";
  const isHod = currentRole === "hod";
  const isAdmin = currentRole === "admin";

  const initialMethod = searchParams.get("method")?.toUpperCase();
  const [selectedMethod, setSelectedMethod] = useState(
    ["FACE", "BIOMETRIC", "MANUAL"].includes(initialMethod) ? initialMethod : "MANUAL"
  );

  // Session Taking State (when timetableId is present)
  const [sessionData, setSessionData] = useState(null);
  const [studentsRoster, setStudentsRoster] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState(null);

  // General Attendance View State (when no timetableId is in URL)
  const [todayClasses, setTodayClasses] = useState([]);
  const [conductedSessions, setConductedSessions] = useState([]);
  const [studentSummary, setStudentSummary] = useState(null);
  const [generalLoading, setGeneralLoading] = useState(false);

  // HOD / Admin Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [subjectsList, setSubjectsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  // 1. LOAD SESSION DETAILS (WHEN timetableId IS IN ROUTE)
  // -------------------------------------------------------------
  const fetchSessionDetails = async (id) => {
    try {
      setSessionLoading(true);
      const res = await attendanceApi.getSession(id);
      const sData = res.data?.data || res.data || res;
      setSessionData(sData);

      // Initialize students roster with method and time fields
      const studentsList = (sData.students || []).map((s) => ({
        ...s,
        status: s.status || "Present",
        attendance_method: s.attendance_method || "MANUAL",
        time: s.time || (s.status === "Present" ? (sData.time?.split("-")[0]?.trim() || "09:00") : "-"),
      }));
      setStudentsRoster(studentsList);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to load timetable session");
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    if (timetableId) {
      fetchSessionDetails(timetableId);
    }
  }, [timetableId]);

  // -------------------------------------------------------------
  // 2. LOAD GENERAL ATTENDANCE (TODAY'S CLASSES, HOD/ADMIN VIEW, STUDENT SUMMARY)
  // -------------------------------------------------------------
  const fetchGeneralData = async () => {
    if (timetableId) return;
    try {
      setGeneralLoading(true);

      if (isTeacher) {
        // Teachers load their today's classes
        const [resToday, resConducted] = await Promise.all([
          timetableApi.getTeacherToday().catch(() => ({ data: [] })),
          attendanceApi.getConductedSessions().catch(() => ({ data: [] })),
        ]);
        setTodayClasses(resToday.data?.data || resToday.data || []);
        setConductedSessions(resConducted.data?.data || resConducted.data || []);
      } else if (isStudent) {
        // Students load their attendance percentage summary
        const studentId = user?.student_id || user?.id || 1;
        const resSum = await attendanceApi.getByStudent(studentId).catch(() => null);
        if (resSum) {
          setStudentSummary(resSum.data?.data || resSum.data || null);
        }
      } else if (isAdmin || isHod) {
        // HOD / Admin load conducted sessions and metadata filters
        const params = {};
        if (filterDate) params.date = filterDate;
        if (filterSemester) params.semester = Number(filterSemester);
        if (filterSection && filterSection !== "ALL") params.section = filterSection;
        if (filterSubject) params.subject_id = Number(filterSubject);
        if (filterDepartment && isAdmin) params.department_id = Number(filterDepartment);
        if (isHod && user?.department_id) params.department_id = user.department_id;

        const [resSessions, resSubj, resDepts, resToday] = await Promise.all([
          attendanceApi.getConductedSessions(params),
          subjectsApi.getAll().catch(() => ({ data: [] })),
          departmentsApi.getAll().catch(() => ({ data: [] })),
          timetableApi.getToday().catch(() => ({ data: [] })),
        ]);

        setConductedSessions(resSessions.data?.data || resSessions.data || []);
        setSubjectsList(resSubj.data?.data || resSubj.data || []);
        setDepartmentsList(resDepts.data?.data || resDepts.data || []);
        setTodayClasses(resToday.data?.data || resToday.data || []);
      }
    } catch (err) {
      console.error("Attendance fetch error:", err);
    } finally {
      setGeneralLoading(false);
    }
  };

  useEffect(() => {
    fetchGeneralData();
  }, [timetableId, filterDate, filterSemester, filterSection, filterSubject, filterDepartment]);

  // -------------------------------------------------------------
  // ATTENDANCE MARKING HANDLERS
  // -------------------------------------------------------------
  const handleMarkAllPresent = () => {
    setStudentsRoster((prev) =>
      prev.map((s) => ({ ...s, status: "Present" }))
    );
  };

  const handleMarkAllAbsent = () => {
    setStudentsRoster((prev) =>
      prev.map((s) => ({ ...s, status: "Absent" }))
    );
  };

  const handleToggleStatus = (studentId) => {
    setStudentsRoster((prev) =>
      prev.map((s) => {
        if (s.id === studentId || s.student_id === studentId) {
          const nextStatus = s.status === "Present" ? "Absent" : "Present";
          return {
            ...s,
            status: nextStatus,
            attendance_method: nextStatus === "Present" ? (s.attendance_method || "MANUAL") : "-",
            time: nextStatus === "Present" ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
          };
        }
        return s;
      })
    );
  };

  const handleLiveVerified = (verifiedStudent) => {
    // verifiedStudent: { student_id, student_name, usn, method, time, status }
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const methodUsed = verifiedStudent.method || selectedMethod || "FACE";
    const markedTime = verifiedStudent.time || nowStr;

    setStudentsRoster((prev) =>
      prev.map((s) => {
        const isMatch =
          s.id === verifiedStudent.student_id ||
          s.student_id === verifiedStudent.student_id ||
          (s.usn && verifiedStudent.usn && s.usn.toLowerCase() === verifiedStudent.usn.toLowerCase()) ||
          (s.roll_no && verifiedStudent.roll_no && s.roll_no.toLowerCase() === verifiedStudent.roll_no.toLowerCase());

        if (isMatch) {
          return {
            ...s,
            status: "Present",
            attendance_method: methodUsed,
            time: markedTime,
          };
        }
        return s;
      })
    );
    success(`✓ ${verifiedStudent.student_name || `Student #${verifiedStudent.student_id}`} marked Present via ${methodUsed}`);
  };

  // Submit Session Attendance
  const handleSubmitAttendance = async () => {
    if (!sessionData) return;
    try {
      setSubmitting(true);
      const payload = {
        date: sessionData.date,
        attendance: studentsRoster.map((s) => ({
          student_id: s.student_id || s.id,
          status: s.status || "Present",
          attendance_method: s.status === "Present" ? (s.attendance_method || selectedMethod || "MANUAL") : "MANUAL",
        })),
      };

      const res = await attendanceApi.submitSession(sessionData.timetable_id, payload);
      const resData = res.data?.data || res.data;
      setSubmissionSuccessData(resData);
      success("✓ Attendance submitted successfully.");
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // Live count computations
  const totalCount = studentsRoster.length;
  const presentCount = studentsRoster.filter((s) => s.status === "Present").length;
  const absentCount = totalCount - presentCount;

  // =============================================================
  // RENDER: SPECIFIC TIMETABLE SESSION ATTENDANCE TAKING VIEW
  // =============================================================
  if (timetableId) {
    if (sessionLoading) {
      return (
        <div style={{ padding: "2rem" }}>
          <TableSkeleton rows={8} cols={4} />
        </div>
      );
    }

    if (!sessionData) {
      return (
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#94a3b8" }}>
          <AlertCircle size={40} color="#f87171" style={{ margin: "0 auto 1rem" }} />
          <h2 style={{ color: "#f8fafc", fontSize: "1.3rem" }}>Timetable Session Not Found</h2>
          <p style={{ marginTop: "0.5rem" }}>The requested timetable entry does not exist or access is restricted.</p>
          <button
            onClick={() => navigate("/timetable")}
            style={{
              marginTop: "1.5rem",
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              color: "#c7d2fe",
              padding: "0.6rem 1.25rem",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← Return to Timetable
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
        {/* Navigation Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate(isTeacher ? "/teacher/timetable" : "/timetable")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "transparent",
              border: "none",
              color: "#818cf8",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} /> Return to Today's Timetable
          </button>

          {sessionData.attendance_completed && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={15} /> ✓ Attendance Completed
            </span>
          )}
        </div>

        {/* Header Block with READ-ONLY Timetable Metadata */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "1.75rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span
              style={{
                background: "rgba(99, 102, 241, 0.25)",
                color: "#c7d2fe",
                padding: "0.2rem 0.6rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Timetable Session #{sessionData.timetable_id}
            </span>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>• {sessionData.day}</span>
          </div>

          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 1.25rem 0" }}>
            TAKE ATTENDANCE
          </h1>

          {/* Read-only timetable values */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              background: "rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              padding: "1.25rem",
            }}
          >
            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
                Subject
              </span>
              <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "1.05rem" }}>
                {sessionData.subject_name}
              </span>
              {sessionData.subject_code && (
                <span style={{ display: "block", color: "#818cf8", fontSize: "0.8rem", marginTop: "0.15rem" }}>
                  ({sessionData.subject_code})
                </span>
              )}
            </div>

            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
                Teacher
              </span>
              <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "1.05rem" }}>
                {sessionData.teacher_name}
              </span>
            </div>

            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
                Class / Section
              </span>
              <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "1.05rem" }}>
                Semester {sessionData.semester} - Section {sessionData.section}
              </span>
            </div>

            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
                Room
              </span>
              <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "1.05rem" }}>
                {sessionData.room_name || "Assigned Hall"}
              </span>
            </div>

            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
                Date
              </span>
              <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "1.05rem" }}>
                {sessionData.date}
              </span>
            </div>

            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
                Scheduled Time
              </span>
              <span style={{ color: "#34d399", fontWeight: 700, fontSize: "1.05rem" }}>
                {sessionData.time}
              </span>
            </div>
          </div>

          {/* TEACHER ATTENDANCE TODAY'S CLASS CARD & METHOD SELECTOR */}
          <div
            style={{
              marginTop: "1.25rem",
              padding: "1.25rem",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#818cf8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              TODAY'S CLASS
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginTop: "0.75rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div>
                <span style={{ color: "#94a3b8", fontSize: "0.75rem", display: "block" }}>Subject:</span>
                <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "1.05rem" }}>{sessionData.subject_name}</span>
              </div>
              <div>
                <span style={{ color: "#94a3b8", fontSize: "0.75rem", display: "block" }}>Time:</span>
                <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "1.05rem" }}>{sessionData.time}</span>
              </div>
              <div>
                <span style={{ color: "#94a3b8", fontSize: "0.75rem", display: "block" }}>Current Duration:</span>
                <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "1.05rem" }}>
                  {getCurrentDuration(sessionData.time)}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Attendance Method:
              </div>
              <AttendanceMethodSelector
                selectedMethod={selectedMethod}
                onSelectMethod={setSelectedMethod}
                disabled={sessionData.attendance_completed}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Verification Scanner based on selected method */}
        {!sessionData.attendance_completed && selectedMethod === "FACE" && (
          <FaceScanner
            timetableId={sessionData.timetable_id}
            onVerified={handleLiveVerified}
          />
        )}

        {!sessionData.attendance_completed && selectedMethod === "BIOMETRIC" && (
          <BiometricScanner
            timetableId={sessionData.timetable_id}
            onVerified={handleLiveVerified}
          />
        )}

        {/* Action Controls & Roster Summary */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            background: "rgba(17, 24, 39, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
          }}
        >
          <div>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
              {totalCount} Students
            </span>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem", marginLeft: "0.5rem" }}>
              (Semester {sessionData.semester}{sessionData.section})
            </span>
          </div>

          {!sessionData.attendance_completed && (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                id="btn-mark-all-present"
                onClick={handleMarkAllPresent}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#34d399",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Check size={16} /> Mark All Present
              </button>

              <button
                type="button"
                id="btn-mark-all-absent"
                onClick={handleMarkAllAbsent}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <X size={16} /> Mark All Absent
              </button>
            </div>
          )}
        </div>

        {/* Student Attendance Table: Student ID | Student Name | Status | Method | Time */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
                <th style={{ padding: "0.9rem 1.25rem", width: "130px" }}>Student ID</th>
                <th style={{ padding: "0.9rem 1.25rem" }}>Student Name</th>
                <th style={{ padding: "0.9rem 1rem", width: "120px", textAlign: "center" }}>Status</th>
                <th style={{ padding: "0.9rem 1rem", width: "120px", textAlign: "center" }}>Method</th>
                <th style={{ padding: "0.9rem 1rem", width: "100px", textAlign: "center" }}>Time</th>
                {!sessionData.attendance_completed && (
                  <th style={{ padding: "0.9rem 1.25rem", width: "150px", textAlign: "right" }}>Toggle</th>
                )}
              </tr>
            </thead>
            <tbody>
              {studentsRoster.map((st, index) => {
                const isPresent = st.status === "Present";
                const studentIdFormatted = st.roll_no || st.usn || (st.id ? `STU${String(st.id).padStart(3, "0")}` : `STU${String(index + 1).padStart(3, "0")}`);
                const methodStr = (st.attendance_method || "MANUAL").toUpperCase();
                const markedTime = isPresent ? (st.time && st.time !== "-" ? st.time : "09:00") : "-";

                return (
                  <tr
                    key={st.id || index}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      background: isPresent ? "rgba(16, 185, 129, 0.02)" : "rgba(239, 68, 68, 0.03)",
                    }}
                  >
                    <td style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "#818cf8", fontFamily: "monospace" }}>
                      {studentIdFormatted}
                    </td>
                    <td style={{ padding: "0.9rem 1.25rem", color: "#f8fafc", fontWeight: 600 }}>
                      {st.name}
                    </td>
                    <td style={{ padding: "0.9rem 1rem", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          background: isPresent ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: isPresent ? "#34d399" : "#f87171",
                          border: isPresent ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "20px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      >
                        {isPresent ? <Check size={13} /> : <X size={13} />}
                        {st.status}
                      </span>
                    </td>

                    <td style={{ padding: "0.9rem 1rem", textAlign: "center" }}>
                      {!isPresent ? (
                        <span style={{ color: "#64748b", fontFamily: "monospace" }}>-</span>
                      ) : methodStr === "FACE" ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "#818cf8",
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          <ScanFace size={13} /> FACE
                        </span>
                      ) : methodStr === "BIOMETRIC" ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            background: "rgba(168, 85, 247, 0.15)",
                            color: "#c084fc",
                            border: "1px solid rgba(168, 85, 247, 0.3)",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          <Fingerprint size={13} /> BIOMETRIC
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            background: "rgba(255, 255, 255, 0.08)",
                            color: "#cbd5e1",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          <Edit3 size={13} /> MANUAL
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "0.9rem 1rem", textAlign: "center", fontFamily: "monospace", color: "#94a3b8", fontSize: "0.85rem" }}>
                      {markedTime}
                    </td>

                    {!sessionData.attendance_completed && (
                      <td style={{ padding: "0.9rem 1.25rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "3px", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(st.id)}
                            style={{
                              background: isPresent ? "#10b981" : "transparent",
                              color: isPresent ? "#fff" : "#94a3b8",
                              border: "none",
                              borderRadius: "6px",
                              padding: "0.3rem 0.65rem",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(st.id)}
                            style={{
                              background: !isPresent ? "#ef4444" : "transparent",
                              color: !isPresent ? "#fff" : "#94a3b8",
                              border: "none",
                              borderRadius: "6px",
                              padding: "0.3rem 0.65rem",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Live Counters & Submit Button */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "14px",
            padding: "1.25rem 1.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.25rem",
          }}
        >
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}>
                Present:
              </span>
              <span style={{ color: "#34d399", fontWeight: 800, fontSize: "1.4rem" }}>
                {presentCount}
              </span>
            </div>
            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}>
                Absent:
              </span>
              <span style={{ color: "#f87171", fontWeight: 800, fontSize: "1.4rem" }}>
                {absentCount}
              </span>
            </div>
            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}>
                Total:
              </span>
              <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: "1.4rem" }}>
                {totalCount}
              </span>
            </div>
          </div>

          {!sessionData.attendance_completed ? (
            <button
              type="button"
              id="btn-submit-attendance"
              disabled={submitting}
              onClick={handleSubmitAttendance}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                borderRadius: "10px",
                padding: "0.75rem 2rem",
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
              }}
            >
              {submitting ? "Submitting..." : "[ SUBMIT ATTENDANCE ]"}
            </button>
          ) : (
            <div style={{ color: "#34d399", fontWeight: 700, fontSize: "0.95rem" }}>
              ✓ Attendance submitted & locked for this session.
            </div>
          )}
        </div>

        {/* AFTER SUBMISSION SUCCESS MODAL */}
        <Modal
          isOpen={!!submissionSuccessData}
          onClose={() => {
            setSubmissionSuccessData(null);
            navigate(isTeacher ? "/teacher/timetable" : "/timetable");
          }}
          title="Attendance Completed"
        >
          {submissionSuccessData && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2 style={{ color: "#f8fafc", fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                ✓ Attendance submitted successfully.
              </h2>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  textAlign: "left",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.85rem",
                  fontSize: "0.9rem",
                }}
              >
                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Subject:</span>
                  <span style={{ color: "#f8fafc", fontWeight: 700 }}>{submissionSuccessData.subject}</span>
                </div>

                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Time:</span>
                  <span style={{ color: "#f8fafc", fontWeight: 700 }}>{submissionSuccessData.time}</span>
                </div>

                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Present:</span>
                  <span style={{ color: "#34d399", fontWeight: 800, fontSize: "1.1rem" }}>{submissionSuccessData.present}</span>
                </div>

                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Absent:</span>
                  <span style={{ color: "#f87171", fontWeight: 800, fontSize: "1.1rem" }}>{submissionSuccessData.absent}</span>
                </div>

                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.5rem" }}>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Total:</span>
                  <span style={{ color: "#f8fafc", fontWeight: 800 }}>{submissionSuccessData.total} Students</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmissionSuccessData(null);
                  navigate(isTeacher ? "/teacher/timetable" : "/timetable");
                }}
                style={{
                  marginTop: "0.5rem",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.7rem 1.5rem",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Return to Today's Timetable
              </button>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // =============================================================
  // RENDER: GENERAL ATTENDANCE VIEW (BY ROLE)
  // =============================================================
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* View Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span
            style={{
              background: "rgba(99, 102, 241, 0.2)",
              color: "#818cf8",
              padding: "0.2rem 0.6rem",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {isTeacher ? "Teacher Portal" : isStudent ? "Student Summary" : isHod ? "HOD Attendance Control" : "Admin Master View"}
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc", margin: "0.35rem 0 0" }}>
            {isStudent ? "My Attendance Record" : "Timetable Attendance Sessions"}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0.2rem 0 0" }}>
            {isStudent
              ? "Your attendance is calculated strictly from conducted timetable sessions."
              : "Every attendance session originates strictly from an active timetable entry."}
          </p>
        </div>

        <button
          onClick={fetchGeneralData}
          disabled={generalLoading}
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
          <RefreshCw size={15} className={generalLoading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* A. TEACHER VIEW: TODAY'S ASSIGNED TIMETABLE CLASSES           */}
      {/* ------------------------------------------------------------- */}
      {isTeacher && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            My Today's Classes
          </h2>

          {generalLoading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : todayClasses.length === 0 ? (
            <div style={{ padding: "2.5rem 1rem", textAlign: "center", background: "rgba(17, 24, 39, 0.6)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", color: "#94a3b8" }}>
              <Clock size={36} style={{ margin: "0 auto 0.5rem", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "0.95rem" }}>No classes scheduled for today.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
              {todayClasses.map((slot) => {
                const isCompleted = slot.attendance_completed;
                const timeDisplay = `${slot.start_time || "09:00"}–${slot.end_time || "10:00"}`;
                const currentDuration = getCurrentDuration(slot.start_time, slot.end_time);

                return (
                  <div
                    key={slot.id}
                    style={{
                      background: "rgba(17, 24, 39, 0.9)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#818cf8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          TODAY'S CLASS
                        </span>
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                          Room {slot.room_name || "Hall"}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "0.5rem" }}>
                        <div>
                          <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
                            Subject:
                          </span>
                          <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "1.1rem" }}>
                            {slot.subject_name}
                          </span>
                        </div>

                        <div>
                          <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
                            Time:
                          </span>
                          <span style={{ color: "#f8fafc", fontWeight: 600, fontSize: "0.95rem" }}>
                            {timeDisplay}
                          </span>
                        </div>

                        <div>
                          <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
                            Current Duration:
                          </span>
                          <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.95rem" }}>
                            {currentDuration}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.4rem",
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#34d399",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            padding: "0.6rem",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            textAlign: "center",
                          }}
                        >
                          <CheckCircle2 size={16} /> ✓ Attendance Completed
                        </div>
                      ) : (
                        <div>
                          <span style={{ display: "block", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.45rem" }}>
                            Attendance Method:
                          </span>
                          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                            <Link
                              to={`/attendance/session/${slot.id}?method=FACE`}
                              style={{
                                flex: 1,
                                textAlign: "center",
                                background: "rgba(99, 102, 241, 0.15)",
                                border: "1px solid rgba(99, 102, 241, 0.3)",
                                color: "#c7d2fe",
                                padding: "0.45rem 0.3rem",
                                borderRadius: "8px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <ScanFace size={13} /> [ FACE RECOGNITION ]
                            </Link>

                            <Link
                              to={`/attendance/session/${slot.id}?method=BIOMETRIC`}
                              style={{
                                flex: 1,
                                textAlign: "center",
                                background: "rgba(168, 85, 247, 0.15)",
                                border: "1px solid rgba(168, 85, 247, 0.3)",
                                color: "#e9d5ff",
                                padding: "0.45rem 0.3rem",
                                borderRadius: "8px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <Fingerprint size={13} /> [ BIOMETRIC ]
                            </Link>

                            <Link
                              to={`/attendance/session/${slot.id}?method=MANUAL`}
                              style={{
                                flex: 1,
                                textAlign: "center",
                                background: "rgba(255, 255, 255, 0.08)",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                color: "#f8fafc",
                                padding: "0.45rem 0.3rem",
                                borderRadius: "8px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <Edit3 size={13} /> [ MANUAL ]
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* B. STUDENT VIEW: TIMETABLE ATTENDANCE SUMMARY & PERCENTAGES   */}
      {/* ------------------------------------------------------------- */}
      {isStudent && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {studentSummary ? (
            <>
              {/* Overall Metrics Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  padding: "1.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1.5rem",
                }}
              >
                <div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                    {studentSummary.student_name} ({studentSummary.usn}) • Sem {studentSummary.semester}{studentSummary.section}
                  </div>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: "0.25rem 0" }}>
                    Overall Attendance: {studentSummary.overall_percentage}%
                  </h2>
                  <p style={{ color: studentSummary.overall_percentage >= 75 ? "#34d399" : "#f87171", fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>
                    {studentSummary.overall_percentage >= 75 ? "✓ Satisfies department 75% attendance threshold" : "⚠ Attendance Shortage Alert (<75%)"}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ color: "#94a3b8", fontSize: "0.75rem", display: "block" }}>Conducted Sessions</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f8fafc" }}>{studentSummary.total_sessions}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ color: "#94a3b8", fontSize: "0.75rem", display: "block" }}>Present</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34d399" }}>{studentSummary.present_sessions}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ color: "#94a3b8", fontSize: "0.75rem", display: "block" }}>Absent</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f87171" }}>{studentSummary.absent_sessions}</span>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div
                style={{
                  background: "rgba(17, 24, 39, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", fontWeight: 700, color: "#f8fafc" }}>
                  Subject-wise Timetable Breakdown
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", color: "#94a3b8" }}>
                      <th style={{ padding: "0.85rem 1.25rem" }}>Subject</th>
                      <th style={{ padding: "0.85rem 1.25rem" }}>Teacher</th>
                      <th style={{ padding: "0.85rem 1.25rem", textAlign: "center" }}>Scheduled Sessions</th>
                      <th style={{ padding: "0.85rem 1.25rem", textAlign: "center" }}>Present</th>
                      <th style={{ padding: "0.85rem 1.25rem", textAlign: "center" }}>Absent</th>
                      <th style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentSummary.subjects?.map((sub) => {
                      const isGood = sub.percentage >= 75;
                      return (
                        <tr key={sub.subject_id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                          <td style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#f8fafc" }}>
                            {sub.subject_name} {sub.subject_code ? `(${sub.subject_code})` : ""}
                          </td>
                          <td style={{ padding: "0.85rem 1.25rem", color: "#cbd5e1" }}>
                            {sub.teacher_name || "Teacher"}
                          </td>
                          <td style={{ padding: "0.85rem 1.25rem", textAlign: "center", color: "#cbd5e1" }}>
                            {sub.scheduled_sessions}
                          </td>
                          <td style={{ padding: "0.85rem 1.25rem", textAlign: "center", color: "#34d399", fontWeight: 700 }}>
                            {sub.present}
                          </td>
                          <td style={{ padding: "0.85rem 1.25rem", textAlign: "center", color: "#f87171", fontWeight: 700 }}>
                            {sub.absent}
                          </td>
                          <td style={{ padding: "0.85rem 1.25rem", textAlign: "right", fontWeight: 800, color: isGood ? "#34d399" : "#f87171" }}>
                            {sub.percentage}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <TableSkeleton rows={5} cols={6} />
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* C. HOD & ADMIN VIEW: CONDUCTED ATTENDANCE SESSIONS LOG       */}
      {/* ------------------------------------------------------------- */}
      {(isAdmin || isHod) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Filters Bar */}
          <div
            style={{
              background: "rgba(17, 24, 39, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            {isAdmin && (
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "0.55rem 0.85rem",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                }}
              >
                <option value="">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            )}

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.55rem 0.85rem",
                color: "#f8fafc",
                fontSize: "0.85rem",
              }}
            />

            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.55rem 0.85rem",
                color: "#f8fafc",
                fontSize: "0.85rem",
              }}
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>

            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.55rem 0.85rem",
                color: "#f8fafc",
                fontSize: "0.85rem",
              }}
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.55rem 0.85rem",
                color: "#f8fafc",
                fontSize: "0.85rem",
              }}
            >
              <option value="">All Subjects</option>
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject_name}
                </option>
              ))}
            </select>
          </div>

          {/* Conducted Sessions Table */}
          <div
            style={{
              background: "rgba(17, 24, 39, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            {generalLoading ? (
              <div style={{ padding: "1.5rem" }}>
                <TableSkeleton rows={6} cols={6} />
              </div>
            ) : conductedSessions.length === 0 ? (
              <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#94a3b8" }}>
                <CalendarCheck size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#f8fafc", margin: 0 }}>
                  No conducted attendance sessions found
                </h3>
                <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  Sessions will appear here once teachers submit attendance for their scheduled classes.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
                      <th style={{ padding: "0.85rem 1rem" }}>Date</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Time Slot</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Subject</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Teacher</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Class</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Room</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Present</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Absent</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conductedSessions.map((cs, idx) => (
                      <tr
                        key={`${cs.timetable_id}-${cs.date}-${idx}`}
                        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}
                      >
                        <td style={{ padding: "0.85rem 1rem", color: "#818cf8", fontWeight: 700 }}>
                          {cs.date}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#f8fafc", fontWeight: 600 }}>
                          {cs.time}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#f8fafc" }}>
                          {cs.subject_name}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#cbd5e1" }}>
                          {cs.teacher_name}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#cbd5e1" }}>
                          Sem {cs.semester} - {cs.section}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#94a3b8" }}>
                          {cs.room_name || "Hall"}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center", color: "#34d399", fontWeight: 700 }}>
                          {cs.present_count}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center", color: "#f87171", fontWeight: 700 }}>
                          {cs.absent_count}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                          <Link
                            to={`/attendance/session/${cs.timetable_id}`}
                            style={{
                              background: "rgba(99, 102, 241, 0.15)",
                              color: "#c7d2fe",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            View Roster
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
