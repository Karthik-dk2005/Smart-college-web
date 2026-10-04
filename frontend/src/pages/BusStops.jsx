import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { busApi } from "../services/busApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import BusStopTable from "../components/BusStopTable";
import BusStopForm from "../components/BusStopForm";
import Modal from "../components/Modal";
import {
  MapPin,
  Bus,
  Plus,
  RefreshCw,
  Search,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function BusStops() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentRole = role?.toLowerCase() || "student";
  const isAdmin = currentRole === "admin";

  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(searchParams.get("routeId") || "");
  const [stops, setStops] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingStops, setLoadingStops] = useState(false);

  // Stop Add/Edit Modal
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [stopFormLoading, setStopFormLoading] = useState(false);

  // Stop Delete Confirm Modal
  const [selectedStopForDelete, setSelectedStopForDelete] = useState(null);
  const [isDeleteStopOpen, setIsDeleteStopOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load All Routes for the Dropdown Selector
  const fetchRoutes = async () => {
    try {
      setLoadingRoutes(true);
      const res = await busApi.getBuses();
      const rList = res.data?.data || res.data || [];
      const list = Array.isArray(rList) ? rList : [];
      setRoutes(list);

      // Auto-select first route or route from URL
      if (!selectedRouteId && list.length > 0) {
        setSelectedRouteId(String(list[0].id));
      }
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to load bus routes");
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Load stops whenever selectedRouteId changes
  const fetchStops = async () => {
    if (!selectedRouteId) return;
    try {
      setLoadingStops(true);
      const res = await busApi.getBusStops(selectedRouteId);
      const sList = res.data?.data || res.data || [];
      setStops(Array.isArray(sList) ? sList : []);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to load stops for selected route");
    } finally {
      setLoadingStops(false);
    }
  };

  useEffect(() => {
    if (selectedRouteId) {
      setSearchParams({ routeId: selectedRouteId });
      fetchStops();
    }
  }, [selectedRouteId]);

  const handleStopSubmit = async (formData) => {
    try {
      setStopFormLoading(true);
      if (editingStop) {
        await busApi.updateBusStop(editingStop.id, formData);
        success("✓ Bus stop updated successfully.");
      } else {
        await busApi.createBusStop(selectedRouteId, formData);
        success("✓ Bus stop added successfully.");
      }
      setIsStopModalOpen(false);
      setEditingStop(null);
      fetchStops();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to save bus stop");
    } finally {
      setStopFormLoading(false);
    }
  };

  const handleEditStop = (stop) => {
    setEditingStop(stop);
    setIsStopModalOpen(true);
  };

  const handleDeleteStopPrompt = (stop) => {
    setSelectedStopForDelete(stop);
    setIsDeleteStopOpen(true);
  };

  const handleConfirmDeleteStop = async () => {
    if (!selectedStopForDelete) return;
    try {
      setDeleteLoading(true);
      await busApi.deleteBusStop(selectedStopForDelete.id);
      success("✓ Bus stop deactivated/removed successfully.");
      setIsDeleteStopOpen(false);
      setSelectedStopForDelete(null);
      fetchStops();
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to remove stop");
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeRouteObj = routes.find((r) => String(r.id) === String(selectedRouteId));

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
            <MapPin size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
              Bus Stops Directory
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              Configure boarding points, scheduled pickup timings, and drop intervals
            </p>
          </div>
        </div>

        {activeRouteObj && (
          <Link
            to={`/admin/buses/${activeRouteObj.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#fff",
              textDecoration: "none",
              padding: "0.6rem 1.1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            View Route Details <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {/* Select Route Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          background: "var(--bg-secondary, #111827)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "260px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", whiteSpace: "nowrap" }}>
            Select Bus Route:
          </label>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            disabled={loadingRoutes}
            style={{
              flex: 1,
              maxWidth: "360px",
              padding: "0.55rem 0.85rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 600,
              outline: "none",
            }}
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id} style={{ background: "#1e293b", color: "#fff" }}>
                Route {r.route_number}: {r.route_name} ({r.bus_number})
              </option>
            ))}
          </select>
        </div>

        {isAdmin && selectedRouteId && (
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
              padding: "0.55rem 1.25rem",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add Stop to Selected Route
          </button>
        )}
      </div>

      {/* Stops Table Container */}
      <div
        style={{
          background: "var(--bg-secondary, #111827)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "1rem",
        }}
      >
        {loadingStops ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#94a3b8" }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "#6366f1" }} />
            <p>Loading stops...</p>
          </div>
        ) : (
          <BusStopTable
            stops={stops}
            isAdmin={isAdmin}
            onEdit={handleEditStop}
            onDelete={handleDeleteStopPrompt}
          />
        )}
      </div>

      {/* Add / Edit Stop Modal */}
      <Modal
        isOpen={isStopModalOpen}
        onClose={() => {
          setIsStopModalOpen(false);
          setEditingStop(null);
        }}
        title={editingStop ? "Edit Bus Stop" : `Add Stop — Route ${activeRouteObj?.route_number || ""}`}
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

      {/* Confirm Deactivate Stop Modal */}
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
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
                #{selectedStopForDelete.stop_order} — {selectedStopForDelete.stop_name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.25rem" }}>
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
                disabled={deleteLoading}
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
                {deleteLoading ? "Deactivating..." : "Deactivate Stop"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
