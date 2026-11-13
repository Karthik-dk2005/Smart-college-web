import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EventForm from "../components/EventForm";
import CollegeLogo from "../components/CollegeLogo";
import { eventsApi } from "../api";
import { useToast } from "../components/Toast";
import { Loader2, AlertCircle } from "lucide-react";

export default function EditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await eventsApi.getById(eventId);
        setInitialData(res);
      } catch (err) {
        setError(err.message || "Failed to load event data.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      await eventsApi.update(eventId, payload);
      showToast("Event updated successfully!", "success");
      navigate(`/events/${eventId}`);
    } catch (err) {
      showToast(err.message || "Failed to update event.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem", color: "#94a3b8" }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 1rem", color: "#818cf8" }} />
        <div>Loading event details for editing...</div>
      </div>
    );
  }

  if (error || !initialData) {
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
        <h3>Cannot Edit Event</h3>
        <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>{error || "Event not found or unauthorized access."}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.1)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

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
            Edit Event: {initialData.title}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem", margin: 0 }}>
            Modify event schedule, registration capacity, category, venue, or status.
          </p>
        </div>
      </div>

      {/* Form with initialData */}
      <EventForm initialData={initialData} onSubmit={handleSubmit} isSubmitting={submitting} />
    </div>
  );
}
