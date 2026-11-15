import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * RoleBasedRedirect
 * Evaluates the authenticated user's role from database session
 * and automatically redirects to the appropriate role-based dashboard:
 * - admin   -> /admin/dashboard
 * - hod     -> /hod/dashboard
 * - teacher -> /teacher/dashboard
 * - student -> /student/dashboard
 */
export default function RoleBasedRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#f8fafc",
          fontFamily: "'Inter', sans-serif",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            border: "4px solid rgba(59, 130, 246, 0.2)",
            borderTopColor: "#2563eb",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
          Redirecting to authorized dashboard...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const userRole = (role || user?.role || "").toLowerCase();

  switch (userRole) {
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "hod":
      return <Navigate to="/hod/dashboard" replace />;
    case "teacher":
    case "faculty":
      return <Navigate to="/teacher/dashboard" replace />;
    case "student":
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}
