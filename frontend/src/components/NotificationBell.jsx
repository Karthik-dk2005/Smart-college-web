import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, ExternalLink, Calendar, Megaphone, AlertCircle } from "lucide-react";
import { notificationsApi } from "../api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll({ limit: 15 });
      const items = Array.isArray(res) ? res : res.data || [];
      setNotifications(items);
      const count = items.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.warn("Could not load notifications:", err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getCategoryIcon = (category) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("event")) return <Calendar size={14} color="#818cf8" />;
    if (cat.includes("announcement")) return <Megaphone size={14} color="#f59e0b" />;
    if (cat.includes("urgent")) return <AlertCircle size={14} color="#ef4444" />;
    return <Bell size={14} color="#94a3b8" />;
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="Notifications"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: isOpen ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
          border: isOpen ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.1)",
          color: isOpen ? "#818cf8" : "#f8fafc",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "18px",
              height: "18px",
              padding: "0 4px",
              borderRadius: "9px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "0.68rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.5)",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "350px",
            maxHeight: "480px",
            background: "#111827",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "14px",
            boxShadow: "0 14px 38px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.85rem 1.1rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bell size={16} color="#818cf8" />
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f8fafc" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "rgba(99, 102, 241, 0.2)",
                    color: "#818cf8",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "10px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.2rem 0.4rem",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#c7d2fe")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", maxHeight: "380px" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "2.5rem 1rem",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "0.88rem",
                }}
              >
                <Bell size={28} style={{ margin: "0 auto 0.5rem", opacity: 0.4 }} />
                <div>No notifications at the moment</div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    padding: "0.85rem 1.1rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    background: notif.read ? "transparent" : "rgba(99, 102, 241, 0.06)",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = notif.read
                      ? "rgba(255, 255, 255, 0.03)"
                      : "rgba(99, 102, 241, 0.12)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notif.read
                      ? "transparent"
                      : "rgba(99, 102, 241, 0.06)")
                  }
                >
                  <div
                    style={{
                      marginTop: "2px",
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: notif.read ? 600 : 700,
                          color: notif.read ? "#cbd5e1" : "#ffffff",
                          fontSize: "0.85rem",
                          lineHeight: 1.3,
                        }}
                      >
                        {notif.title}
                      </div>
                      {!notif.read && (
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "#6366f1",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "#94a3b8",
                        marginTop: "0.2rem",
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {notif.message}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "0.45rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {notif.category || "General"}
                      </span>

                      {!notif.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Mark as read"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#818cf8",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            padding: "0.15rem 0.35rem",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                          }}
                        >
                          <Check size={12} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "0.65rem",
              textAlign: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <Link
              to="/announcements"
              onClick={() => setIsOpen(false)}
              style={{
                color: "#818cf8",
                fontSize: "0.78rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              View All Announcements →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
