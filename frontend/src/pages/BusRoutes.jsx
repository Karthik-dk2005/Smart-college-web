import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { busApi } from "../services/busApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import BusRouteTable from "../components/BusRouteTable";
import Modal from "../components/Modal";
import {
  Bus,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function BusRoutes() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const currentRole = role?.toLowerCase() || "student";
  const isAdmin = currentRole === "admin";

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Bus size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.02em" }}>
              Bus Routes Directory
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              Comprehensive list of academic fleet transit routes 1–28
            </p>
          </div>
        </div>

        {isAdmin && (
          <Link
            to="/admin/buses/add"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              textDecoration: "none",
              padding: "0.65rem 1.25rem",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Plus size={18} /> + Add Bus Route
          </Link>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "var(--bg-secondary, #111827)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "12px",
          padding: "1rem",
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "260px" }}
        >
          <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
            <Search
              size={17}
              style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
            />
            <input
              type="text"
              placeholder="Search route / bus number / driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.85rem 0.55rem 2.4rem",
                background: "rgba(255, 255, 255, 0.05)",
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
              padding: "0.55rem 1rem",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "#cbd5e1",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.55rem 0.85rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#cbd5e1",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            type="button"
            onClick={fetchRoutes}
            title="Refresh routes"
            style={{
              padding: "0.55rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#cbd5e1",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div
        style={{
          background: "var(--bg-secondary, #111827)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "1rem",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#94a3b8" }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "#6366f1" }} />
            <p>Loading bus route table...</p>
          </div>
        ) : (
          <BusRouteTable
            routes={routes}
            isAdmin={isAdmin}
            onView={(r) => navigate(`/admin/buses/${r.id}`)}
            onEdit={(r) => navigate(`/admin/buses/${r.id}/edit`)}
            onDeactivate={handleOpenDeactivate}
          />
        )}
      </div>

      {/* Deactivate Modal */}
      <Modal
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        title="Confirm Route Deactivation"
      >
        {selectedRoute && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#cbd5e1", margin: 0, fontSize: "0.95rem" }}>
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
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
                Route {selectedRoute.route_number}: {selectedRoute.route_name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.25rem" }}>
                Bus: {selectedRoute.bus_number} • Driver: {selectedRoute.driver_name}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsDeactivateOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
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
