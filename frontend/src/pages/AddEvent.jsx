import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EventForm from "../components/EventForm";
import CollegeLogo from "../components/CollegeLogo";
import { eventsApi } from "../api";
import { useToast } from "../components/Toast";

export default function AddEvent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      const res = await eventsApi.create(payload);
      showToast("Event created successfully!", "success");
      navigate(`/events/${res.id || ""}`);
    } catch (err) {
      showToast(err.message || "Failed to create event.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "16px",
          padding: "1.5rem 1.75rem",
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
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
            Create New Event
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem", margin: 0 }}>
            Schedule academic seminars, technical hackathons, cultural festivals, or departmental meetings.
          </p>
        </div>
      </div>

      {/* Event Form */}
      <EventForm onSubmit={handleSubmit} isSubmitting={submitting} />
    </div>
  );
}
