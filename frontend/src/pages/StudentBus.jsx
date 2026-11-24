import React, { useState, useEffect } from "react";
import { busApi } from "../services/busApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import StudentBusCard from "../components/StudentBusCard";
import CollegeLogo from "../components/CollegeLogo";
import {
  Bus,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  Phone,
  User,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Navigation,
  Info,
} from "lucide-react";

export default function StudentBus() {
  const { user } = useAuth();
  const { error } = useToast();

  const [activeTab, setActiveTab] = useState("my-pass"); // 'my-pass' | 'all-routes'
  const [assignment, setAssignment] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loadingPass, setLoadingPass] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [routeStops, setRouteStops] = useState({});
  const [loadingStops, setLoadingStops] = useState({});

  // Student identifier: student_profile.id or user.id
  const studentId = user?.student?.id || user?.student_id || user?.id;

  const fetchStudentBus = async () => {
    try {
      setLoadingPass(true);
      // Prefer dedicated /api/buses/my-bus or studentId fallback
      const res = await busApi.getMyBus().catch(() => busApi.getStudentBus(studentId));
      const data = res?.data?.data !== undefined ? res.data.data : res?.data;
      setAssignment(data || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setAssignment(null);
      } else {
        error(err.response?.data?.detail || err.message || "Failed to load bus assignment");
      }
    } finally {
      setLoadingPass(false);
    }
  };

  const fetchAllRoutes = async (search = "") => {
    try {
      setLoadingRoutes(true);
      const res = await busApi.getBuses({ search });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setRoutes(data);
    } catch (err) {
      error("Failed to load campus bus routes.");
    } finally {
      setLoadingRoutes(false);
    }
  };

  const toggleRouteStops = async (routeId) => {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
      return;
    }

    setExpandedRouteId(routeId);

    if (!routeStops[routeId]) {
      try {
        setLoadingStops((prev) => ({ ...prev, [routeId]: true }));
        const res = await busApi.getBusStops(routeId);
        const stops = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setRouteStops((prev) => ({ ...prev, [routeId]: stops }));
      } catch (err) {
        console.error("Failed to fetch stops for route", routeId, err);
      } finally {
        setLoadingStops((prev) => ({ ...prev, [routeId]: false }));
      }
    }
  };

  useEffect(() => {
    fetchStudentBus();
  }, [studentId]);

  useEffect(() => {
    if (activeTab === "all-routes") {
      fetchAllRoutes(searchTerm);
    }
  }, [activeTab, searchTerm]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "980px", margin: "0 auto" }}>
      {/* Page Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.4) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          borderRadius: "18px",
          padding: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ background: "#ffffff", padding: "6px 12px", borderRadius: "12px", display: "flex", alignItems: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}>
            <CollegeLogo size="sm" style={{ height: "46px", width: "auto" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
              <span
                style={{
                  background: "rgba(99, 102, 241, 0.25)",
                  color: "#c7d2fe",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "10px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Campus Transit Network
              </span>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Maharaja Institute of Technology Thandavapura</span>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.02em" }}>
              Student Bus Information & Transit
            </h1>
            <p style={{ margin: "0.3rem 0 0 0", color: "#cbd5e1", fontSize: "0.85rem" }}>
              Official college bus routes (Routes 1–28), assigned boarding points, schedules & contacts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === "my-pass") fetchStudentBus();
            else fetchAllRoutes(searchTerm);
          }}
          disabled={loadingPass || loadingRoutes}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.6rem 1.15rem",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "10px",
            color: "#f8fafc",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <RefreshCw size={15} className={loadingPass || loadingRoutes ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          paddingBottom: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("my-pass")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.65rem 1.25rem",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            border: activeTab === "my-pass" ? "1px solid #6366f1" : "1px solid transparent",
            background: activeTab === "my-pass" ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.03)",
            color: activeTab === "my-pass" ? "#c7d2fe" : "#94a3b8",
            transition: "all 0.2s ease",
          }}
        >
          <Bus size={17} />
          <span>My Allocated Bus Pass</span>
          {assignment && (
            <span
              style={{
                background: "#10b981",
                color: "#ffffff",
                padding: "0.1rem 0.45rem",
                borderRadius: "12px",
                fontSize: "0.7rem",
                fontWeight: 800,
              }}
            >
              Route #{assignment.route_number}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all-routes")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.65rem 1.25rem",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            border: activeTab === "all-routes" ? "1px solid #6366f1" : "1px solid transparent",
            background: activeTab === "all-routes" ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.03)",
            color: activeTab === "all-routes" ? "#c7d2fe" : "#94a3b8",
            transition: "all 0.2s ease",
          }}
        >
          <Layers size={17} />
          <span>All 28 Campus Bus Routes & Timetables</span>
        </button>
      </div>

      {/* TAB 1: MY ALLOCATED BUS PASS */}
      {activeTab === "my-pass" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Main Bus Assignment Display Card */}
          <StudentBusCard assignment={assignment} loading={loadingPass} />

          {/* College Transport Guidelines */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "1.25rem 1.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#fbbf24", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                <Clock size={16} />
                <span>Punctuality & Boarding Protocol</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5 }}>
                Students must arrive at their designated boarding stop at least 5 minutes prior to the scheduled pickup time. Buses depart promptly at 04:30 PM from the campus main bus parking bay.
              </p>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#34d399", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                <Shield size={16} />
                <span>Transport Identity & Safety</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5 }}>
                Always carry your official MITT Student ID Card and digital SmartDept transit pass. Transport coordinators and bus staff may verify passes at any time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL 28 CAMPUS BUS ROUTES & TIMETABLES */}
      {activeTab === "all-routes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Search bar & filter */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by route (e.g. Route 12), stop, bus reg, or driver..."
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem 0.65rem 2.5rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "10px",
                  color: "#f8fafc",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              Showing <strong>{routes.length}</strong> college routes
            </div>
          </div>

          {/* Routes Directory List */}
          {loadingRoutes ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <RefreshCw size={28} className="animate-spin" style={{ color: "#6366f1", marginBottom: "0.5rem" }} />
              <p>Loading campus transit routes...</p>
            </div>
          ) : routes.length === 0 ? (
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "14px",
                padding: "3rem",
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              No bus routes found matching "{searchTerm}".
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {routes.map((r) => {
                const isMyAssignedRoute = assignment && assignment.route_number === r.route_number;
                const isExpanded = expandedRouteId === r.id;
                const stops = routeStops[r.id] || [];
                const isLoadingStops = loadingStops[r.id];

                return (
                  <div
                    key={r.id}
                    style={{
                      background: isMyAssignedRoute
                        ? "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(30, 58, 138, 0.25) 100%)"
                        : "rgba(15, 23, 42, 0.75)",
                      border: isMyAssignedRoute
                        ? "1.5px solid rgba(99, 102, 241, 0.6)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "1.25rem 1.5rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Header Row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                        <div
                          style={{
                            background: isMyAssignedRoute ? "#4f46e5" : "rgba(255, 255, 255, 0.08)",
                            color: "#ffffff",
                            padding: "0.45rem 0.85rem",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            textAlign: "center",
                            minWidth: "50px",
                          }}
                        >
                          R-{r.route_number}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                              {r.route_name}
                            </h3>
                            {isMyAssignedRoute && (
                              <span
                                style={{
                                  background: "rgba(16, 185, 129, 0.2)",
                                  color: "#34d399",
                                  border: "1px solid rgba(16, 185, 129, 0.4)",
                                  padding: "0.15rem 0.55rem",
                                  borderRadius: "12px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                }}
                              >
                                <CheckCircle2 size={12} /> Your Allocated Route
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem", fontSize: "0.8rem", color: "#94a3b8", flexWrap: "wrap" }}>
                            <span>Bus Reg: <strong style={{ color: "#e2e8f0", fontFamily: "monospace" }}>{r.bus_number}</strong></span>
                            <span>•</span>
                            <span>Driver: <strong style={{ color: "#e2e8f0" }}>{r.driver_name}</strong></span>
                            {r.driver_phone && r.driver_phone !== "Not provided" && (
                              <a
                                href={`tel:${r.driver_phone.replace(/\s+/g, "")}`}
                                style={{ color: "#34d399", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                              >
                                <Phone size={12} /> {r.driver_phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Route Timings Badges */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>
                          Dept: {r.departure_time || "07:45 AM"}
                        </div>
                        <div style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.75rem", color: "#a5b4fc", fontWeight: 600 }}>
                          Campus: {r.arrival_time || "08:35 AM"}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleRouteStops(r.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.35rem 0.75rem",
                            background: isExpanded ? "rgba(99, 102, 241, 0.3)" : "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "8px",
                            color: "#cbd5e1",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <span>{isExpanded ? "Hide Stops" : "View Stops"}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Stops Accordion */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: "1.25rem",
                          paddingTop: "1.25rem",
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        <div style={{ fontSize: "0.8rem", color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <MapPin size={14} />
                          <span>Intermediate Boarding Stops & Timings</span>
                        </div>

                        {isLoadingStops ? (
                          <div style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.82rem" }}>
                            Loading route stops...
                          </div>
                        ) : stops.length === 0 ? (
                          <div style={{ padding: "0.75rem", color: "#64748b", fontSize: "0.82rem" }}>
                            Direct route to MIT Thandavapura Campus Main Gate.
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                              gap: "0.75rem",
                            }}
                          >
                            {stops.map((s, idx) => (
                              <div
                                key={s.id || idx}
                                style={{
                                  background: "rgba(255, 255, 255, 0.02)",
                                  border: "1px solid rgba(255, 255, 255, 0.05)",
                                  borderRadius: "10px",
                                  padding: "0.65rem 0.85rem",
                                }}
                              >
                                <div style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 700 }}>
                                  STOP #{s.stop_order || idx + 1}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#f8fafc", margin: "0.15rem 0" }}>
                                  {s.stop_name}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                                  <span style={{ color: "#34d399" }}>Pickup: {s.pickup_time || "07:45 AM"}</span>
                                  <span style={{ color: "#fbbf24" }}>Drop: {s.drop_time || "05:15 PM"}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* College Transit Helpline Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          fontSize: "0.82rem",
          color: "#94a3b8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Shield size={17} style={{ color: "#6366f1", flexShrink: 0 }} />
          <span>
            MIT Thandavapura Campus Transport Helpline: <strong>+91 821 234 5678</strong> | Office: Admin Block Ground Floor
          </span>
        </div>
        <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
          Academic Year 2026-2027 • SmartDept Transit Management
        </span>
      </div>
    </div>
  );
}
