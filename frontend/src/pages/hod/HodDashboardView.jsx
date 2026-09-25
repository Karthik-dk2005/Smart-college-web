import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Building,
  Award,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Lock,
} from "lucide-react";

export default function HodDashboardView() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [shortages, setShortages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeSuccess, setFinalizeSuccess] = useState(null);

  const fetchHodData = async () => {
    try {
      setLoading(true);
      const res = await api.getHodDashboard();
      setData(res);

      // Fetch attendance shortage students (< 75%)
      const studentsRes = await api.getStudents();
      if (studentsRes && studentsRes.students) {
        // filter students with low attendance
        const lowAtt = [];
        for (const s of studentsRes.students) {
          try {
            const att = await api.getStudentAttendanceReport(s.id);
            if (att && att.data && att.data.attendance_percentage < 75) {
              lowAtt.push({
                ...s,
                pct: att.data.attendance_percentage,
                attended: att.data.attended_classes,
                total: att.data.total_classes,
              });
            }
          } catch (e) {
            // ignore
          }
        }
        setShortages(lowAtt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHodData();
  }, []);

  const handleFinalizeMark = async (markId = 1) => {
    try {
      setFinalizing(true);
      setFinalizeSuccess(null);
      const res = await api.finalizeMark(markId);
      setFinalizeSuccess(`Assessment Mark #${markId} has been officially locked and finalized for audit!`);
    } catch (err) {
      alert("Error finalizing mark: " + err.message);
    } finally {
      setFinalizing(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  const stats = data?.statistics || {};

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Head of Department Executive Portal
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            {data?.department || "Department of Computer Science & Engineering"} • Governance, Shortage Detection & Marks Locking
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchHodData}>
          <RefreshCw size={14} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {finalizeSuccess && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#34d399",
            fontWeight: 600,
          }}
        >
          ✓ {finalizeSuccess}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Enrolled Students</span>
            <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.total_students || 0}</div>
          <div className="stat-footer">Undergraduate B.E. Cohort</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Faculty Strength</span>
            <div className="stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.total_teachers || 0}</div>
          <div className="stat-footer">Professors & Lecturers</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Department Attendance Rate</span>
            <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.department_attendance_rate || 0}%</div>
          <div className="stat-footer">Active GPS verified rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Available Lecture Halls/Labs</span>
            <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
              <Building size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.available_rooms || 0} / {stats.total_rooms || 0}</div>
          <div className="stat-footer">Turing & Babbage Blocks</div>
        </div>
      </div>

      {/* Marks Lock & Finalization Panel */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">
            <ShieldCheck size={18} color="#10b981" />
            <span>Academic Integrity & Marks Finalization</span>
          </h2>
          <span className="badge badge-purple">HOD / Admin Exclusive Authority</span>
        </div>

        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1rem" }}>
          Once internal assessment marks are finalized by HOD, they become strictly read-only and immutable for students and faculty.
        </p>

        <button
          className="btn btn-primary"
          onClick={() => handleFinalizeMark(1)}
          disabled={finalizing}
        >
          {finalizing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Locking Assessment for Official Audit...</span>
            </>
          ) : (
            <>
              <Lock size={16} />
              <span>Lock & Finalize Assessment Mark #1</span>
            </>
          )}
        </button>
      </div>

      {/* Attendance Shortage Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <AlertTriangle size={18} color="#ef4444" />
            <span>Attendance Shortage Watchlist (&lt; 75% Minimum Compliance)</span>
          </h2>
          <span className="badge badge-danger">{shortages.length} Students At Risk</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>USN</th>
                <th>Student Name</th>
                <th>Semester</th>
                <th>Classes Attended</th>
                <th>Total Classes</th>
                <th>Current %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shortages.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem", color: "#34d399" }}>
                    ✓ Excellent! All evaluated students currently meet or exceed the 75% mandatory VTU attendance requirement.
                  </td>
                </tr>
              ) : (
                shortages.map((st) => (
                  <tr key={st.id}>
                    <td style={{ fontWeight: 600 }}>{st.usn}</td>
                    <td>{st.full_name}</td>
                    <td>Sem {st.semester}</td>
                    <td>{st.attended}</td>
                    <td>{st.total}</td>
                    <td>
                      <strong style={{ color: "#f87171" }}>{st.pct}%</strong>
                    </td>
                    <td>
                      <span className="badge badge-danger">Exam Bar Notice</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
