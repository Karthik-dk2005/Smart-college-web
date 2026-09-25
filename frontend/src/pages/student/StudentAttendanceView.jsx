import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  CalendarCheck,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Search,
} from "lucide-react";

export default function StudentAttendanceView() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [sessionId, setSessionId] = useState("1");
  const [statusMessage, setStatusMessage] = useState(null);
  const [gpsCoordinates, setGpsCoordinates] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.getMyAttendance();
      if (res && res.report) {
        setReport(res.report);
      }
    } catch (err) {
      console.error("Attendance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleMarkAttendance = () => {
    setStatusMessage(null);
    setMarking(true);

    if (!navigator.geolocation) {
      setStatusMessage({
        success: false,
        text: "Geolocation is not supported by your browser.",
      });
      setMarking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setGpsCoordinates({ lat, lon });

        try {
          const res = await api.markAttendance({
            sessionId: parseInt(sessionId) || 1,
            latitude: lat,
            longitude: lon,
            deviceVerified: true,
          });

          if (res.success) {
            setStatusMessage({
              success: true,
              text: `Location Verified ✓ Attendance Marked Successfully ✓`,
              distance: res.distance_meters,
            });
            fetchAttendance(); // refresh records
          } else {
            setStatusMessage({
              success: false,
              text: res.message || "You are outside the college attendance area",
              distance: res.distance_meters,
            });
          }
        } catch (err) {
          setStatusMessage({
            success: false,
            text: err.message || "Attendance failed. Please check active session.",
          });
        } finally {
          setMarking(false);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setStatusMessage({
          success: false,
          text: `GPS Permission Denied / Error: ${error.message}`,
        });
        setMarking(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (loading && !report) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  const records = report?.records || [];
  const pct = report?.attendance_percentage || 0;

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            My Attendance Register
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Automated Server-Side GPS Geofence Verification & Compliance Engine
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchAttendance}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Geofence Live Marking Banner */}
      <div className="geofence-banner">
        <div className="geofence-status">
          <div className="geofence-radar">
            <MapPin size={24} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
              Live GPS Geofence Attendance
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "2px" }}>
              Institution Boundary: <strong>300 meters</strong> around Campus Center (12.1837° N, 76.6942° E)
            </div>
            {gpsCoordinates && (
              <div style={{ fontSize: "0.75rem", color: "#38bdf8", marginTop: "4px" }}>
                Acquired Device Coordinates: {gpsCoordinates.lat.toFixed(6)}° N, {gpsCoordinates.lon.toFixed(6)}° E
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <input
            type="number"
            className="form-control"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Session ID (e.g. 1)"
            style={{ width: "140px" }}
          />

          <button
            className="btn btn-success"
            onClick={handleMarkAttendance}
            disabled={marking}
            style={{ whiteSpace: "nowrap" }}
          >
            {marking ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Checking Geofence...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>MARK ATTENDANCE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Feedback Message */}
      {statusMessage && (
        <div
          style={{
            padding: "1rem 1.5rem",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: statusMessage.success
              ? "rgba(16, 185, 129, 0.15)"
              : "rgba(239, 68, 68, 0.15)",
            border: statusMessage.success
              ? "1px solid rgba(16, 185, 129, 0.3)"
              : "1px solid rgba(239, 68, 68, 0.3)",
            color: statusMessage.success ? "#34d399" : "#f87171",
          }}
        >
          {statusMessage.success ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{statusMessage.text}</div>
            {statusMessage.distance !== undefined && (
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
                Distance from college center: <strong>{statusMessage.distance} meters</strong> (Maximum permitted: 300m)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aggregate Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: "2rem" }}>
        <div className="stat-card">
          <div className="stat-label">Total Classes Conducted</div>
          <div className="stat-value">{report?.total_classes || 0}</div>
          <div className="stat-footer">Cumulative semester sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Classes Present</div>
          <div className="stat-value" style={{ color: "#34d399" }}>
            {report?.attended_classes || 0}
          </div>
          <div className="stat-footer">Verified check-ins</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Classes Absent</div>
          <div className="stat-value" style={{ color: "#f87171" }}>
            {report?.absent_classes || 0}
          </div>
          <div className="stat-footer">Missed sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Attendance Percentage</div>
          <div className="stat-value" style={{ color: pct >= 75 ? "#34d399" : "#f87171" }}>
            {pct}%
          </div>
          <div className="stat-footer">
            {pct >= 75 ? (
              <span style={{ color: "#34d399" }}>✓ Eligible for Semester End Exams</span>
            ) : (
              <span style={{ color: "#f87171" }}>⚠ Shortage Alert (Below 75% minimum)</span>
            )}
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <CalendarCheck size={18} color="#6366f1" />
            <span>Attendance Check-in Records</span>
          </h2>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Showing {records.length} total entries
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Session ID</th>
                <th>Check-in Timestamp</th>
                <th>Distance (Meters)</th>
                <th>Verification Protocol</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    No attendance records logged yet. Enter active session ID and click "Mark Attendance".
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>
                      <span className="badge badge-purple">Session #{r.session_id}</span>
                    </td>
                    <td>{r.check_in_time ? new Date(r.check_in_time).toLocaleString() : "N/A"}</td>
                    <td>{r.distance_meters ? `${r.distance_meters}m` : "Verified"}</td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#38bdf8" }}>
                        {r.verification_method || "LIVE_GPS_GEOFENCE_VERIFIED"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.status === "PRESENT" ? "badge-success" : "badge-danger"}`}>
                        {r.status}
                      </span>
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
