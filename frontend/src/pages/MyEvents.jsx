import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, CheckCircle2, Clock, MapPin, Users, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { eventsApi } from "../api";
import EventCard from "../components/EventCard";
import CollegeLogo from "../components/CollegeLogo";
import { useAuth } from "../context/AuthContext";

export default function MyEvents() {
  const { role, user } = useAuth();
  const currentRole = role?.toLowerCase() || "student";
  const isOrganizer = ["admin", "hod", "teacher"].includes(currentRole);

  const [activeTab, setActiveTab] = useState("registered"); // "registered", "created"
  const [registrations, setRegistrations] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const [regs, created] = await Promise.all([
        eventsApi.getMyRegistrations(),
        isOrganizer ? eventsApi.getMyEvents() : Promise.resolve([]),
      ]);
      setRegistrations(Array.isArray(regs) ? regs : regs.data || []);
      setCreatedEvents(Array.isArray(created) ? created : created.data || []);
    } catch (err) {
      console.error("Failed to load user events:", err);
      setError(err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const displayEvents = activeTab === "registered" ? registrations : createdEvents;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Banner */}
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
              height: "50px",
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
                Personal Event Roster
              </span>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: "0.25rem 0 0.1rem" }}>
              My Events & Registrations
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
              Track sessions you are registered for, your attendance status, and events you manage.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            to="/events"
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
            Explore All Events →
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("registered")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "8px",
              background: activeTab === "registered" ? "rgba(99, 102, 241, 0.2)" : "transparent",
              border: activeTab === "registered" ? "1px solid #6366f1" : "1px solid transparent",
              color: activeTab === "registered" ? "#c7d2fe" : "#94a3b8",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            My Registered Events ({registrations.length})
          </button>

          {isOrganizer && (
            <button
              onClick={() => setActiveTab("created")}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: "8px",
                background: activeTab === "created" ? "rgba(99, 102, 241, 0.2)" : "transparent",
                border: activeTab === "created" ? "1px solid #6366f1" : "1px solid transparent",
                color: activeTab === "created" ? "#c7d2fe" : "#94a3b8",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Managed Events ({createdEvents.length})
            </button>
          )}
        </div>

        <button
          onClick={fetchMyEvents}
          title="Refresh"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#cbd5e1",
            padding: "0.45rem",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 1rem", color: "#818cf8" }} />
          <div>Loading your registered events...</div>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#fca5a5" }}>{error}</div>
      ) : displayEvents.length === 0 ? (
        <div
          style={{
            background: "rgba(17, 24, 39, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "4rem 2rem",
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          <Calendar size={40} style={{ opacity: 0.3, margin: "0 auto 0.75rem" }} />
          <h3 style={{ color: "#f8fafc", fontSize: "1.1rem", marginBottom: "0.3rem" }}>
            {activeTab === "registered" ? "No registered events yet" : "No managed events found"}
          </h3>
          <p style={{ fontSize: "0.85rem", maxWidth: "400px", margin: "0 auto 1.25rem" }}>
            {activeTab === "registered"
              ? "Browse the campus events catalog to register for technical workshops, cultural meets, or sports competitions."
              : "You haven't created any events for your department yet."}
          </p>
          <Link
            to="/events"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 1.2rem",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {displayEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} onStatusChange={fetchMyEvents} />
          ))}
        </div>
      )}
    </div>
  );
}
