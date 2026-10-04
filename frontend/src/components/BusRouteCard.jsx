import React from "react";
import { Link } from "react-router-dom";
import { Bus, MapPin, Clock, ArrowRight, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";

export default function BusRouteCard({ route, isAdmin }) {
  const isActive = route.status === "active";

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "14px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div>
        {/* Header: Route Badge & Status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <Bus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>
                Route {route.route_number}
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                {route.bus_number && route.bus_number !== "Not provided" ? route.bus_number : "Bus: Not provided"}
              </span>
            </div>
          </div>

          <span
            style={{
              padding: "0.25rem 0.65rem",
              borderRadius: "20px",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              background: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: isActive ? "#34d399" : "#f87171",
              border: `1px solid ${isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            }}
          >
            {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {route.status || "active"}
          </span>
        </div>

        {/* Route Path: Start -> End */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "10px",
            padding: "0.75rem",
            marginBottom: "0.85rem",
            fontSize: "0.82rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#cbd5e1" }}>
            <MapPin size={14} color="#818cf8" />
            <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>From:</span>
            <span style={{ fontWeight: 600, color: "#f8fafc" }}>{route.start_point || "Not provided"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#cbd5e1", marginTop: "0.35rem" }}>
            <MapPin size={14} color="#34d399" />
            <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>To:</span>
            <span style={{ fontWeight: 600, color: "#f8fafc" }}>{route.end_point || "Campus Main Gate"}</span>
          </div>
        </div>

        {/* Timings */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.78rem", color: "#94a3b8", marginBottom: "0.85rem" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.4rem 0.6rem", borderRadius: "6px" }}>
            <span style={{ display: "block", fontSize: "0.68rem", color: "#64748b" }}>Departure</span>
            <span style={{ color: "#f8fafc", fontWeight: 600 }}>{route.departure_time || "Not provided"}</span>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.4rem 0.6rem", borderRadius: "6px" }}>
            <span style={{ display: "block", fontSize: "0.68rem", color: "#64748b" }}>Arrival</span>
            <span style={{ color: "#f8fafc", fontWeight: 600 }}>{route.arrival_time || "Not provided"}</span>
          </div>
        </div>
      </div>

      {/* Footer Details Link */}
      <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
          {route.stops_count || 0} Stops Registered
        </span>
        <Link
          to={`/admin/buses/${route.id}`}
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#818cf8",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            textDecoration: "none",
          }}
        >
          View Route <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
