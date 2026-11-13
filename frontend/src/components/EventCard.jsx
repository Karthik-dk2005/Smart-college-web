import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Building, Users, Tag, ArrowRight, Edit3, UserCheck } from "lucide-react";
import RegistrationButton from "./RegistrationButton";
import { useAuth } from "../context/AuthContext";

export default function EventCard({ event, onStatusChange, showAdminActions = true }) {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const currentRole = role?.toLowerCase() || "student";

  if (!event) return null;

  // Format date nicely: "15 October 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Determine status color scheme
  const getStatusBadge = () => {
    const status = event.computed_status || event.status || "Upcoming";
    if (status === "Cancelled") {
      return { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" };
    }
    if (status === "Ongoing") {
      return { bg: "rgba(16, 185, 129, 0.18)", text: "#34d399", border: "rgba(16, 185, 129, 0.4)" };
    }
    if (status === "Completed") {
      return { bg: "rgba(148, 163, 184, 0.15)", text: "#94a3b8", border: "rgba(148, 163, 184, 0.3)" };
    }
    return { bg: "rgba(99, 102, 241, 0.18)", text: "#a5b4fc", border: "rgba(99, 102, 241, 0.4)" };
  };

  // Category badge colors
  const getCategoryColor = (cat) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("work") || c.includes("tech") || c.includes("hack")) {
      return { bg: "rgba(14, 165, 233, 0.15)", text: "#38bdf8" };
    }
    if (c.includes("sport")) {
      return { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24" };
    }
    if (c.includes("cultur")) {
      return { bg: "rgba(236, 72, 153, 0.15)", text: "#f472b6" };
    }
    if (c.includes("place")) {
      return { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399" };
    }
    if (c.includes("meet")) {
      return { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc" };
    }
    return { bg: "rgba(99, 102, 241, 0.15)", text: "#818cf8" };
  };

  const statusBadge = getStatusBadge();
  const catStyle = getCategoryColor(event.category);
  const statusLabel = event.computed_status || event.status || "Upcoming";

  // Check if HOD can manage this event
  const canManage =
    currentRole === "admin" ||
    (currentRole === "hod" && user?.department_id && event.department_id === user.department_id);

  // Fallback banner placeholder if no image
  const defaultBanner =
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80";

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
      }}
      className="event-card-hover"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
        e.currentTarget.style.boxShadow = "0 14px 30px rgba(0, 0, 0, 0.35), 0 0 20px rgba(99, 102, 241, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)";
      }}
    >
      {/* Event Banner Image */}
      <div style={{ position: "relative", height: "160px", overflow: "hidden", background: "#1e293b" }}>
        <img
          src={event.image_url || defaultBanner}
          alt={event.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease",
          }}
          onError={(e) => {
            e.currentTarget.src = defaultBanner;
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(17, 24, 39, 0.95) 0%, rgba(17, 24, 39, 0.2) 70%, transparent 100%)",
          }}
        />

        {/* Category Pill */}
        <span
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: catStyle.bg,
            color: catStyle.text,
            border: `1px solid ${catStyle.text}40`,
            backdropFilter: "blur(6px)",
            padding: "0.25rem 0.65rem",
            borderRadius: "20px",
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {event.category}
        </span>

        {/* Status Pill */}
        <span
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: statusBadge.bg,
            color: statusBadge.text,
            border: `1px solid ${statusBadge.border}`,
            backdropFilter: "blur(6px)",
            padding: "0.25rem 0.65rem",
            borderRadius: "20px",
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        >
          {statusLabel}
        </span>

        {/* Capacity Indicator Pill */}
        {event.registration_required && (
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              right: "12px",
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(6px)",
              color: "#e2e8f0",
              padding: "0.2rem 0.55rem",
              borderRadius: "12px",
              fontSize: "0.7rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <Users size={12} color="#818cf8" />
            <span>
              {event.current_participants || 0} / {event.max_participants || 100}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#f8fafc",
            marginBottom: "0.75rem",
            lineHeight: 1.35,
          }}
        >
          {event.title}
        </h3>

        {/* Details list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1.1rem", fontSize: "0.82rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "#cbd5e1" }}>
            <Calendar size={15} color="#818cf8" style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ color: "#94a3b8", fontWeight: 500 }}>Date: </strong>
              {formatDate(event.event_date)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "#cbd5e1" }}>
            <Clock size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ color: "#94a3b8", fontWeight: 500 }}>Time: </strong>
              {event.start_time} – {event.end_time}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "#cbd5e1" }}>
            <MapPin size={15} color="#f472b6" style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <strong style={{ color: "#94a3b8", fontWeight: 500 }}>Venue: </strong>
              {event.venue}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "#cbd5e1" }}>
            <Building size={15} color="#34d399" style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <strong style={{ color: "#94a3b8", fontWeight: 500 }}>Organizer: </strong>
              {event.organizer}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "0.85rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <Link
            to={`/events/${event.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#f8fafc",
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
          >
            View Details <ArrowRight size={14} />
          </Link>

          {/* Registration / Status Button */}
          {event.registration_required ? (
            <RegistrationButton
              event={event}
              size="sm"
              onStatusChange={onStatusChange}
            />
          ) : (
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>No registration needed</span>
          )}

          {/* Admin / HOD Quick Management Buttons */}
          {showAdminActions && canManage && (
            <div style={{ display: "flex", gap: "0.35rem", width: "100%", marginTop: "0.35rem" }}>
              <Link
                to={`/admin/events/${event.id}/participants`}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem",
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  color: "#c7d2fe",
                  padding: "0.35rem 0.5rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Users size={13} /> Participants ({event.current_participants || 0})
              </Link>
              <Link
                to={`/admin/events/${event.id}/edit`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  padding: "0.35rem 0.55rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
                title="Edit Event"
              >
                <Edit3 size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
