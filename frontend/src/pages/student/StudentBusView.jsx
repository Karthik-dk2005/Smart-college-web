import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Bus, Clock, MapPin, Search, Phone, Calendar, Loader2, RefreshCw } from "lucide-react";

export default function StudentBusView() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRoutes = async (query = "") => {
    try {
      setLoading(true);
      const res = await api.getBusRoutes(query);
      if (Array.isArray(res)) {
        setRoutes(res);
      }
    } catch (err) {
      console.error("Bus fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes(searchTerm);
  }, [searchTerm]);

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
            College Transit & Bus Schedules
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Maharaja Institute of Technology Campus Transit Network (Mysore & Nanjangud Routes)
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => fetchRoutes(searchTerm)}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ position: "relative", maxWidth: "400px", marginBottom: "1.5rem" }}>
        <input
          type="text"
          className="form-control"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by route, stop name, or bus number..."
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Bus size={18} color="#6366f1" />
            <span>Active Campus Bus Routes</span>
          </h2>
          <span className="badge badge-info">{routes.length} Transit Routes</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <Loader2 size={32} className="animate-spin" color="#6366f1" />
          </div>
        ) : routes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
            No bus routes found matching "{searchTerm}".
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {routes.map((b) => (
              <div
                key={b.id}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "14px",
                  padding: "1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                        {b.route_name}
                      </span>
                      <span className="badge badge-purple">{b.route_number}</span>
                      <span className="badge badge-info">Bus #{b.bus_number}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", color: "#06b6d4", fontSize: "0.85rem" }}>
                      <MapPin size={16} />
                      <strong>Route Stops:</strong>
                      <span style={{ color: "#94a3b8" }}>{b.stops}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    {b.driver_name && (
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        Driver: <strong>{b.driver_name}</strong> {b.driver_phone && `(${b.driver_phone})`}
                      </div>
                    )}
                    <span className="badge badge-success" style={{ marginTop: "4px" }}>
                      Capacity: {b.capacity} Seats
                    </span>
                  </div>
                </div>

                {/* Timings & Schedules Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                    marginTop: "1.25rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ background: "rgba(99, 102, 241, 0.05)", padding: "0.75rem", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#a5b4fc", fontWeight: 600 }}>MORNING PICKUP</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginTop: "2px" }}>
                      {b.morning_timing}
                    </div>
                  </div>

                  <div style={{ background: "rgba(6, 182, 212, 0.05)", padding: "0.75rem", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#67e8f9", fontWeight: 600 }}>EVENING DEPARTURE</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginTop: "2px" }}>
                      {b.evening_timing}
                    </div>
                  </div>

                  <div style={{ background: "rgba(245, 158, 11, 0.05)", padding: "0.75rem", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#fcd34d", fontWeight: 600 }}>WEEKDAY SCHEDULE</div>
                    <div style={{ fontSize: "0.85rem", color: "#fff", marginTop: "2px" }}>
                      {b.weekday_schedule}
                    </div>
                  </div>

                  <div style={{ background: "rgba(139, 92, 246, 0.05)", padding: "0.75rem", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#c084fc", fontWeight: 600 }}>WEEKEND / EXAM SCHEDULE</div>
                    <div style={{ fontSize: "0.85rem", color: "#fff", marginTop: "2px" }}>
                      {b.weekend_schedule} • {b.special_schedule}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
