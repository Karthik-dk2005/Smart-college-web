import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Calendar, MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { eventsApi } from "../api";
import ParticipantTable from "../components/ParticipantTable";
import CollegeLogo from "../components/CollegeLogo";
import { useAuth } from "../context/AuthContext";

export default function EventParticipants() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentRole = role?.toLowerCase() || "student";

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ev, parts] = await Promise.all([
        eventsApi.getById(eventId),
        eventsApi.getParticipants(eventId),
      ]);
      setEvent(ev);
      setParticipants(Array.isArray(parts) ? parts : []);
    } catch (err) {
      console.error("Failed to load participants:", err);
      setError(err.message || "Failed to load participants or attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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

        <button
          onClick={fetchData}
          title="Refresh participants"
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
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "16px",
          padding: "1.5rem 1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <CollegeLogo
            size="sm"
            style={{
              height: "52px",
              width: "auto",
              objectFit: "contain",
              background: "#ffffff",
              padding: "4px",
              borderRadius: "10px",
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  background: "rgba(99, 102, 241, 0.3)",
                  color: "#c7d2fe",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "20px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Event Attendance & Roster
              </span>
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", margin: "0.3rem 0 0.15rem" }}>
              {event?.title || "Event Participants"}
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
              {event?.venue} • {event?.event_date} ({event?.start_time} - {event?.end_time})
            </p>
          </div>
        </div>

        <Link
          to={`/events/${eventId}`}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#f8fafc",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          View Event Details →
        </Link>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 1rem", color: "#818cf8" }} />
          <div>Loading participant records and attendance...</div>
        </div>
      ) : error ? (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "14px",
            padding: "2rem",
            textAlign: "center",
            color: "#fca5a5",
          }}
        >
          <AlertCircle size={32} style={{ margin: "0 auto 0.75rem" }} />
          <h3>Access Denied or Event Not Found</h3>
          <p style={{ fontSize: "0.9rem", marginTop: "0.4rem" }}>{error}</p>
        </div>
      ) : (
        <ParticipantTable
          eventId={eventId}
          participants={participants}
          onRefresh={fetchData}
          readOnly={!["admin", "hod"].includes(currentRole)}
        />
      )}
    </div>
  );
}
