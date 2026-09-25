import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  CalendarCheck,
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  Building,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react";

export default function TeacherAttendanceView() {
  const [sessions, setSessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedSessionStudents, setSelectedSessionStudents] = useState(null);
  const [selectedSessionCode, setSelectedSessionCode] = useState("");

  // Form state
  const [subjectId, setSubjectId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dash = await api.getTeacherDashboard();
      if (dash && dash.attendance_sessions) {
        setSessions(dash.attendance_sessions);
      }
      if (dash && dash.subjects) {
        setSubjects(dash.subjects);
        if (dash.subjects.length > 0 && !subjectId) {
          setSubjectId(dash.subjects[0].id);
        }
      }

      const roomsRes = await api.getRooms();
      if (roomsRes && roomsRes.rooms) {
        setRooms(roomsRes.rooms);
        if (roomsRes.rooms.length > 0 && !roomId) {
          setRoomId(roomsRes.rooms[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreating(true);
    setFeedback(null);

    try {
      const res = await api.createAttendanceSession({
        subject_id: parseInt(subjectId) || 1,
        room_id: parseInt(roomId) || 1,
        start_time: startTime,
        end_time: endTime,
      });

      if (res && res.session) {
        setFeedback({
          success: true,
          message: `Attendance Session ${res.session.session_id} created successfully! Students can now mark attendance within 300m radius.`,
        });
        fetchData();
      }
    } catch (err) {
      setFeedback({
        success: false,
        message: err.message || "Failed to create attendance session.",
      });
    } finally {
      setCreating(false);
    }
  };

  const viewSessionStudents = async (sessionNumericId, sessionCode) => {
    try {
      setSelectedSessionCode(sessionCode);
      const res = await api.getSessionStudents(sessionNumericId);
      if (res && res.attendances) {
        setSelectedSessionStudents(res.attendances);
      }
    } catch (err) {
      alert("Could not load attendee roster: " + err.message);
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Faculty Attendance Sessions Manager
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Create Unique Class Session Tokens • Live Geofence Roster & Check-ins
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            background: feedback.success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: feedback.success ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            color: feedback.success ? "#34d399" : "#f87171",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Create Session Form */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <h2 className="card-title">
            <PlusCircle size={18} color="#6366f1" />
            <span>Open New Class Attendance Session</span>
          </h2>
        </div>

        <form onSubmit={handleCreateSession} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select
              className="form-control"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Classroom / Lab</label>
            <select
              className="form-control"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} ({r.room_type}, Cap: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input
              type="text"
              className="form-control"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="09:00"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Time</label>
            <input
              type="text"
              className="form-control"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="10:00"
              required
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: "1.25rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem" }}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Opening Session...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Generate Active Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Conducted Sessions Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <CalendarCheck size={18} color="#10b981" />
            <span>Attendance Sessions History</span>
          </h2>
          <span className="badge badge-info">{sessions.length} Sessions Logged</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Numeric ID</th>
                <th>Unique Session Code</th>
                <th>Course / Subject</th>
                <th>Venue</th>
                <th>Timing</th>
                <th>Attendees</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                    No attendance sessions created yet. Fill out the form above to open an active session.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td>
                      <span className="badge badge-purple" style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {s.session_id}
                      </span>
                    </td>
                    <td>{s.subject}</td>
                    <td>Room {s.room}</td>
                    <td>{s.timing}</td>
                    <td>
                      <strong>{s.attendee_count}</strong> Students
                    </td>
                    <td>
                      <span className={`badge ${s.status === "ACTIVE" ? "badge-success" : "badge-info"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                        onClick={() => viewSessionStudents(s.id, s.session_id)}
                      >
                        <Eye size={12} />
                        <span>Roster</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendee Roster Modal */}
      {selectedSessionStudents && (
        <div className="modal-overlay" onClick={() => setSelectedSessionStudents(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                  Attendee Roster: {selectedSessionCode}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Verified students present in this class session
                </span>
              </div>
              <button
                className="btn-icon"
                onClick={() => setSelectedSessionStudents(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {selectedSessionStudents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  No students have checked in to this session yet.
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>USN</th>
                      <th>Student Name</th>
                      <th>Distance</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSessionStudents.map((att) => (
                      <tr key={att.id}>
                        <td style={{ fontWeight: 600 }}>{att.usn}</td>
                        <td>{att.student_name}</td>
                        <td>{att.distance_meters ? `${att.distance_meters}m` : "Verified"}</td>
                        <td>{att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString() : "N/A"}</td>
                        <td>
                          <span className="badge badge-success">{att.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
