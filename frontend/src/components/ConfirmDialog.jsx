import React from "react";
import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  confirmColor = "var(--accent-danger, #ef4444)",
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="450px">
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            padding: "0.75rem",
            borderRadius: "10px",
            color: "#ef4444",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div>
          <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="btn btn-outline"
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#cbd5e1",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            backgroundColor: confirmColor,
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Deleting..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
