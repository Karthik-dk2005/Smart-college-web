import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import locationsApi from "../api/locations";
import TableSkeleton from "../components/TableSkeleton";
import {
  MapPin,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Clock,
  RefreshCw,
  Compass,
  AlertTriangle,
  History,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function LiveLocation() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [trackingActive, setTrackingActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const watchIdRef = useRef(null);
  const wsRef = useRef(null);

  // Department Geofence reference coordinates (from backend)
  const DEPARTMENT_COORDS = {
    name: "Department of Computer Science & Engineering",
    lat: 12.1837,
    lng: 76.6942,
    radius: 300, // meters
  };

  useEffect(() => {
    fetchHistory();
    fetchCurrentFromBackend();

    return () => {
      stopTracking();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user]);

  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const res = await locationsApi.getHistory(user.id, 20);
      if (res.data?.data) {
        setLocationHistory(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch location history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchCurrentFromBackend = async () => {
    if (!user?.id) return;
    try {
      const res = await locationsApi.getCurrent(user.id);
      if (res.data?.data) {
        setCurrentLocation(res.data.data);
      }
    } catch (err) {
      // It's normal if no location is recorded yet
    }
  };

  const initWebSocket = () => {
    if (!user?.id || wsRef.current) return;
    const token = localStorage.getItem("access_token");
    const wsUrl = locationsApi.getWebSocketUrl(user.id, token);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setCurrentLocation(data);
          setLocationHistory((prev) => [data, ...prev.slice(0, 19)]);
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      console.error("WebSocket connection failed:", e);
    }
  };

  const sendLocationToBackend = async (pos) => {
    const payload = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: new Date(pos.timestamp).toISOString(),
      location_type: "device",
    };

    try {
      const res = await locationsApi.update(payload);
      if (res.data?.data) {
        setCurrentLocation(res.data.data);
        setLocationHistory((prev) => [res.data.data, ...prev.slice(0, 19)]);
        setPermissionError(null);
        return res.data.data;
      }
    } catch (err) {
      console.error("Failed to post location to backend:", err);
      addToast({
        title: "Sync Error",
        message: "Failed to record location to server.",
        type: "error",
      });
    }
  };

  const handleCaptureOnce = () => {
    if (!navigator.geolocation) {
      setPermissionError("Geolocation is not supported by your browser.");
      addToast({
        title: "Unsupported Browser",
        message: "Geolocation is not supported by your browser.",
        type: "error",
      });
      return;
    }

    setDetecting(true);
    setPermissionError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setDetecting(false);
        const result = await sendLocationToBackend(pos);
        if (result) {
          if (result.in_geofence) {
            addToast({
              title: "Campus Verified",
              message: `Inside Department boundary (${Math.round(result.distance_meters)}m from center).`,
              type: "success",
            });
          } else {
            addToast({
              title: "Outside Campus Area",
              message: `Detected ${Math.round(result.distance_meters)}m away from Department.`,
              type: "warning",
            });
          }
        }
      },
      (err) => {
        setDetecting(false);
        let errorMsg = "Unable to retrieve your location.";
        if (err.code === 1) {
          errorMsg = "Location permission denied. Please allow GPS access in your browser.";
        } else if (err.code === 2) {
          errorMsg = "Location unavailable. Please check your network/GPS connection.";
        } else if (err.code === 3) {
          errorMsg = "Location request timed out. Please try again.";
        }
        setPermissionError(errorMsg);
        addToast({
          title: "Location Error",
          message: errorMsg,
          type: "error",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setPermissionError("Geolocation is not supported by your browser.");
      return;
    }

    setTrackingActive(true);
    setPermissionError(null);
    initWebSocket();

    // Trigger immediate first read
    handleCaptureOnce();

    // Set up continuous watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        sendLocationToBackend(pos);
      },
      (err) => {
        if (err.code === 1) {
          setPermissionError("Location permission denied. Tracking stopped.");
          stopTracking();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingActive(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)" }}>
              Live Geolocation & Geofence
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
                background: trackingActive ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.2)",
                color: trackingActive ? "#34d399" : "#94a3b8",
                border: `1px solid ${trackingActive ? "rgba(16, 185, 129, 0.3)" : "rgba(100, 116, 139, 0.3)"}`,
              }}
            >
              <Radio size={13} className={trackingActive ? "animate-pulse" : ""} />
              {trackingActive ? "REAL-TIME TRACKING ACTIVE" : "TRACKING IDLE"}
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Live browser geolocation verified against the Department Geofence boundary (Radius: 300m).
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={handleCaptureOnce}
            disabled={detecting}
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
              cursor: detecting ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={16} className={detecting ? "animate-spin" : ""} />
            {detecting ? "Detecting GPS..." : "Detect Location Now"}
          </button>

          {trackingActive ? (
            <button
              onClick={stopTracking}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(244, 63, 94, 0.15)",
                color: "#fb7185",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                padding: "0.6rem 1.1rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Radio size={16} />
              Stop Live Tracking
            </button>
          ) : (
            <button
              onClick={startTracking}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--primary)",
                color: "#ffffff",
                border: "none",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 14px var(--primary-glow)",
              }}
            >
              <Navigation size={16} />
              Start Live Tracking
            </button>
          )}
        </div>
      </div>

      {/* Permission / Geolocation Warning */}
      {permissionError && (
        <div
          style={{
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#fb7185",
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>
            <strong>Location Access Required:</strong> {permissionError}
          </div>
        </div>
      )}

      {/* Main Grid: Live Status Card & Radar Visualizer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Current Live Location Status Card */}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Compass size={20} color="var(--primary)" />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                Live Location Status
              </h2>
            </div>
            {wsConnected && (
              <span style={{ fontSize: "0.75rem", color: "#34d399", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
                WebSocket Live
              </span>
            )}
          </div>

          {currentLocation ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Geofence Status Highlight */}
              <div
                style={{
                  background: currentLocation.in_geofence
                    ? "rgba(16, 185, 129, 0.08)"
                    : "rgba(245, 158, 11, 0.08)",
                  border: `1px solid ${
                    currentLocation.in_geofence
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(245, 158, 11, 0.3)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                {currentLocation.in_geofence ? (
                  <ShieldCheck size={36} color="#10b981" />
                ) : (
                  <ShieldAlert size={36} color="#f59e0b" />
                )}
                <div>
                  <div
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: currentLocation.in_geofence ? "#34d399" : "#fbbf24",
                    }}
                  >
                    {currentLocation.in_geofence
                      ? "Inside Department Geofence"
                      : "Outside Department Perimeter"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {currentLocation.in_geofence
                      ? `Verified within campus range (${Math.round(currentLocation.distance_meters || 0)}m from center).`
                      : `Currently ${Math.round(currentLocation.distance_meters || 0)}m away. Allowed radius is ${DEPARTMENT_COORDS.radius}m.`}
                  </div>
                </div>
              </div>

              {/* Exact Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: "0.9rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
                    Latitude
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginTop: "0.25rem" }}>
                    {currentLocation.latitude ? Number(currentLocation.latitude).toFixed(6) : "—"}° N
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: "0.9rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
                    Longitude
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginTop: "0.25rem" }}>
                    {currentLocation.longitude ? Number(currentLocation.longitude).toFixed(6) : "—"}° E
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: "0.9rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
                    GPS Accuracy
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#60a5fa", marginTop: "0.25rem" }}>
                    ± {currentLocation.accuracy ? Math.round(currentLocation.accuracy) : 10} meters
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: "0.9rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
                    Distance to Center
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa", marginTop: "0.25rem" }}>
                    {currentLocation.distance_meters !== undefined
                      ? `${Math.round(currentLocation.distance_meters)}m`
                      : "Calculating..."}
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  paddingTop: "0.5rem",
                }}
              >
                <Clock size={15} />
                <span>
                  Last detected:{" "}
                  <strong>
                    {currentLocation.timestamp
                      ? new Date(currentLocation.timestamp).toLocaleTimeString() +
                        " — " +
                        new Date(currentLocation.timestamp).toLocaleDateString()
                      : "Just now"}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "2.5rem 1rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <MapPin size={28} />
              </div>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>
                  No GPS Location Detected Yet
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem", maxWidth: 300 }}>
                  Click "Detect Location Now" or start live tracking to read coordinates from your device's browser.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Campus Geofence Visualizer & Radar */}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={20} color="#34d399" />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                Geofence Radar Visualizer
              </h2>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-muted)",
              }}
            >
              Radius: {DEPARTMENT_COORDS.radius}m
            </span>
          </div>

          {/* Interactive Radar Graphic */}
          <div
            style={{
              height: 240,
              background: "radial-gradient(circle at center, #0f1c3a 0%, #080d1a 100%)",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Concentric distance rings */}
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: "50%",
                border: "1px dashed rgba(59, 130, 246, 0.35)",
                position: "absolute",
              }}
            />
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                background: "rgba(16, 185, 129, 0.05)",
                position: "absolute",
              }}
            />
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                position: "absolute",
              }}
            />

            {/* Crosshairs */}
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: 1,
                background: "rgba(255, 255, 255, 0.08)",
              }}
            />
            <div
              style={{
                position: "absolute",
                height: "100%",
                width: 1,
                background: "rgba(255, 255, 255, 0.08)",
              }}
            />

            {/* Department Hub Center Pin */}
            <div
              style={{
                position: "absolute",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#3b82f6",
                  border: "2px solid #ffffff",
                  boxShadow: "0 0 10px #3b82f6",
                }}
              />
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "#93c5fd",
                  marginTop: 3,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                DEPT HUB
              </span>
            </div>

            {/* User GPS Pin Ping */}
            {currentLocation && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 3,
                  transform: `translate(${
                    currentLocation.in_geofence ? "30px, -25px" : "85px, -70px"
                  })`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "all 0.5s ease-out",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: currentLocation.in_geofence ? "#10b981" : "#f43f5e",
                    border: "2px solid #ffffff",
                    boxShadow: currentLocation.in_geofence
                      ? "0 0 12px #10b981"
                      : "0 0 12px #f43f5e",
                    animation: "pulse 2s infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: currentLocation.in_geofence ? "#34d399" : "#fb7185",
                    marginTop: 3,
                    background: "rgba(0,0,0,0.7)",
                    padding: "1px 4px",
                    borderRadius: 3,
                  }}
                >
                  YOU ({Math.round(currentLocation.distance_meters || 0)}m)
                </span>
              </div>
            )}
          </div>

          {/* Department Configuration Info */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Target Zone:</span>
              <strong style={{ color: "var(--text-main)" }}>{DEPARTMENT_COORDS.name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Coordinates:</span>
              <span style={{ fontFamily: "monospace", color: "#93c5fd" }}>
                {DEPARTMENT_COORDS.lat.toFixed(6)}° N, {DEPARTMENT_COORDS.lng.toFixed(6)}° E
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Geofence Boundary:</span>
              <span style={{ color: "#34d399", fontWeight: 600 }}>
                {DEPARTMENT_COORDS.radius} meters radial radius
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Location History Table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <History size={18} color="var(--primary)" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
              Recent GPS Audit Log
            </h2>
          </div>
          <button
            onClick={fetchHistory}
            style={{
              background: "transparent",
              border: "1px solid var(--border-medium)",
              color: "var(--text-muted)",
              padding: "0.4rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <RefreshCw size={13} />
            Refresh Log
          </button>
        </div>

        {loadingHistory ? (
          <TableSkeleton rows={4} columns={5} />
        ) : locationHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No GPS pings recorded in this session. Start tracking or click "Detect Location Now".
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    TIMESTAMP
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    LATITUDE / LONGITUDE
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    ACCURACY
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    GEOFENCE STATUS
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    TYPE
                  </th>
                </tr>
              </thead>
              <tbody>
                {locationHistory.map((loc, idx) => (
                  <tr
                    key={loc.id || idx}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {new Date(loc.timestamp).toLocaleTimeString()} —{" "}
                      {new Date(loc.timestamp).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", fontFamily: "monospace", color: "var(--text-main)" }}>
                      {Number(loc.latitude).toFixed(6)}°, {Number(loc.longitude).toFixed(6)}°
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "#60a5fa" }}>
                      ±{loc.accuracy ? Math.round(loc.accuracy) : 10}m
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: loc.in_geofence ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: loc.in_geofence ? "#34d399" : "#fbbf24",
                        }}
                      >
                        {loc.in_geofence ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {loc.in_geofence ? "Inside Campus" : "Outside Boundary"}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "capitalize" }}>
                      {loc.location_type || "device"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
