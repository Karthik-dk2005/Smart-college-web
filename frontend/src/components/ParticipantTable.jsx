import React, { useState } from "react";
import { Check, X, Search, Filter, UserCheck, UserX, Download, Clock } from "lucide-react";
import { eventsApi } from "../api";
import { useToast } from "./Toast";

export default function ParticipantTable({
  eventId,
  participants = [],
  onRefresh,
  readOnly = false,
}) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  const handleMarkAttendance = async (userId, newStatus) => {
    try {
      setUpdatingId(userId);
      await eventsApi.markAttendance(eventId, {
        user_id: userId,
        attendance_status: newStatus,
      });
      showToast(`Marked ${newStatus} successfully.`, "success");
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || "Failed to update attendance", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAll = async (newStatus) => {
    if (!window.confirm(`Mark all visible registered participants as ${newStatus}?`)) return;
    try {
      const items = filteredParticipants
        .filter((p) => p.registration_status === "Registered")
        .map((p) => ({
          user_id: p.user_id,
          attendance_status: newStatus,
        }));

      if (items.length === 0) {
        showToast("No active participants to mark.", "info");
        return;
      }

      await eventsApi.markAttendance(eventId, { attendance: items });
      showToast(`All marked as ${newStatus}!`, "success");
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || "Failed to update attendance in bulk", "error");
    }
  };

  // Filter logic
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      (p.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.student_usn || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.department_name || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Present" && p.attendance_status === "Present") ||
      (statusFilter === "Absent" && p.attendance_status === "Absent") ||
      (statusFilter === "Not Marked" && (p.attendance_status === "Not Marked" || !p.attendance_status));

    return matchesSearch && matchesStatus;
  });

  const presentCount = participants.filter((p) => p.attendance_status === "Present").length;
  const absentCount = participants.filter((p) => p.attendance_status === "Absent").length;
  const notMarkedCount = participants.filter(
    (p) => !p.attendance_status || p.attendance_status === "Not Marked"
  ).length;

  const exportCSV = () => {
    if (participants.length === 0) return;
    const headers = ["Student Name", "Student ID / USN", "Email", "Department", "Semester", "Section", "Registration Status", "Attendance Status"];
    const rows = participants.map((p) => [
      `"${p.user_name || ""}"`,
      `"${p.student_usn || ""}"`,
      `"${p.user_email || ""}"`,
      `"${p.department_name || ""}"`,
      `"${p.semester || ""}"`,
      `"${p.section || ""}"`,
      `"${p.registration_status || ""}"`,
      `"${p.attendance_status || "Not Marked"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event_${eventId}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Metrics Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "12px",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Total Registrations</span>
          <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", marginTop: "0.2rem" }}>
            {participants.length}
          </span>
        </div>

        <div
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "12px",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#6ee7b7" }}>Marked Present</span>
          <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#34d399", marginTop: "0.2rem" }}>
            {presentCount}
          </span>
        </div>

        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "12px",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#fca5a5" }}>Marked Absent</span>
          <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f87171", marginTop: "0.2rem" }}>
            {absentCount}
          </span>
        </div>

        <div
          style={{
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: "12px",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#fde68a" }}>Not Marked</span>
          <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fbbf24", marginTop: "0.2rem" }}>
            {notMarkedCount}
          </span>
        </div>
      </div>

      {/* Filter / Search & Bulk Actions Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
          padding: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "260px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              padding: "0.5rem 0.85rem",
              flex: 1,
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by student name, USN, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#f8fafc",
                fontSize: "0.85rem",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.55rem 0.85rem",
              background: "#1f2937",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "0.85rem",
              outline: "none",
            }}
          >
            <option value="All">All Attendance</option>
            <option value="Present">Present Only</option>
            <option value="Absent">Absent Only</option>
            <option value="Not Marked">Not Marked Only</option>
          </select>
        </div>

        {/* Bulk attendance buttons & CSV export */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {!readOnly && (
            <>
              <button
                onClick={() => handleMarkAll("Present")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  color: "#34d399",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <UserCheck size={14} /> Mark All Present
              </button>

              <button
                onClick={() => handleMarkAll("Absent")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: "#f87171",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <UserX size={14} /> Mark All Absent
              </button>
            </>
          )}

          <button
            onClick={exportCSV}
            title="Export CSV"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.5rem 0.85rem",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#cbd5e1",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Participants Table */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              <th style={{ padding: "0.85rem 1rem" }}>Student ID / USN</th>
              <th style={{ padding: "0.85rem 1rem" }}>Student Name</th>
              <th style={{ padding: "0.85rem 1rem" }}>Department</th>
              <th style={{ padding: "0.85rem 1rem" }}>Sem / Sec</th>
              <th style={{ padding: "0.85rem 1rem" }}>Registration Status</th>
              <th style={{ padding: "0.85rem 1rem" }}>Attendance Status</th>
              {!readOnly && <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
                  No participants matching criteria.
                </td>
              </tr>
            ) : (
              filteredParticipants.map((p) => {
                const isPresent = p.attendance_status === "Present";
                const isAbsent = p.attendance_status === "Absent";
                const isNotMarked = !p.attendance_status || p.attendance_status === "Not Marked";

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#818cf8" }}>
                      {p.student_usn || "N/A"}
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: 600, color: "#f8fafc" }}>{p.user_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{p.user_email}</div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem", color: "#cbd5e1" }}>
                      {p.department_name || "General"}
                    </td>

                    <td style={{ padding: "0.85rem 1rem", color: "#94a3b8" }}>
                      {p.semester ? `Sem ${p.semester}` : "-"} {p.section ? `(${p.section})` : ""}
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "20px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background:
                            p.registration_status === "Registered"
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                          color: p.registration_status === "Registered" ? "#34d399" : "#f87171",
                        }}
                      >
                        {p.registration_status}
                      </span>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: isPresent
                            ? "rgba(16, 185, 129, 0.2)"
                            : isAbsent
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(245, 158, 11, 0.15)",
                          color: isPresent ? "#34d399" : isAbsent ? "#f87171" : "#fbbf24",
                        }}
                      >
                        {isPresent && <Check size={12} />}
                        {isAbsent && <X size={12} />}
                        {isNotMarked && <Clock size={12} />}
                        {p.attendance_status || "Not Marked"}
                      </span>
                    </td>

                    {!readOnly && (
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                          <button
                            onClick={() => handleMarkAttendance(p.user_id, "Present")}
                            disabled={updatingId === p.user_id}
                            title="Mark Present"
                            style={{
                              background: isPresent ? "#10b981" : "rgba(16, 185, 129, 0.15)",
                              border: "1px solid rgba(16, 185, 129, 0.4)",
                              color: isPresent ? "#ffffff" : "#34d399",
                              padding: "0.35rem 0.65rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Check size={13} /> Present
                          </button>

                          <button
                            onClick={() => handleMarkAttendance(p.user_id, "Absent")}
                            disabled={updatingId === p.user_id}
                            title="Mark Absent"
                            style={{
                              background: isAbsent ? "#ef4444" : "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              color: isAbsent ? "#ffffff" : "#f87171",
                              padding: "0.35rem 0.65rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <X size={13} /> Absent
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
