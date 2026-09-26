import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this timetable entry?",
  itemDetails = null,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#1e293b",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "6px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.5rem" }}>
          <p style={{ margin: "0 0 1rem 0", color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.5" }}>
            {message}
          </p>

          {itemDetails && (
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "10px",
                padding: "0.9rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                fontSize: "0.85rem",
                color: "#94a3b8",
              }}
            >
              {itemDetails.subject_name && (
                <div>
                  <strong style={{ color: "#f8fafc" }}>Subject: </strong>
                  <span>{itemDetails.subject_name}</span>
                </div>
              )}
              {itemDetails.teacher_name && (
                <div>
                  <strong style={{ color: "#f8fafc" }}>Teacher: </strong>
                  <span>{itemDetails.teacher_name}</span>
                </div>
              )}
              {itemDetails.day && itemDetails.start_time && itemDetails.end_time && (
                <div>
                  <strong style={{ color: "#f8fafc" }}>Time: </strong>
                  <span>
                    {itemDetails.day}, {itemDetails.start_time} - {itemDetails.end_time}
                  </span>
                </div>
              )}
              {itemDetails.room_name && (
                <div>
                  <strong style={{ color: "#f8fafc" }}>Room: </strong>
                  <span>{itemDetails.room_name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "rgba(15, 23, 42, 0.5)",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#e2e8f0",
              fontWeight: "600",
              fontSize: "0.88rem",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "8px",
              background: "#ef4444",
              border: "none",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "0.88rem",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.35)",
            }}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
