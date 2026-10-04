import React from "react";
import { Bus, MapPin, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function StudentBusCard({ assignment, loading = false }) {
  if (loading) {
    return (
      <div
        style={{
          background: "rgba(17, 24, 39, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "2rem",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        Loading your bus transit details...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div
        style={{
          background: "rgba(17, 24, 39, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "3rem 2rem",
          textAlign: "center",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#818cf8",
            margin: "0 auto 1.25rem",
          }}
        >
          <Bus size={28} />
        </div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.5rem" }}>
          MY BUS
        </h3>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
          No bus route has been assigned to you.
        </p>
        <p style={{ color: "#64748b", fontSize: "0.82rem", marginTop: "0.5rem" }}>
          Contact your department transport coordinator or administration to register for college transit.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.8)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        borderRadius: "16px",
        padding: "2rem",
        maxWidth: "640px",
        margin: "0 auto",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8",
            }}
          >
            <Bus size={26} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>
              Allocated Transit
            </span>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
              MY BUS
            </h2>
          </div>
        </div>

        <span
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            color: "#34d399",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "0.3rem 0.75rem",
            borderRadius: "20px",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          <CheckCircle2 size={13} />
          Active
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "10px" }}>
          <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
            Route:
          </span>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
            {assignment.route_name || `Bus Route ${assignment.route_number || "Not provided"}`}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.85rem 1rem", borderRadius: "10px" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
              Bus Number:
            </span>
            <span style={{ fontWeight: 600, color: "#f8fafc" }}>
              {assignment.bus_number || "Not provided"}
            </span>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.85rem 1rem", borderRadius: "10px" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
              Pickup Stop:
            </span>
            <span style={{ fontWeight: 600, color: "#f8fafc" }}>
              {assignment.stop_name || "Not provided"}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.85rem 1rem", borderRadius: "10px" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
              Pickup Time:
            </span>
            <span style={{ fontWeight: 600, color: "#34d399" }}>
              {assignment.pickup_time || "Not provided"}
            </span>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.85rem 1rem", borderRadius: "10px" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
              Drop Time:
            </span>
            <span style={{ fontWeight: 600, color: "#f59e0b" }}>
              {assignment.drop_time || "Not provided"}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.85rem 1rem", borderRadius: "10px" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
              Driver:
            </span>
            <span style={{ fontWeight: 600, color: "#f8fafc" }}>
              {assignment.driver_name || "Not provided"}
            </span>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.85rem 1rem", borderRadius: "10px" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
              Driver Contact:
            </span>
            <span style={{ fontWeight: 600, color: "#cbd5e1" }}>
              {assignment.driver_phone || "Not provided"}
            </span>
          </div>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.85rem 1rem", borderRadius: "10px" }}>
          <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
            Status:
          </span>
          <span style={{ fontWeight: 600, color: "#34d399" }}>
            Active ({assignment.transport_status || "Using Bus"})
          </span>
        </div>
      </div>
    </div>
  );
}
