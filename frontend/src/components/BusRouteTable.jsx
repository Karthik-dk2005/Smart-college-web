import React from "react";
import { Link } from "react-router-dom";
import { Eye, Edit2, PowerOff, CheckCircle2, XCircle } from "lucide-react";

export default function BusRouteTable({ routes, onDeactivate, isAdmin }) {
  if (!routes || routes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
        No bus routes found matching your criteria.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94a3b8" }}>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Route</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Bus Number</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Driver</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Start Point</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>End Point</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Departure</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Arrival</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Status</th>
            <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r) => {
            const isActive = r.status === "active";
            return (
              <tr
                key={r.id}
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#818cf8" }}>
                  Route {r.route_number}
                </td>
                <td style={{ padding: "0.85rem 1rem", color: "#f8fafc", fontWeight: 600 }}>
                  {r.bus_number || "Not provided"}
                </td>
                <td style={{ padding: "0.85rem 1rem", color: "#cbd5e1" }}>
                  <div>{r.driver_name || "Not provided"}</div>
                  {r.driver_phone && r.driver_phone !== "Not provided" && (
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{r.driver_phone}</div>
                  )}
                </td>
                <td style={{ padding: "0.85rem 1rem", color: "#cbd5e1" }}>
                  {r.start_point || "Not provided"}
                </td>
                <td style={{ padding: "0.85rem 1rem", color: "#cbd5e1" }}>
                  {r.end_point || "Not provided"}
                </td>
                <td style={{ padding: "0.85rem 1rem", color: "#94a3b8" }}>
                  {r.departure_time || "Not provided"}
                </td>
                <td style={{ padding: "0.85rem 1rem", color: "#94a3b8" }}>
                  {r.arrival_time || "Not provided"}
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
                    {r.status || "active"}
                  </span>
                </td>
                <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                    <Link
                      to={`/admin/buses/${r.id}`}
                      title="View Route Details"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        padding: "0.4rem",
                        color: "#94a3b8",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <Eye size={15} />
                    </Link>

                    {isAdmin && (
                      <>
                        <Link
                          to={`/admin/buses/${r.id}/edit`}
                          title="Edit Route"
                          style={{
                            background: "rgba(99, 102, 241, 0.1)",
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                            borderRadius: "6px",
                            padding: "0.4rem",
                            color: "#818cf8",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <Edit2 size={15} />
                        </Link>
                        {isActive && (
                          <button
                            title="Deactivate Route"
                            onClick={() => onDeactivate && onDeactivate(r)}
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: "6px",
                              padding: "0.4rem",
                              color: "#f87171",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <PowerOff size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
