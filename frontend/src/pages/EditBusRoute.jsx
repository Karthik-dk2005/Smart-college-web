import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { busApi } from "../services/busApi";
import { useToast } from "../components/Toast";
import BusRouteForm from "../components/BusRouteForm";
import { Bus, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

export default function EditBusRoute() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        const res = await busApi.getBus(routeId);
        const data = res.data?.data || res.data;
        setRoute(data);
      } catch (err) {
        error(err.response?.data?.detail || err.message || "Failed to load bus route details");
      } finally {
        setLoading(false);
      }
    };

    if (routeId) {
      fetchRoute();
    }
  }, [routeId]);

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      const res = await busApi.updateBus(routeId, formData);
      success(res.data?.message || `Bus Route ${route?.route_number || ""} updated successfully.`);
      navigate(`/admin/buses/${routeId}`);
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to update bus route");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Breadcrumb & Action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          to={`/admin/buses/${routeId}`}
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
          Back to Route Details
        </Link>

        {route && (
          <span
            style={{
              fontSize: "0.8rem",
              color: "#94a3b8",
              background: "rgba(255,255,255,0.05)",
              padding: "0.3rem 0.75rem",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Route ID: #{route.id}
          </span>
        )}
      </div>

      {/* Main Form Card */}
      <div
        style={{
          background: "var(--bg-secondary, #111827)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(6, 182, 212, 0.3)",
            }}
          >
            <Bus size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Edit Bus Route {route ? `— Route ${route.route_number}` : ""}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0.2rem 0 0 0" }}>
              Modify transit assignment, timings, driver details, or operational status
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "#6366f1" }} />
            <p>Loading route configuration...</p>
          </div>
        ) : !route ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "12px",
            }}
          >
            <AlertCircle size={32} style={{ color: "#ef4444", margin: "0 auto 0.75rem auto" }} />
            <h3 style={{ color: "#f8fafc", margin: 0 }}>Route Not Found</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              The requested bus route could not be found or has been removed.
            </p>
            <Link
              to="/admin/buses"
              style={{
                display: "inline-block",
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.85rem",
              }}
            >
              Return to Buses
            </Link>
          </div>
        ) : (
          <BusRouteForm
            initialData={route}
            isEdit={true}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/admin/buses/${routeId}`)}
            loading={saving}
          />
        )}
      </div>
    </div>
  );
}
