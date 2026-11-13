import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Edit3,
  Trash2,
  Share2,
  Tag,
  ShieldAlert,
} from "lucide-react";
import { eventsApi, baseURL } from "../api";
import RegistrationButton from "../components/RegistrationButton";
import CollegeLogo from "../components/CollegeLogo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentRole = role?.toLowerCase() || "student";

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventsApi.getById(eventId);
      setEvent(res);
    } catch (err) {
      console.error("Failed to load event details:", err);
      setError(err.message || "Failed to load event details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const handleCancelEvent = async () => {
    if (!window.confirm("Are you sure you want to cancel this event?")) return;
    try {
      await eventsApi.delete(eventId, false);
      showToast("Event cancelled successfully.", "info");
      fetchEventDetails();
    } catch (err) {
      showToast(err.message || "Failed to cancel event", "error");
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", "success");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem", color: "#94a3b8" }}>
        Loading event information...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div
        style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "14px",
          padding: "2rem",
          textAlign: "center",
          color: "#fca5a5",
          maxWidth: "600px",
          margin: "3rem auto",
        }}
      >
        <AlertCircle size={36} style={{ margin: "0 auto 1rem" }} />
        <h3>Event Not Found</h3>
        <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>{error || "The requested event could not be found."}</p>
        <Link
          to="/events"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1.25rem",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.1)",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.85rem",
          }}
        >
          <ArrowLeft size={14} /> Back to Events
        </Link>
      </div>
    );
  }

  const canManage =
    currentRole === "admin" ||
    (currentRole === "hod" && user?.department_id && event.department_id === user.department_id);

  const defaultBanner =
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80";

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const status = event.computed_status || event.status || "Upcoming";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Top Back Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#cbd5e1",
            padding: "0.45rem 0.85rem",
            borderRadius: "8px",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={handleShare}
            title="Share event link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#cbd5e1",
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            <Share2 size={14} /> Share
          </button>

          {canManage && (
            <>
              <Link
                to={`/admin/events/${event.id}/participants`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.35)",
                  color: "#c7d2fe",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Users size={14} /> Participants & Attendance ({event.current_participants || 0})
              </Link>
              <Link
                to={`/admin/events/${event.id}/edit`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#f8fafc",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Edit3 size={14} /> Edit
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Event Card */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Event Banner */}
        <div style={{ position: "relative", height: "300px", background: "#1e293b", overflow: "hidden" }}>
          <img
            src={
              event.image_url
                ? event.image_url.startsWith("/uploads")
                  ? `${baseURL}${event.image_url}`
                  : event.image_url
                : defaultBanner
            }
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.src = defaultBanner;
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(17, 24, 39, 1) 0%, rgba(17, 24, 39, 0.4) 60%, transparent 100%)",
            }}
          />

          {/* Badges on Banner */}
          <div style={{ position: "absolute", bottom: "1.5rem", left: "1.75rem", right: "1.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
              <span
                style={{
                  background: "rgba(99, 102, 241, 0.8)",
                  backdropFilter: "blur(6px)",
                  color: "#ffffff",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {event.category}
              </span>

              <span
                style={{
                  background:
                    status === "Cancelled"
                      ? "rgba(239, 68, 68, 0.8)"
                      : status === "Ongoing"
                      ? "rgba(16, 185, 129, 0.8)"
                      : "rgba(30, 41, 59, 0.8)",
                  backdropFilter: "blur(6px)",
                  color: "#ffffff",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {status}
              </span>
            </div>

            <h1
              style={{
                fontSize: "1.85rem",
                fontWeight: 800,
                color: "#f8fafc",
                lineHeight: 1.25,
                margin: 0,
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.7)",
              }}
            >
              {event.title}
            </h1>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Key Quick Facts Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "12px",
              padding: "1.25rem",
            }}
          >
            {/* Date */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(99, 102, 241, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#818cf8",
                  flexShrink: 0,
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                  Date
                </div>
                <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.9rem", marginTop: "0.15rem" }}>
                  {formatDate(event.event_date)}
                </div>
              </div>
            </div>

            {/* Time */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(14, 165, 233, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                  flexShrink: 0,
                }}
              >
                <Clock size={18} />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                  Time
                </div>
                <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.9rem", marginTop: "0.15rem" }}>
                  {event.start_time} – {event.end_time}
                </div>
              </div>
            </div>

            {/* Venue */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(236, 72, 153, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f472b6",
                  flexShrink: 0,
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                  Venue
                </div>
                <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.9rem", marginTop: "0.15rem" }}>
                  {event.venue}
                </div>
              </div>
            </div>

            {/* Organizer */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#34d399",
                  flexShrink: 0,
                }}
              >
                <Building size={18} />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                  Organizer
                </div>
                <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.9rem", marginTop: "0.15rem" }}>
                  {event.organizer}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", marginBottom: "0.6rem" }}>
              About This Event
            </h3>
            <p
              style={{
                color: "#cbd5e1",
                fontSize: "0.95rem",
                lineHeight: 1.65,
                whiteSpace: "pre-line",
              }}
            >
              {event.description || "No specific description provided."}
            </p>
          </div>

          {/* Registration Section Card */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.25rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                Registration Status
              </div>

              {event.registration_required ? (
                <div style={{ marginTop: "0.4rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#f8fafc", fontSize: "1.05rem", fontWeight: 700 }}>
                    <Users size={18} color="#818cf8" />
                    <span>
                      {event.current_participants || 0} / {event.max_participants || 100} Registered
                    </span>
                  </div>

                  {event.registration_deadline && (
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.3rem" }}>
                      Deadline: {new Date(event.registration_deadline).toLocaleString()}
                    </div>
                  )}

                  <div style={{ fontSize: "0.8rem", color: "#a5b4fc", marginTop: "0.2rem" }}>
                    Target Audience: {event.target_audience || "All Students"}
                  </div>
                </div>
              ) : (
                <div style={{ color: "#34d399", fontWeight: 600, marginTop: "0.3rem" }}>
                  Open Admission • No prior registration required
                </div>
              )}
            </div>

            {/* Registration Button */}
            {event.registration_required && (
              <RegistrationButton
                event={event}
                size="lg"
                onStatusChange={fetchEventDetails}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
