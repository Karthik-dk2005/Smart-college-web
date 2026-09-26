import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children, maxWidth = "550px" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#111827",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "14px",
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "none",
              color: "#94a3b8",
              borderRadius: "8px",
              padding: "0.4rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}
