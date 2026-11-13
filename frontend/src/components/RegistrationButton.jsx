import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Loader2, UserCheck } from "lucide-react";
import { eventsApi } from "../api";
import { useToast } from "./Toast";

export default function RegistrationButton({
  event,
  onStatusChange,
  size = "md",
  className = "",
  style = {},
}) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!event) return null;

  const isFull = event.max_participants && (event.current_participants >= event.max_participants);
  const isCancelled = event.status === "Cancelled";
  const isCompleted = event.computed_status === "Completed";
  
  let isDeadlinePassed = false;
  if (event.registration_deadline) {
    const deadline = new Date(event.registration_deadline);
    if (!isNaN(deadline.getTime()) && new Date() > deadline) {
      isDeadlinePassed = true;
    }
  }

  const isRegistered = event.is_registered || event.user_registration_status === "Registered";

  const handleRegister = async (e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await eventsApi.register(event.id);
      showToast("Successfully registered for this event!", "success");
      if (onStatusChange) onStatusChange();
    } catch (err) {
      showToast(err.message || "Failed to register for event", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;
    try {
      setLoading(true);
      await eventsApi.cancelRegistration(event.id);
      showToast("Registration cancelled.", "info");
      if (onStatusChange) onStatusChange();
    } catch (err) {
      showToast(err.message || "Failed to cancel registration", "error");
    } finally {
      setLoading(false);
    }
  };

  const isSmall = size === "sm";
  const pad = isSmall ? "0.35rem 0.75rem" : "0.55rem 1.25rem";
  const fontSize = isSmall ? "0.8rem" : "0.9rem";

  if (isCancelled) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: pad,
          borderRadius: "8px",
          background: "rgba(239, 68, 68, 0.15)",
          color: "#f87171",
          fontSize,
          fontWeight: 600,
          ...style,
        }}
      >
        <XCircle size={isSmall ? 14 : 16} /> Cancelled
      </span>
    );
  }

  if (isCompleted) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: pad,
          borderRadius: "8px",
          background: "rgba(148, 163, 184, 0.15)",
          color: "#94a3b8",
          fontSize,
          fontWeight: 600,
          ...style,
        }}
      >
        <CheckCircle2 size={isSmall ? 14 : 16} /> Event Completed
      </span>
    );
  }

  if (isRegistered) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", ...style }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: pad,
            borderRadius: "8px",
            background: "rgba(16, 185, 129, 0.18)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "#34d399",
            fontSize,
            fontWeight: 700,
          }}
        >
          <UserCheck size={isSmall ? 14 : 16} /> Registered
        </span>
        <button
          onClick={handleCancel}
          disabled={loading}
          title="Cancel my registration"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: pad,
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            fontSize,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Cancel"}
        </button>
      </div>
    );
  }

  if (isDeadlinePassed) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: pad,
          borderRadius: "8px",
          background: "rgba(245, 158, 11, 0.15)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#fbbf24",
          fontSize,
          fontWeight: 600,
          ...style,
        }}
      >
        <AlertCircle size={isSmall ? 14 : 16} /> Registration Closed
      </span>
    );
  }

  if (isFull) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: pad,
          borderRadius: "8px",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#f87171",
          fontSize,
          fontWeight: 600,
          ...style,
        }}
      >
        <AlertCircle size={isSmall ? 14 : 16} /> Event Full
      </span>
    );
  }

  return (
    <button
      onClick={handleRegister}
      disabled={loading}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.45rem",
        padding: pad,
        borderRadius: "8px",
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        color: "#ffffff",
        border: "none",
        fontSize,
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...style,
      }}
    >
      {loading ? (
        <>
          <Loader2 size={isSmall ? 14 : 16} className="animate-spin" /> Registering...
        </>
      ) : (
        <>Register Now</>
      )}
    </button>
  );
}
