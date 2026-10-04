import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { busApi } from "../services/busApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import BusRouteCard from "../components/BusRouteCard";
import BusRouteTable from "../components/BusRouteTable";
import Modal from "../components/Modal";
import {
  Bus,
  Search,
  Filter,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  AlertTriangle,
} from "lucide-react";

export default function BusDashboard() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const currentRole = role?.toLowerCase() || "student";
  const isAdmin = currentRole === "admin";

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or table

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Deactivate Modal state
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;

      const res = await busApi.getBuses(params);
      const data = res.data?.data || res.data || [];
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to load bus routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRoutes();
  };

  const handleOpenDeactivate = (route) => {
    setSelectedRoute(route);
    setIsDeactivateOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedRoute) return;
    try {
      setActionLoading(true);
      const res = await busApi.deleteBus(selectedRoute.id);
      success(res.data?.message || `Bus Route ${selectedRoute.route_number} deactivated successfully.`);
      setIsDeactivateOpen(false);
      setSelectedRoute(null);
      fetchRoutes();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to deactivate route");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: "16px",
          padding: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              style={{
                background: "rgba(99, 102, 241, 0.25)",
                color: "#c7d2fe",
                padding: "0.2rem 0.6rem",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Transit Fleet
            </span>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Campus Bus Routes 1–28</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
            Bus Routes & Fleet Management
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            Real-time schedules, stops allocation, and student bus transit tracking.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isAdmin && (
            <Link
              to="/admin/buses/add"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0.65rem 1.25rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Plus size={16} /> + Add Bus Route
            </Link>
          )}

          <button
            onClick={fetchRoutes}
            disabled={loading}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "0.65rem",
              color: "#f8fafc",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Filters & View Toggle */}
      <div
        style={{
          background: "rgba(17, 24, 39, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search route / bus number / driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.85rem 0.55rem 2.4rem",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              color: "#c7d2fe",
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        {/* Filters & View Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Filter size={15} color="#94a3b8" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.55rem 0.85rem",
                color: "#cbd5e1",
                fontSize: "0.82rem",
                outline: "none",
              }}
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Grid vs Table View Mode */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "2px",
              display: "flex",
            }}
          >
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              style={{
                background: viewMode === "grid" ? "rgba(99, 102, 241, 0.3)" : "transparent",
                color: viewMode === "grid" ? "#fff" : "#94a3b8",
                border: "none",
                borderRadius: "6px",
                padding: "0.4rem 0.6rem",
                cursor: "pointer",
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              style={{
                background: viewMode === "table" ? "rgba(99, 102, 241, 0.3)" : "transparent",
                color: viewMode === "table" ? "#fff" : "#94a3b8",
                border: "none",
                borderRadius: "6px",
                padding: "0.4rem 0.6rem",
                cursor: "pointer",
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Routes Display (28 Cards Grid or Table) */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#94a3b8" }}>
          <RefreshCw size={28} className="spin" style={{ margin: "0 auto 1rem", color: "#818cf8" }} />
          Loading Bus Routes 1–28...
        </div>
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {routes.map((route) => (
            <BusRouteCard key={route.id} route={route} isAdmin={isAdmin} />
          ))}
        </div>
      ) : (
        <div
          style={{
            background: "rgba(17, 24, 39, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <BusRouteTable
            routes={routes}
            isAdmin={isAdmin}
            onDeactivate={handleOpenDeactivate}
          />
        </div>
      )}

      {/* Deactivate Route Modal */}
      <Modal isOpen={isDeactivateOpen} onClose={() => setIsDeactivateOpen(false)} title="Deactivate Bus Route">
        {selectedRoute && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
              Are you sure you want to deactivate this bus route?
            </p>

            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "10px",
                padding: "1rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#f87171", fontWeight: 600, textTransform: "uppercase" }}>
                Route:
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.2rem" }}>
                Route {selectedRoute.route_number} — {selectedRoute.route_name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.2rem" }}>
                Bus: {selectedRoute.bus_number || "Not provided"} • {selectedRoute.start_point} → {selectedRoute.end_point}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsDeactivateOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#cbd5e1",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDeactivate}
                style={{
                  background: "#dc2626",
                  border: "none",
                  color: "#fff",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {actionLoading ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
