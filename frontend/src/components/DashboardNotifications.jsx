import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  Calendar,
  Megaphone,
  AlertCircle,
  BookOpen,
  Award,
  Clock,
  ArrowRight,
  MailCheck,
  RefreshCw,
} from "lucide-react";
import { notificationsApi } from "../api";

export default function DashboardNotifications({ limit = 5 }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.getAll({ limit });
      const items = Array.isArray(res) ? res : res.data || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch (err) {
      console.warn("Could not load dashboard notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [limit]);

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type, category) => {
    const t = (type || category || "").toLowerCase();
    if (t.includes("marks")) return <Award size={16} color="#10b981" />;
    if (t.includes("attendance")) return <Clock size={16} color="#3b82f6" />;
    if (t.includes("timetable")) return <BookOpen size={16} color="#8b5cf6" />;
    if (t.includes("event")) return <Calendar size={16} color="#ec4899" />;
    if (t.includes("announcement")) return <Megaphone size={16} color="#f59e0b" />;
    if (t.includes("system") || t.includes("urgent")) return <AlertCircle size={16} color="#ef4444" />;
    return <Bell size={16} color="#64748b" />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      style={{
        background: "var(--card-bg, #1e293b)",
        border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
        borderRadius: "16px",
        padding: "1.35rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "rgba(59, 130, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#60a5fa",
            }}
          >
            <Bell size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary, #f8fafc)" }}>
              Notifications & Alerts
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted, #94a3b8)" }}>
              Instant email & system notifications
            </span>
          </div>
          {unreadCount > 0 && (
            <span
              style={{
                background: "#2563eb",
                color: "#ffffff",
                padding: "0.15rem 0.55rem",
                borderRadius: "12px",
                fontSize: "0.74rem",
                fontWeight: 700,
              }}
            >
              {unreadCount} New
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                background: "none",
                border: "none",
                color: "#60a5fa",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: "0.3rem 0.5rem",
              }}
            >
              Mark all read
            </button>
          )}
          <Link
            to="/notifications"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "#93c5fd",
              textDecoration: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8" }}>
          <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem" }}>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            padding: "1.5rem",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "10px",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
          }}
        >
          <CheckCircle2 size={24} color="#10b981" style={{ margin: "0 auto 0.4rem auto" }} />
          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#f8fafc" }}>
            You're all caught up!
          </p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
            No recent unread alerts. You will receive automatic email updates when new events occur.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) handleMarkRead(notif.id);
                if (notif.link) navigate(notif.link);
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.85rem",
                padding: "0.8rem 1rem",
                background: notif.read ? "rgba(255, 255, 255, 0.03)" : "rgba(37, 99, 235, 0.1)",
                border: notif.read
                  ? "1px solid rgba(255, 255, 255, 0.06)"
                  : "1px solid rgba(59, 130, 246, 0.35)",
                borderRadius: "10px",
                cursor: notif.link ? "pointer" : "default",
                transition: "all 0.15s ease",
              }}
            >
              {/* Category Icon */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                {getTypeIcon(notif.notification_type, notif.category)}
              </div>

              {/* Title & Message */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: notif.read ? 600 : 700,
                      color: notif.read ? "#e2e8f0" : "#ffffff",
                    }}
                  >
                    {notif.title}
                  </span>
                  {!notif.read && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#38bdf8",
                        display: "inline-block",
                      }}
                    />
                  )}
                  {notif.delivery_status === "sent" && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.2rem",
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "4px",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                      }}
                    >
                      <MailCheck size={11} />
                      Email Dispatched
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "0.8rem",
                    color: "var(--text-muted, #94a3b8)",
                    lineHeight: 1.45,
                  }}
                >
                  {notif.message}
                </p>
                <div
                  style={{
                    marginTop: "0.35rem",
                    fontSize: "0.72rem",
                    color: "#64748b",
                  }}
                >
                  {formatDate(notif.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
