import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";

/**
 * RoleBasedRoute - Guards routes according to specific allowed roles.
 * Usage: <RoleBasedRoute allowedRoles={["admin", "hod"]}>{children}</RoleBasedRoute>
 */
export default function RoleBasedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0f1d",
          color: "#f8fafc",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
          Verifying security credentials...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account status check
  if (user && user.account_status && user.account_status !== "Approved") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "1.5rem",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "2.5rem",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              color: "#d97706",
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" }}>
            Account Status: {user.account_status}
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
            Your account is currently {user.account_status.toLowerCase()}. You require approval from the
            Institutional Administrator or your Department HOD to access this portal.
          </p>
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#1e3a8a",
              color: "#ffffff",
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.88rem",
            }}
          >
            <ArrowLeft size={16} /> Return to Login
          </Link>
        </div>
      </div>
    );
  }

  // Role authorization check
  if (allowedRoles.length > 0) {
    const userRole = (role || "").toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => {
      const lr = r.toLowerCase();
      return lr === "faculty" ? "teacher" : lr;
    });
    const currentNormalized = userRole === "faculty" ? "teacher" : userRole;

    if (!normalizedAllowed.includes(currentNormalized)) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            padding: "1.5rem",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "2.5rem",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                color: "#dc2626",
              }}
            >
              <ShieldAlert size={32} />
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" }}>
              Unauthorized Access
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              Your account role (<strong>{role}</strong>) does not have sufficient permission to view this section.
            </p>
            <Link
              to="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#1e3a8a",
                color: "#ffffff",
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.88rem",
              }}
            >
              <ArrowLeft size={16} /> Return to Dashboard
            </Link>
          </div>
        </div>
      );
    }
  }

  return children;
}

