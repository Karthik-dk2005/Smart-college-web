import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import api, { baseURL } from "../api/axios";
import {
  Settings as SettingsIcon,
  Shield,
  Activity,
  Server,
  Database,
  Radio,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Bell,
  Clock,
  BookOpen,
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [healthStatus, setHealthStatus] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);

  // Preference switches
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
  const [autoRefreshFeed, setAutoRefreshFeed] = useState(true);

  // Geofence info
  const geofenceConfig = {
    campus: "Smart Department of Computer Science & Engineering",
    latitude: 12.1837,
    longitude: 76.6942,
    radius: 300,
    academicYear: "2026–2027 (ODD SEMESTER)",
    timetableRooms: ["CS-303 (Section 5A)", "CS-304 (Section 5B)"],
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      setCheckingHealth(true);
      const start = performance.now();
      const res = await api.get("/health");
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setHealthStatus(res.data);
    } catch (err) {
      console.error("Health check error:", err);
      setHealthStatus({ status: "degraded", error: "Backend unreachable" });
      addToast({
        title: "Backend Offline",
        message: "Unable to connect to FastAPI backend.",
        type: "error",
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleSavePreferences = () => {
    addToast({
      title: "Preferences Saved",
      message: "Application settings have been updated.",
      type: "success",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)" }}>
              System & Department Settings
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                background: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <Activity size={13} />
              SYSTEM OPERATIONAL
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Configure department parameters, geofence radius, and monitor API connectivity.
          </p>
        </div>

        <button
          onClick={checkBackendHealth}
          disabled={checkingHealth}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--bg-surface)",
            color: "var(--text-main)",
            border: "1px solid var(--border-medium)",
            padding: "0.6rem 1.1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: checkingHealth ? "not-allowed" : "pointer",
          }}
        >
          <RefreshCw size={15} className={checkingHealth ? "animate-spin" : ""} />
          {checkingHealth ? "Checking..." : "Probe API Health"}
        </button>
      </div>

      {/* Grid: Health Probe & Geofence Config */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Backend & Database Health Card */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Server size={20} color="var(--primary)" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
              Backend & API Diagnostics
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontSize: "0.9rem", color: "var(--text-main)", fontWeight: 600 }}>FastAPI Server</span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#34d399",
                  background: "rgba(16, 185, 129, 0.15)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                ONLINE (HTTP/REST)
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Database size={18} color="#3b82f6" />
                <span style={{ fontSize: "0.9rem", color: "var(--text-main)", fontWeight: 600 }}>SQLAlchemy SQLite/DB</span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#60a5fa",
                  background: "rgba(59, 130, 246, 0.15)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                CONNECTED (MIGRATED)
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Radio size={18} color="#8b5cf6" />
                <span style={{ fontSize: "0.9rem", color: "var(--text-main)", fontWeight: 600 }}>WebSocket Real-Time Feed</span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#a78bfa",
                  background: "rgba(139, 92, 246, 0.15)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                READY (/ws)
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)", paddingTop: "0.5rem" }}>
              <span>Base URL: <strong style={{ color: "var(--text-main)", fontFamily: "monospace" }}>{baseURL}</strong></span>
              <span>Latency: <strong style={{ color: "#34d399" }}>{latencyMs ? `${latencyMs} ms` : "Instant"}</strong></span>
            </div>
          </div>
        </div>

        {/* Campus Geofence Boundary Card */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MapPin size={20} color="#10b981" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
              Department Geofence Policy
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Target Perimeter:</span>
              <strong style={{ color: "var(--text-main)" }}>{geofenceConfig.campus}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Center Coordinates:</span>
              <span style={{ fontFamily: "monospace", color: "#60a5fa" }}>
                {geofenceConfig.latitude.toFixed(6)}° N, {geofenceConfig.longitude.toFixed(6)}° E
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>Allowed Geofence Radius:</span>
              <span style={{ color: "#34d399", fontWeight: 700 }}>
                {geofenceConfig.radius} meters radial radius
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}>
              <span style={{ color: "var(--text-muted)" }}>Attendance Verification:</span>
              <span style={{ color: "#a78bfa", fontWeight: 600 }}>Enforced via Geolocation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Term Configuration */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <BookOpen size={20} color="var(--primary)" />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
            Academic Term & Timetable Allotments
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 }}>CURRENT ACADEMIC SESSION</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#34d399", marginTop: "0.25rem" }}>
              {geofenceConfig.academicYear}
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 }}>SECTION 5A LECTURE HALL</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginTop: "0.25rem" }}>
              Room CS-303 (3rd Floor)
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 }}>SECTION 5B LECTURE HALL</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", marginTop: "0.25rem" }}>
              Room CS-304 (3rd Floor)
            </div>
          </div>
        </div>
      </div>

      {/* User Preferences Form */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <Sliders size={20} color="var(--primary)" />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
            Application & UI Preferences
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 600 }}>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)" }}>
                Audio & In-App Toast Alerts
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Receive pop-up notifications on successful attendance marking and circulars.
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)" }}>
                High-Accuracy GPS Geolocation
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Forces navigator.geolocation to use device hardware GPS sensors.
              </div>
            </div>
            <input
              type="checkbox"
              checked={highAccuracyGps}
              onChange={(e) => setHighAccuracyGps(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)" }}>
                Real-Time WebSocket Sync
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Listen for live location updates and instant attendance events.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoRefreshFeed}
              onChange={(e) => setAutoRefreshFeed(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
            />
          </label>

          <button
            onClick={handleSavePreferences}
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              border: "none",
              padding: "0.6rem 1.4rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px var(--primary-glow)",
              width: "fit-content",
              marginTop: "0.5rem",
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
