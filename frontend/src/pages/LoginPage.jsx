import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, ShieldCheck, UserCheck, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("amulya.h.s@mitt.ac.in");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🎓</div>
          <h1 className="login-title">Smart Department ERP</h1>
          <p className="login-subtitle">
            Department of Computer Science & Engineering
          </p>
        </div>

        {/* Quick Demo Switcher */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: "0.5rem",
              textAlign: "center",
            }}
          >
            Quick 1-Click Demo Accounts (All pass: password123)
          </div>

          <div className="quick-roles">
            <button
              type="button"
              className="role-chip"
              onClick={() => setDemoAccount("amulya.h.s@mitt.ac.in")}
              title="Student: Amulya H S"
            >
              Student
            </button>
            <button
              type="button"
              className="role-chip"
              onClick={() => setDemoAccount("ananya.iyer@faculty.campus.edu")}
              title="Faculty: Prof. Ananya Iyer"
            >
              Teacher
            </button>
            <button
              type="button"
              className="role-chip"
              onClick={() => setDemoAccount("hod.cse@campus.edu")}
              title="HOD: Dr. Vikramaditya Sen"
            >
              HOD
            </button>
            <button
              type="button"
              className="role-chip"
              onClick={() => setDemoAccount("admin@campus.edu")}
              title="Admin: Dr. Robert Hawthorne"
            >
              Admin
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              padding: "0.75rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">College Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. amulya.h.s@mitt.ac.in"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.85rem", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Authenticating with Backend...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Academic Portal</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#64748b",
          }}
        >
          Protected by JWT RBAC & Server-Side GPS Geofence Verification
        </div>
      </div>
    </div>
  );
}
