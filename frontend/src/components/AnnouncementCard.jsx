import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Info, Calendar, Building, ChevronDown, ChevronUp, Edit3, Trash2, Tag, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function AnnouncementCard({ announcement, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const { role, user } = useAuth();
  const currentRole = role?.toLowerCase() || "student";

  if (!announcement) return null;

  const priority = announcement.priority || "Normal";

  // Visual indicators based on priority
  const getPriorityTheme = () => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return {
          icon: <AlertCircle size={16} color="#ef4444" />,
          badgeBg: "rgba(239, 68, 68, 0.2)",
          badgeText: "#f87171",
          border: "rgba(239, 68, 68, 0.35)",
          accentBar: "#ef4444",
          cardBg: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(17, 24, 39, 0.95) 100%)",
        };
      case "important":
        return {
          icon: <AlertTriangle size={16} color="#f59e0b" />,
          badgeBg: "rgba(245, 158, 11, 0.2)",
          badgeText: "#fbbf24",
          border: "rgba(245, 158, 11, 0.35)",
          accentBar: "#f59e0b",
          cardBg: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(17, 24, 39, 0.95) 100%)",
        };
      default: // Normal
        return {
          icon: <Info size={16} color="#60a5fa" />,
          badgeBg: "rgba(96, 165, 250, 0.18)",
          badgeText: "#93c5fd",
          border: "rgba(96, 165, 250, 0.25)",
          accentBar: "#3b82f6",
          cardBg: "rgba(17, 24, 39, 0.85)",
        };
    }
  };

  const theme = getPriorityTheme();

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const canManage =
    currentRole === "admin" ||
    (currentRole === "hod" && (!announcement.department_id || announcement.department_id === user?.department_id));

  return (
    <div
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: "14px",
        padding: "1.25rem 1.4rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)",
        transition: "border-color 0.2s ease, transform 0.15s ease",
      }}
      className="announcement-card"
    >
      {/* Accent left indicator stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "4px",
          background: theme.accentBar,
        }}
      />

      {/* Top Meta Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Priority Badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: theme.badgeBg,
              color: theme.badgeText,
              padding: "0.2rem 0.65rem",
              borderRadius: "20px",
              fontSize: "0.72rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              border: `1px solid ${theme.badgeText}30`,
            }}
          >
            {theme.icon}
            {priority}
          </span>

          {/* Category Pill */}
          <span
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              color: "#cbd5e1",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "0.2rem 0.55rem",
              borderRadius: "12px",
              fontSize: "0.72rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <Tag size={11} color="#94a3b8" />
            {announcement.category || "General"}
          </span>

          {/* Target Audience Pill */}
          {announcement.target_audience && (
            <span
              style={{
                background: "rgba(168, 85, 247, 0.12)",
                color: "#c084fc",
                padding: "0.2rem 0.55rem",
                borderRadius: "12px",
                fontSize: "0.72rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Users size={11} />
              {announcement.target_audience}
            </span>
          )}
        </div>

        {/* Date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "#94a3b8",
            fontSize: "0.8rem",
          }}
        >
          <Calendar size={13} />
          <span>{formatDate(announcement.publish_date)}</span>
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#f8fafc",
          lineHeight: 1.35,
          margin: 0,
        }}
      >
        {announcement.title}
      </h3>

      {/* Content */}
      <div
        style={{
          color: "#cbd5e1",
          fontSize: "0.88rem",
          lineHeight: 1.55,
          whiteSpace: "pre-line",
        }}
      >
        {expanded ? (
          announcement.content
        ) : (
          <>
            {announcement.content.length > 200
              ? `${announcement.content.substring(0, 200)}...`
              : announcement.content}
          </>
        )}
      </div>

      {/* Footer Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginTop: "0.25rem",
          paddingTop: "0.65rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.78rem", color: "#94a3b8" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Building size={12} color="#818cf8" />
            {announcement.department_name || "Campus-wide"}
          </span>
          {announcement.creator_name && (
            <span>• By {announcement.creator_name}</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {announcement.content.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "transparent",
                border: "none",
                color: "#818cf8",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.2rem 0.4rem",
              }}
            >
              {expanded ? (
                <>
                  Show Less <ChevronUp size={14} />
                </>
              ) : (
                <>
                  Read More <ChevronDown size={14} />
                </>
              )}
            </button>
          )}

          {canManage && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              {onEdit && (
                <button
                  onClick={() => onEdit(announcement)}
                  title="Edit announcement"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#94a3b8",
                    padding: "0.3rem 0.5rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#c7d2fe")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                >
                  <Edit3 size={13} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(announcement)}
                  title="Delete announcement"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    padding: "0.3rem 0.5rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
