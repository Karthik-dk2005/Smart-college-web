import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { busApi } from "../services/busApi";
import { useToast } from "../components/Toast";
import BusRouteForm from "../components/BusRouteForm";
import { Bus, ArrowLeft, ShieldCheck } from "lucide-react";

export default function AddBusRoute() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      await busApi.createBus(formData);
      success("✓ Bus route added successfully.");
      navigate("/admin/buses");
    } catch (err) {
      error(err.response?.data?.detail || err.message || "Failed to create bus route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Breadcrumb & Action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          Back to Bus Dashboard
        </Link>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "#a5b4fc",
            padding: "0.3rem 0.75rem",
            borderRadius: "20px",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={14} /> Admin Privileged Action
        </span>
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
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
            }}
          >
            <Bus size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              + Add Bus Route
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0.2rem 0 0 0" }}>
              Configure a new department transit route with bus allocation and schedule
            </p>
          </div>
        </div>

        <BusRouteForm
          isEdit={false}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/buses")}
          loading={loading}
        />
      </div>
    </div>
  );
}
