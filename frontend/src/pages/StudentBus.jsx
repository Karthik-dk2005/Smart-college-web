import React, { useState, useEffect } from "react";
import { busApi } from "../services/busApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import StudentBusCard from "../components/StudentBusCard";
import { Bus, RefreshCw, AlertCircle, Shield } from "lucide-react";

export default function StudentBus() {
  const { user } = useAuth();
  const { error } = useToast();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student identifier: student_profile.id or user.id
  const studentId = user?.student?.id || user?.id;

  const fetchStudentBus = async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await busApi.getStudentBus(studentId);
      // Backend returns either an assignment object or null / 404
      const data = res.data?.data !== undefined ? res.data.data : res.data;
      setAssignment(data || null);
    } catch (err) {
      if (err.response?.status === 404) {
        // No assignment found
        setAssignment(null);
      } else {
        error(err.response?.data?.detail || err.message || "Failed to load bus assignment");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentBus();
  }, [studentId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Page Header Banner */}
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
              My Bus Transit
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              Allocated college commute route, boarding point, and schedule
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStudentBus}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
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
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Main Bus Assignment Display */}
      <StudentBusCard assignment={assignment} loading={loading} />

      {/* Privacy Notice */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          fontSize: "0.82rem",
          color: "#94a3b8",
        }}
      >
        <Shield size={18} style={{ color: "#6366f1", flexShrink: 0 }} />
        <span>
          Bus routes and stop allocations are personalized to your student account. Transport passes are strictly non-transferable and subject to college transit rules.
        </span>
      </div>
    </div>
  );
}
