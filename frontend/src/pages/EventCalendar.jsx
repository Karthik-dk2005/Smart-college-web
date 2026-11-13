import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, Plus, RefreshCw, Grid } from "lucide-react";
import { eventsApi } from "../api";
import EventCalendarComponent from "../components/EventCalendar";
import CollegeLogo from "../components/CollegeLogo";
import { useAuth } from "../context/AuthContext";

export default function EventCalendarPage() {
  const { role } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canCreate = ["admin", "hod"].includes(role?.toLowerCase());

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventsApi.getAll();
      setEvents(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
              height: "50px",
              width: "auto",
              objectFit: "contain",
              background: "#ffffff",
              padding: "4px",
              borderRadius: "10px",
            }}
          />
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
              Event Calendar
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.2rem", margin: 0 }}>
              Interactive schedule of academic, technical, cultural, and sports events.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            to="/events"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#f8fafc",
              padding: "0.5rem 0.9rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Grid size={15} /> Cards View
          </Link>

          {canCreate && (
            <Link
              to="/admin/events/add"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Plus size={16} /> Add Event
            </Link>
          )}
        </div>
      </div>

      {/* Calendar Area */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 1rem", color: "#818cf8" }} />
          <div>Loading calendar...</div>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#fca5a5" }}>{error}</div>
      ) : (
        <EventCalendarComponent events={events} />
      )}
    </div>
  );
}
