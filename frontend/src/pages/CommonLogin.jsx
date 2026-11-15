import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import CollegeLogo from "../components/CollegeLogo";
import mitBuildingImg from "../assets/mit-building.jpg";
import {
  User,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function CommonLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setErrorMessage("Please enter your Gmail or Student USN and password.");
      return;
    }

    setLoading(true);
    try {
      // Backend automatically authenticates USN or Gmail and retrieves role from database
      const loggedUser = await login({
        username_or_email: cleanId,
        password: password,
        remember_me: rememberMe,
      });

      const role = (loggedUser?.role || "").toLowerCase();
      const userName = loggedUser?.full_name || loggedUser?.name || "User";
      success(`Welcome back, ${userName}!`);

      // Automatic Role-Based Redirection
      if (from && from !== "/login") {
        navigate(from, { replace: true });
      } else if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "hod") {
        navigate("/hod/dashboard", { replace: true });
      } else if (["teacher", "faculty"].includes(role)) {
        navigate("/teacher/dashboard", { replace: true });
      } else if (role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Invalid credentials or password. Please verify and try again.";
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0b1528 0%, #172554 45%, #1e3a8a 75%, #1d4ed8 100%)",
        padding: "1.5rem 1rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Outer Card Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "1040px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 25px 60px -15px rgba(2, 6, 23, 0.4), 0 0 1px 1px rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
          display: "flex",
          flexWrap: "wrap",
          minHeight: "600px",
        }}
      >
        {/* Left Column: MITT College Building & Official Branding */}
        <div
          style={{
            flex: "1 1 440px",
            minHeight: "360px",
            position: "relative",
            background: "#0a192f",
            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(30, 58, 138, 0.88) 100%), url(${mitBuildingImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "2.75rem 2.25rem",
            color: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          {/* Top Brand Badge */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                padding: "0.45rem 0.95rem",
                borderRadius: "30px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                marginBottom: "1.5rem",
              }}
            >
              <Building2 size={16} color="#60a5fa" />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                MITT Campus Portal
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
              <div
                style={{
                  background: "#ffffff",
                  padding: "0.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CollegeLogo
                  size="md"
                  style={{
                    height: "56px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.18rem",
                    fontWeight: 800,
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                    color: "#ffffff",
                  }}
                >
                  Maharaja Institute of Technology
                </h2>
                <p
                  style={{
                    margin: "0.2rem 0 0 0",
                    fontSize: "0.82rem",
                    color: "#93c5fd",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  Thandavapura, Mysuru
                </p>
              </div>
            </div>

            <h1
              style={{
                fontSize: "1.85rem",
                fontWeight: 800,
                lineHeight: 1.2,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                margin: "1.5rem 0 0.75rem 0",
              }}
            >
              SmartDept Academic Management
            </h1>
            <p
              style={{
                fontSize: "0.92rem",
                lineHeight: 1.55,
                color: "#cbd5e1",
                margin: 0,
                maxWidth: "380px",
              }}
            >
              Department of Computer Science & Engineering. Integrated institutional system for academic governance, timetable, attendance, marks, and student portfolios.
            </p>
          </div>

          {/* Bottom Highlights & Badges */}
          <div style={{ marginTop: "2rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(8px)",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#60a5fa", marginBottom: "0.25rem" }}>
                  <ShieldCheck size={16} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Single Portal</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.73rem", color: "#e2e8f0" }}>
                  Admin, HOD, Teacher & Student
                </p>
              </div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(8px)",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#60a5fa", marginBottom: "0.25rem" }}>
                  <Sparkles size={16} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Auto Detection</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.73rem", color: "#e2e8f0" }}>
                  Instant role-based authorization
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>
              © {new Date().getFullYear()} MIT Thandavapura. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Column: Unified Login Form */}
        <div
          style={{
            flex: "1 1 420px",
            padding: "2.75rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxSizing: "border-box",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span
                style={{
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                SmartDept
              </span>
              <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>
                Official Login
              </span>
            </div>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 0.35rem 0",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome Back
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
              Sign in with your institutional credentials to access your dashboard.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                marginBottom: "1.5rem",
                color: "#991b1b",
                fontSize: "0.85rem",
                lineHeight: 1.45,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Username / USN / Gmail input */}
            <div>
              <label
                htmlFor="identifier"
                style={{
                  display: "block",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "0.45rem",
                }}
              >
                Institutional Gmail or Student USN
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <User size={18} />
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your Gmail or Student USN"
                  autoComplete="username"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem 0.75rem 2.6rem",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "0.92rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box",
                    color: "#0f172a",
                    backgroundColor: "#f8fafc",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.backgroundColor = "#f8fafc";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                Admin, HOD & Teachers enter Gmail; Students enter University USN.
              </p>
            </div>

            {/* Password input with visibility toggle */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.45rem",
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "0.8rem",
                    color: "#2563eb",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password"
                  autoComplete="current-password"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.75rem 0.75rem 2.6rem",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "0.92rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box",
                    color: "#0f172a",
                    backgroundColor: "#f8fafc",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.backgroundColor = "#f8fafc";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#2563eb",
                  borderRadius: "4px",
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{
                  fontSize: "0.84rem",
                  color: "#475569",
                  cursor: "pointer",
                  userSelect: "none",
                  fontWeight: 500,
                }}
              >
                Remember me on this browser
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.85rem 1.25rem",
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "0.96rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.4)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#ffffff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to SmartDept</span>
                  <LogIn size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Guidance Box */}
          <div
            style={{
              marginTop: "1.75rem",
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "10px",
              padding: "0.85rem 1rem",
              fontSize: "0.78rem",
              color: "#475569",
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.3rem" }}>
              Login Credentials Guide:
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              <li><strong>Admin / HOD / Teacher:</strong> Use registered Gmail & password.</li>
              <li><strong>Students:</strong> Use your official University Seat Number (USN).</li>
            </ul>
          </div>

          {/* Bottom Registration Links */}
          <div
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              fontSize: "0.86rem",
              color: "#64748b",
            }}
          >
            <span>Are you a student registering for the first time? </span>
            <Link
              to="/register/student"
              style={{
                color: "#2563eb",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span>Register as Student</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
