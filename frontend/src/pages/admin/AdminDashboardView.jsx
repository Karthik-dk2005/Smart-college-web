import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Users,
  ShieldCheck,
  Building,
  Bus,
  Loader2,
  RefreshCw,
  PlusCircle,
  FileText,
  Clock,
} from "lucide-react";

export default function AdminDashboardView() {
  const [data, setData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);

  // New room form
  const [roomNumber, setRoomNumber] = useState("");
  const [building, setBuilding] = useState("Turing Block");
  const [capacity, setCapacity] = useState(60);
  const [roomType, setRoomType] = useState("Classroom");

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      setData(res);

      const logsRes = await api.getAuditLogs();
      if (Array.isArray(logsRes)) {
        setAuditLogs(logsRes);
      }

      const roomsRes = await api.getRooms();
      if (roomsRes && roomsRes.rooms) {
        setRooms(roomsRes.rooms);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.createRoom({
        room_number: roomNumber,
        building,
        floor: "2nd Floor",
        room_type: roomType,
        capacity: parseInt(capacity),
        is_available: true,
        status: "Available",
      });
      setShowAddRoom(false);
      setRoomNumber("");
      fetchAdminData();
    } catch (err) {
      alert("Failed to create room: " + err.message);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Loader2 size={32} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  const userStats = data?.user_statistics || {};
  const facilities = data?.facilities || {};

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            Campus Administration & Governance
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Institution Operations, User Access Control, Infrastructure & Immutable Security Audit Log
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchAdminData}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Registered Users</span>
            <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">{userStats.total_users || 0}</div>
          <div className="stat-footer">
            {userStats.students} Students • {userStats.teachers} Teachers • {userStats.hods} HODs
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Campus Lecture Rooms & Labs</span>
            <div className="stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
              <Building size={20} />
            </div>
          </div>
          <div className="stat-value">{facilities.available_rooms} / {facilities.total_rooms}</div>
          <div className="stat-footer">Ready for class allocation</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Transit Fleet</span>
            <div className="stat-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
              <Bus size={20} />
            </div>
          </div>
          <div className="stat-value">{facilities.active_bus_routes || 1}</div>
          <div className="stat-footer">Routes operational today</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Security Audit Records</span>
            <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="stat-value">{auditLogs.length}</div>
          <div className="stat-footer">Immutable forensic events</div>
        </div>
      </div>

      {/* Facilities & Room Allocation */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h2 className="card-title">
            <Building size={18} color="#06b6d4" />
            <span>Campus Classrooms & Lab Facilities</span>
          </h2>
          <button className="btn btn-primary" onClick={() => setShowAddRoom(true)}>
            <PlusCircle size={14} />
            <span>Add Facility Room</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Building Block</th>
                <th>Facility Type</th>
                <th>Seating Capacity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, color: "#fff" }}>{r.room_number}</td>
                  <td>{r.building}</td>
                  <td>
                    <span className="badge badge-purple">{r.room_type}</span>
                  </td>
                  <td>{r.capacity} Seats</td>
                  <td>
                    <span className={`badge ${r.is_available ? "badge-success" : "badge-danger"}`}>
                      {r.status || (r.is_available ? "Available" : "Occupied")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <ShieldCheck size={18} color="#10b981" />
            <span>System Audit Trail (Module 19 & 23)</span>
          </h2>
          <span className="badge badge-info">{auditLogs.length} Events Recorded</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Module</th>
                <th>Action Taken</th>
                <th>Record ID</th>
                <th>Details</th>
                <th>Origin IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 15).map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} color="#64748b" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{log.module}</span>
                    </td>
                    <td>
                      <strong style={{ color: "#fff" }}>{log.action}</strong>
                    </td>
                    <td>#{log.record_id || "N/A"}</td>
                    <td style={{ maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {log.details || "System operation executed"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#38bdf8" }}>
                      {log.ip_address}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="modal-overlay" onClick={() => setShowAddRoom(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Add Campus Room</h3>
              <button className="btn-icon" onClick={() => setShowAddRoom(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. TB-305"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Building Block</label>
                <input
                  type="text"
                  className="form-control"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Facility Type</label>
                <select
                  className="form-control"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                >
                  <option value="Classroom">Classroom</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Auditorium">Auditorium</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Seating Capacity</label>
                <input
                  type="number"
                  className="form-control"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem" }}>
                Save Facility Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
