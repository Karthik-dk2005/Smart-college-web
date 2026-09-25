import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  Bell,
  LogOut,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await api.getNotifications();
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.read).length);
        }
      } catch (err) {
        console.warn("Could not fetch notifications:", err);
      }
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadgeClass = (r) => {
    switch (r) {
      case "admin":
        return "badge-danger";
      case "hod":
        return "badge-purple";
      case "teacher":
        return "badge-info";
      default:
        return "badge-success";
    }
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MapPin size={16} color="#06b6d4" />
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Campus GPS: <strong>12.1837° N, 76.6942° E</strong> (Thandavapura)
          </span>
        </div>
      </div>

      <div className="nav-right">
        {/* Notification Bell Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className="btn-icon"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="badge-dot" />}
          </button>

          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "50px",
                right: "0",
                width: "360px",
                background: "#111827",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "1rem",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                zIndex: 150,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>
                  Notifications ({unreadCount} new)
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6366f1",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748b", fontSize: "0.85rem" }}>
                    No notifications right now
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "0.6rem 0.75rem",
                        background: n.read ? "rgba(255, 255, 255, 0.02)" : "rgba(99, 102, 241, 0.1)",
                        borderRadius: "8px",
                        borderLeft: n.read ? "3px solid #334155" : "3px solid #6366f1",
                      }}
                    >
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>
              {user?.full_name || "Academic User"}
            </span>
            <span className={`badge ${getRoleBadgeClass(role)}`} style={{ padding: "1px 6px", fontSize: "0.65rem", width: "fit-content" }}>
              {role?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          className="btn-icon"
          onClick={logout}
          title="Sign Out"
          style={{ color: "#f87171" }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
