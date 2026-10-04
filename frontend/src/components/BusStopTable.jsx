import React from "react";
import { Edit2, PowerOff, CheckCircle2, XCircle } from "lucide-react";

export default function BusStopTable({ stops, onEdit, onDelete, isAdmin }) {
  if (!stops || stops.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#94a3b8" }}>
        No bus stops registered for this route yet.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Order</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Stop Name</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Pickup Time</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Drop Time</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Coordinates</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Status</th>
            {isAdmin && <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {stops.map((stop) => {
            const isActive = stop.status === "active";
            return (
              <tr
                key={stop.id}
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#818cf8" }}>
                  #{stop.stop_order}
                </td>
                <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#f8fafc" }}>
                  {stop.stop_name}
                </td>
                <td style={{ padding: "0.85rem 1rem", color: "#34d399", fontWeight: 600 }}>
                  {stop.pickup_time || "Not provided"}
                </td>
                <td style={{ padding: "0.85rem 1rem", color: "#f59e0b", fontWeight: 600 }}>
                  {stop.drop_time || "Not provided"}
                </td>
                <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontSize: "0.78rem" }}>
                  {stop.latitude && stop.latitude !== "Not provided" && stop.longitude && stop.longitude !== "Not provided"
                    ? `${stop.latitude}, ${stop.longitude}`
                    : "Not provided"}
                </td>
                <td style={{ padding: "0.85rem 1rem" }}>
                  <span
                    style={{
                      background: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                      color: isActive ? "#34d399" : "#f87171",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      border: `1px solid ${isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    }}
                  >
                    {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {stop.status || "active"}
                  </span>
                </td>

                {isAdmin && (
                  <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                      <button
                        title="Edit Stop"
                        onClick={() => onEdit && onEdit(stop)}
                        style={{
                          background: "rgba(99, 102, 241, 0.1)",
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                          borderRadius: "6px",
                          padding: "0.4rem",
                          color: "#818cf8",
                          cursor: "pointer",
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      {isActive && (
                        <button
                          title="Deactivate Stop"
                          onClick={() => onDelete && onDelete(stop)}
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "6px",
                            padding: "0.4rem",
                            color: "#f87171",
                            cursor: "pointer",
                          }}
                        >
                          <PowerOff size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
