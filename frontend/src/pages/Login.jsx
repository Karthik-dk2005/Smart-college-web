import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Sparkles, Mail, Lock, LogIn, ArrowRight, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error("Please fill in both email and password");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.name || "User"}!`);
      navigate(from, { replace: true });
    } catch (err) {
      error(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass = "password123") => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% -20%, #1e1b4b 0%, #0a0f1d 70%)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "rgba(17, 24, 39, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "2.25rem",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 8px 25px rgba(99, 102, 241, 0.4)",
              marginBottom: "1rem",
            }}
          >
            <Sparkles size={26} />
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>
            Smart Department
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginTop: "0.25rem" }}>
            Academic Management & Attendance System
          </p>
        </div>

        {/* Demo Credentials Quick-Select */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            borderRadius: "10px",
            padding: "0.85rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Demo 1-Click Login:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@campus.edu")}
              style={{
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#c7d2fe",
                padding: "0.35rem 0.5rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("hod.cse@campus.edu")}
              style={{
                background: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                color: "#e9d5ff",
                padding: "0.35rem 0.5rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              HOD
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("ananya.iyer@faculty.campus.edu")}
              style={{
                background: "rgba(6, 182, 212, 0.15)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                color: "#cffafe",
                padding: "0.35rem 0.5rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("amulya.h.s@mitt.ac.in")}
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#d1fae5",
                padding: "0.35rem 0.5rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Student (5A)
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.4rem" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={17}
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campus.edu"
                style={{
                  width: "100%",
                  padding: "0.7rem 0.75rem 0.7rem 2.4rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.4rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={17}
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.7rem 0.75rem 0.7rem 2.4rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              padding: "0.8rem",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.35)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#94a3b8" }}>
          Don't have an account yet?{" "}
          <Link to="/register" style={{ color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
