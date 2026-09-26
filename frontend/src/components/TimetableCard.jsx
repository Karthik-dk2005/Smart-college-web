import React from "react";
import { Clock, MapPin, User, Edit2, Trash2, BookOpen, Layers } from "lucide-react";

export default function TimetableCard({ slot, onEdit, onDelete, canModify = false }) {
  if (!slot) return null;

  const isLab = slot.timetable_type === "lab" || slot.subject_code?.includes("L");
  const isPractical = slot.timetable_type === "practical" || slot.subject_code?.includes("P");

  return (
    <div
      style={{
        background: isLab
          ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))"
          : isPractical
          ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))"
          : "rgba(30, 41, 59, 0.85)",
        borderLeft: isLab
          ? "4px solid #38bdf8"
          : isPractical
          ? "4px solid #a855f7"
          : "4px solid #3b82f6",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        padding: "1rem",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        position: "relative",
      }}
      className="timetable-card-hover"
    >
      {/* Top Row: Time & Badges */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#38bdf8", fontWeight: "600", fontSize: "0.85rem" }}>
          <Clock size={14} />
          <span>{slot.start_time} - {slot.end_time}</span>
        </div>

        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
          {slot.subject_code && (
            <span
              style={{
                fontSize: "0.7rem",
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                fontWeight: "700",
                letterSpacing: "0.5px",
              }}
            >
              {slot.subject_code}
            </span>
          )}
          {isLab && (
            <span
              style={{
                fontSize: "0.68rem",
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                background: "rgba(14, 165, 233, 0.2)",
                color: "#38bdf8",
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              LAB
            </span>
          )}
          {isPractical && (
            <span
              style={{
                fontSize: "0.68rem",
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                background: "rgba(168, 85, 247, 0.2)",
                color: "#c084fc",
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              PROJECT
            </span>
          )}
        </div>
      </div>

      {/* Subject Name */}
      <div style={{ fontWeight: "700", fontSize: "1rem", color: "#f8fafc", lineHeight: "1.3" }}>
        {slot.subject_name}
      </div>

      {/* Teacher Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#cbd5e1", fontSize: "0.85rem" }}>
        <span style={{ fontSize: "1rem" }}>👨‍🏫</span>
        <span style={{ fontWeight: "500" }}>{slot.teacher_name}</span>
      </div>

      {/* Room & Class Badge Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.3rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#94a3b8", fontSize: "0.82rem" }}>
          <MapPin size={13} style={{ color: "#f59e0b" }} />
          <span style={{ fontWeight: "600", color: "#e2e8f0" }}>{slot.room_name || "Room TBD"}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {slot.semester && slot.section && (
            <span
              style={{
                fontSize: "0.72rem",
                padding: "0.15rem 0.4rem",
                borderRadius: "6px",
                background: "rgba(100, 116, 139, 0.2)",
                color: "#cbd5e1",
              }}
            >
              Sem {slot.semester}-{slot.section}
            </span>
          )}

          {/* Action buttons */}
          {canModify && (
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(slot)}
                  style={{
                    background: "rgba(59, 130, 246, 0.15)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    color: "#60a5fa",
                    padding: "0.25rem 0.45rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    fontSize: "0.75rem",
                  }}
                  title="Edit entry"
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(slot)}
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#f87171",
                    padding: "0.25rem 0.45rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    fontSize: "0.75rem",
                  }}
                  title="Delete entry"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
