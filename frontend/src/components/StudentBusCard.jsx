import React from "react";
import CollegeLogo from "./CollegeLogo";
import {
  Bus,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  User,
  ShieldCheck,
  Navigation,
} from "lucide-react";

export default function StudentBusCard({ assignment, loading = false }) {
  if (loading) {
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "18px",
          padding: "3rem 2rem",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        <div style={{ display: "inline-block", animation: "spin 1s linear infinite", marginBottom: "1rem" }}>
          <Bus size={32} style={{ color: "#6366f1" }} />
        </div>
        <p style={{ margin: 0, fontWeight: 600 }}>Loading your college transit pass...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "18px",
          padding: "3rem 2rem",
          textAlign: "center",
          maxWidth: "640px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <div style={{ background: "#ffffff", padding: "6px 14px", borderRadius: "12px", display: "inline-flex", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
            <CollegeLogo size="sm" style={{ height: "48px", width: "auto" }} />
          </div>
        </div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.5rem" }}>
          STUDENT CAMPUS TRANSIT
        </h3>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
          No bus route is currently registered to your student ID.
        </p>
        <p style={{ color: "#64748b", fontSize: "0.82rem", marginTop: "0.75rem" }}>
          Please contact the MIT Thandavapura Transport Office or CSE Department Coordinator to activate your campus bus pass.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)",
        border: "1px solid rgba(99, 102, 241, 0.35)",
        borderRadius: "20px",
        padding: "2rem",
        maxWidth: "680px",
        margin: "0 auto",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative top accent glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #f59e0b 100%)",
        }}
      />

      {/* Pass Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "1.25rem",
          marginBottom: "1.5rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "#ffffff", padding: "6px 12px", borderRadius: "12px", display: "flex", alignItems: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}>
            <CollegeLogo size="sm" style={{ height: "46px", width: "auto" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                MIT Thandavapura
              </span>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>• Transport Division</span>
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#f8fafc", margin: "0.2rem 0 0 0", letterSpacing: "-0.01em" }}>
              STUDENT BUS TRANSIT PASS
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "0.35rem 0.85rem",
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
            {assignment.transport_status || "Active Transit Pass"}
          </span>
        </div>
      </div>

      {/* Student Identification Banner */}
      <div
        style={{
          background: "rgba(99, 102, 241, 0.08)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: "12px",
          padding: "0.9rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.72rem", color: "#a5b4fc", fontWeight: 600, textTransform: "uppercase" }}>
            Passholder Student
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc" }}>
            {assignment.student_name || "Enrolled Student"}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {assignment.student_usn && (
            <span
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#e2e8f0",
                padding: "0.25rem 0.65rem",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              USN: {assignment.student_usn}
            </span>
          )}
          <span
            style={{
              background: "rgba(245, 158, 11, 0.15)",
              color: "#fbbf24",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              padding: "0.25rem 0.65rem",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.82rem",
            }}
          >
            Route #{assignment.route_number || "—"}
          </span>
        </div>
      </div>

      {/* Route & Vehicle Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Route Name Banner */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <span style={{ display: "block", fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.3rem" }}>
            Allocated Transit Route
          </span>
          <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc" }}>
            {assignment.route_name || `Bus Route ${assignment.route_number || "Not provided"}`}
          </span>
        </div>

        {/* Boarding Stop & Bus Registration */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.9rem 1.15rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#06b6d4", marginBottom: "0.25rem" }}>
              <MapPin size={14} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                Assigned Boarding Stop
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#f8fafc" }}>
              {assignment.stop_name || "Main Boarding Stop"}
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.9rem 1.15rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#818cf8", marginBottom: "0.25rem" }}>
              <Bus size={14} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                Bus Vehicle Number
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#f8fafc", fontFamily: "monospace" }}>
              {assignment.bus_number || "KA-09-F-1001"}
            </div>
          </div>
        </div>

        {/* Timings Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.06)", padding: "0.9rem 1.15rem", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#34d399", marginBottom: "0.25rem" }}>
              <Clock size={14} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                Morning Pickup Time
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#34d399" }}>
              {assignment.pickup_time || "07:45 AM"}
            </div>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Be at stop 5 mins prior</span>
          </div>

          <div style={{ background: "rgba(245, 158, 11, 0.06)", padding: "0.9rem 1.15rem", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#fbbf24", marginBottom: "0.25rem" }}>
              <Clock size={14} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                Evening Return Drop
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fbbf24" }}>
              {assignment.drop_time || "05:15 PM"}
            </div>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Departs campus at 04:30 PM</span>
          </div>
        </div>

        {/* Driver Contact & Action */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            padding: "1rem 1.25rem",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase" }}>
              <User size={13} />
              Assigned Bus Driver
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#f8fafc", marginTop: "0.2rem" }}>
              {assignment.driver_name || "College Driver"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#cbd5e1", marginTop: "0.1rem" }}>
              {assignment.driver_phone || "+91 98450 12345"}
            </div>
          </div>

          {assignment.driver_phone && assignment.driver_phone !== "Not provided" && (
            <a
              href={`tel:${assignment.driver_phone.replace(/\s+/g, "")}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                padding: "0.55rem 1.15rem",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Phone size={15} />
              <span>Call Driver</span>
            </a>
          )}
        </div>

        {/* Campus Arrival Destination */}
        <div
          style={{
            background: "rgba(99, 102, 241, 0.05)",
            padding: "0.85rem 1.15rem",
            borderRadius: "12px",
            border: "1px solid rgba(99, 102, 241, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.82rem",
            color: "#cbd5e1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Navigation size={15} style={{ color: "#818cf8" }} />
            <span>Destination: <strong>MIT Thandavapura Campus Main Gate</strong></span>
          </div>
          <span style={{ color: "#34d399", fontWeight: 700 }}>Arrival: 08:35 AM</span>
        </div>
      </div>
    </div>
  );
}
