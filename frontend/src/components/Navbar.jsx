import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CollegeLogo from "./CollegeLogo";
import NotificationBell from "./NotificationBell";
import {
  Menu,
  Bell,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  LogOut,
} from "lucide-react";

export default function Navbar({ onMenuToggle }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [geofenceStatus, setGeofenceStatus] = useState("Checking...");

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Check browser geolocation for header badge
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          // Approximate distance to campus center (12.183700, 76.694200)
          const dLat = (lat - 12.1837) * 111000;
          const dLon = (lon - 76.6942) * 111000 * Math.cos((12.1837 * Math.PI) / 180);
          const dist = Math.sqrt(dLat * dLat + dLon * dLon);
          if (dist <= 500) {
            setGeofenceStatus(`On Campus (${Math.round(dist)}m)`);
          } else {
            setGeofenceStatus(`Outside (${(dist / 1000).toFixed(1)}km)`);
          }
        },
        () => {
          setGeofenceStatus("Campus Boundary Active");
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      setGeofenceStatus("Campus Boundary Active");
    }
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header
      style={{
        height: "var(--navbar-height, 68px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
      }}
    >
      {/* Left: Mobile Menu + [ MIT LOGO ] SMART DEPARTMENT */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <button
          onClick={onMenuToggle}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#f8fafc",
            borderRadius: "8px",
            padding: "0.5rem",
            cursor: "pointer",
            display: "none",
            alignItems: "center",
          }}
        >
          <Menu size={20} />
        </button>

        <Link
          to="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <CollegeLogo
            size="sm"
            style={{
              height: "44px",
              width: "auto",
              objectFit: "contain",
            }}
          />
          <div>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "#f8fafc",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              SmartDept
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted, #94a3b8)",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
              }}
            >
              Academic & Campus Management System • MITT
            </div>
          </div>
        </Link>
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Live Geofence Badge */}
        <div
          title="Configured Department GPS Geofence (300m radius)"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.35rem 0.75rem",
            borderRadius: "20px",
            background: geofenceStatus.includes("Outside")
              ? "rgba(245, 158, 11, 0.15)"
              : "rgba(16, 185, 129, 0.15)",
            border: `1px solid ${
              geofenceStatus.includes("Outside")
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(16, 185, 129, 0.3)"
            }`,
            color: geofenceStatus.includes("Outside") ? "#f59e0b" : "#10b981",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
          className="geofence-badge"
        >
          <MapPin size={13} />
          <span>{geofenceStatus}</span>
        </div>

        {/* Live Clock */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.8rem",
            color: "var(--text-secondary, #94a3b8)",
            padding: "0.35rem 0.65rem",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
          className="time-badge"
        >
          <Clock size={13} />
          <span>
            {formattedDate}, {formattedTime}
          </span>
        </div>

        {/* Notifications Bell */}
        <NotificationBell />

        {/* Profile Avatar Pill */}
        <Link
          to="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
            color: "#f8fafc",
            padding: "0.35rem 0.75rem",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "0.85rem",
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <span className="user-name-text">{user?.name?.split(" ")[0] || "User"}</span>
        </Link>
      </div>
    </header>
  );
}
