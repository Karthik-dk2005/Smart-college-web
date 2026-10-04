import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { busApi } from "../services/busApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import BusStopTable from "../components/BusStopTable";
import BusStopForm from "../components/BusStopForm";
import Modal from "../components/Modal";
import {
  Bus,
  ArrowLeft,
  Edit2,
  PowerOff,
  Plus,
  RefreshCw,
  MapPin,
  Clock,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  Navigation,
} from "lucide-react";

export default function BusRouteDetails() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { success, error } = useToast();

  const currentRole = role?.toLowerCase() || "student";
  const isAdmin = currentRole === "admin";

  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stop Modal States
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [stopFormLoading, setStopFormLoading] = useState(false);

  // Deactivate Stop Modal State
  const [selectedStopForDelete, setSelectedStopForDelete] = useState(null);
  const [isDeleteStopOpen, setIsDeleteStopOpen] = useState(false);
  const [deleteStopLoading, setDeleteStopLoading] = useState(false);

  // Deactivate Route Modal State
  const [isDeactivateRouteOpen, setIsDeactivateRouteOpen] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchRouteAndStops = async () => {
    try {
      setLoading(true);
      const [resRoute, resStops] = await Promise.all([
        busApi.getBus(routeId),
        busApi.getBusStops(routeId),
      ]);

      const rData = resRoute.data?.data || resRoute.data;
      const sData = resStops.data?.data || resStops.data || [];

      setRoute(rData);
      setStops(Array.isArray(sData) ? sData : []);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to load route details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeId) {
      fetchRouteAndStops();
    }
  }, [routeId]);

  // Handle Stop Form Submission (Add or Edit)
  const handleStopSubmit = async (formData) => {
    try {
      setStopFormLoading(true);
      if (editingStop) {
        await busApi.updateBusStop(editingStop.id, formData);
        success("✓ Bus stop updated successfully.");
      } else {
        await busApi.createBusStop(routeId, formData);
        success("✓ Bus stop added successfully.");
      }
      setIsStopModalOpen(false);
      setEditingStop(null);
      fetchRouteAndStops();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to save bus stop");
    } finally {
      setStopFormLoading(false);
    }
  };

  // Open Edit Stop
  const handleEditStop = (stop) => {
    setEditingStop(stop);
    setIsStopModalOpen(true);
  };

  // Open Delete/Deactivate Stop Confirm
  const handleDeleteStopPrompt = (stop) => {
    setSelectedStopForDelete(stop);
    setIsDeleteStopOpen(true);
  };

  const handleConfirmDeleteStop = async () => {
    if (!selectedStopForDelete) return;
    try {
      setDeleteStopLoading(true);
      await busApi.deleteBusStop(selectedStopForDelete.id);
      success("✓ Bus stop deactivated/removed successfully.");
      setIsDeleteStopOpen(false);
      setSelectedStopForDelete(null);
      fetchRouteAndStops();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to remove stop");
    } finally {
      setDeleteStopLoading(false);
    }
  };

  // Confirm Route Deactivation
  const handleConfirmDeactivateRoute = async () => {
    try {
      setDeactivateLoading(true);
      const res = await busApi.deleteBus(routeId);
      success(res.data?.message || `Bus Route ${route?.route_number} deactivated successfully.`);
      setIsDeactivateRouteOpen(false);
      fetchRouteAndStops();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to deactivate route");
    } finally {
      setDeactivateLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#94a3b8" }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "#6366f1" }} />
        <p>Loading route specifications and stops...</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "3rem auto",
          textAlign: "center",
          padding: "2rem",
          background: "rgba(239, 68, 68, 0.05)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "12px",
        }}
      >
        <AlertCircle size={32} style={{ color: "#ef4444", margin: "0 auto 0.75rem auto" }} />
        <h2 style={{ color: "#f8fafc" }}>Bus Route Not Found</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
          The requested route was not found in the transit registry.
        </p>
        <Link
          to="/admin/buses"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            padding: "0.5rem 1.25rem",
            background: "#6366f1",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to Buses
        </Link>
      </div>
    );
  }

  const isActive = route.status === "active";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top Navigation & Status Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <Link
          to="/admin/buses"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#94a3b8",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <ArrowLeft size={16} />
          Back to Bus Directory
        </Link>

        {isAdmin && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link
              to={`/admin/buses/${routeId}/edit`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#a5b4fc",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              <Edit2 size={15} /> Edit Route
            </Link>

            {isActive && (
              <button
                type="button"
                onClick={() => setIsDeactivateRouteOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <PowerOff size={15} /> Deactivate Route
              </button>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1: BUS ROUTE DETAILS */}
      <div
        style={{
          background: "var(--bg-secondary, #111827)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.35rem",
                boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
              }}
            >
              #{route.route_number}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  {route.route_name || `Route ${route.route_number}`}
                </h1>
                <span
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    color: isActive ? "#34d399" : "#f87171",
                  }}
                >
                  {route.status || "active"}
                </span>
              </div>
              <p style={{ margin: "0.3rem 0 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
                BUS ROUTE DETAILS
              </p>
            </div>
          </div>
        </div>

        {/* Route Details Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Route Number:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.25rem" }}>
              Route {route.route_number}
            </span>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Route Name:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 600, color: "#f8fafc", marginTop: "0.25rem" }}>
              {route.route_name || "Not provided"}
            </span>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Bus Number:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 600, color: "#f8fafc", marginTop: "0.25rem" }}>
              {route.bus_number || "Not provided"}
            </span>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Driver:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 600, color: "#f8fafc", marginTop: "0.25rem" }}>
              {route.driver_name || "Not provided"}
            </span>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Driver Phone:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 600, color: "#f8fafc", marginTop: "0.25rem" }}>
              {route.driver_phone || "Not provided"}
            </span>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Start Point:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 600, color: "#f8fafc", marginTop: "0.25rem" }}>
              {route.start_point || "Not provided"}
            </span>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              End Point:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 600, color: "#f8fafc", marginTop: "0.25rem" }}>
              {route.end_point || "Not provided"}
            </span>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Departure:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 700, color: "#34d399", marginTop: "0.25rem" }}>
              {route.departure_time || "Not provided"}
            </span>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Arrival:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 700, color: "#f59e0b", marginTop: "0.25rem" }}>
              {route.arrival_time || "Not provided"}
            </span>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Status:
            </span>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 700, color: isActive ? "#34d399" : "#f87171", marginTop: "0.25rem", textTransform: "capitalize" }}>
              {route.status || "active"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: BUS STOPS */}
      <div
        style={{
          background: "var(--bg-secondary, #111827)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Navigation size={20} style={{ color: "#6366f1" }} />
              BUS STOPS
            </h2>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              Sequential boarding locations, designated timings, and geographic markers
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingStop(null);
                setIsStopModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.55rem 1.15rem",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
              }}
            >
              <Plus size={16} /> Add Bus Stop
            </button>
          )}
        </div>

        <BusStopTable
          stops={stops}
          isAdmin={isAdmin}
          onEdit={handleEditStop}
          onDelete={handleDeleteStopPrompt}
        />
      </div>

      {/* MODAL 1: ADD / EDIT BUS STOP */}
      <Modal
        isOpen={isStopModalOpen}
        onClose={() => {
          setIsStopModalOpen(false);
          setEditingStop(null);
        }}
        title={editingStop ? "Edit Bus Stop" : `Add Bus Stop — Route ${route.route_number}`}
      >
        <BusStopForm
          initialData={editingStop || { stop_order: stops.length + 1 }}
          isEdit={Boolean(editingStop)}
          onSubmit={handleStopSubmit}
          onCancel={() => {
            setIsStopModalOpen(false);
            setEditingStop(null);
          }}
          loading={stopFormLoading}
        />
      </Modal>

      {/* MODAL 2: CONFIRM DEACTIVATE/DELETE STOP */}
      <Modal
        isOpen={isDeleteStopOpen}
        onClose={() => setIsDeleteStopOpen(false)}
        title="Confirm Stop Deactivation"
      >
        {selectedStopForDelete && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#cbd5e1", margin: 0, fontSize: "0.95rem" }}>
              Are you sure you want to deactivate or remove this bus stop?
            </p>

            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "10px",
                padding: "1rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#f87171", fontWeight: 600 }}>STOP TO REMOVE:</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.2rem" }}>
                #{selectedStopForDelete.stop_order} — {selectedStopForDelete.stop_name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.3rem" }}>
                Pickup: {selectedStopForDelete.pickup_time || "Not provided"} • Drop: {selectedStopForDelete.drop_time || "Not provided"}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsDeleteStopOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
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
                disabled={deleteStopLoading}
                onClick={handleConfirmDeleteStop}
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
                {deleteStopLoading ? "Processing..." : "Deactivate Stop"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: CONFIRM ROUTE DEACTIVATION */}
      <Modal
        isOpen={isDeactivateRouteOpen}
        onClose={() => setIsDeactivateRouteOpen(false)}
        title="Confirm Route Deactivation"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "#cbd5e1", fontSize: "0.95rem", margin: 0 }}>
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
              Route {route.route_number}: {route.route_name}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.25rem" }}>
              Bus: {route.bus_number} • Driver: {route.driver_name}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setIsDeactivateRouteOpen(false)}
              style={{
                background: "rgba(255,255,255,0.06)",
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
              disabled={deactivateLoading}
              onClick={handleConfirmDeactivateRoute}
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
              {deactivateLoading ? "Deactivating..." : "Deactivate"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
