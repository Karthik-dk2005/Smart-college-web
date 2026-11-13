import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import CollegeLogo from "../components/CollegeLogo";
import {
  User,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Clock,
  UserPlus,
} from "lucide-react";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login, inactivityNotice, setInactivityNotice } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier.trim() || !password) {
      setErrorMessage("Please enter your username/email/USN and password.");
      toastError("Please enter your username/email/USN and password.");
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login({
        username_or_email: identifier.trim(),
        password: password,
        remember_me: rememberMe,
      });

      if (inactivityNotice && setInactivityNotice) {
        setInactivityNotice(false);
      }

      success(`Welcome back, ${loggedUser.full_name || loggedUser.name || "User"}!`);

      // Role-based redirection
      const userRole = (loggedUser.role || "").toLowerCase();
      if (userRole === "admin") {
        navigate("/dashboard", { replace: true });
      } else if (userRole === "hod") {
        navigate("/dashboard", { replace: true });
      } else if (["teacher", "faculty"].includes(userRole)) {
        navigate("/dashboard", { replace: true });
      } else if (userRole === "student") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Invalid credentials. Please verify your details.";
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoIdentifier, demoPass = "password123") => {
    setIdentifier(demoIdentifier);
    setPassword(demoPass);
    setErrorMessage("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
        padding: "1.5rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Login Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "2.5rem 2.25rem 2.25rem",
          boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <CollegeLogo
              size="lg"
              className="login-college-logo"
              style={{
                height: "68px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            SMART DEPARTMENT
          </h1>

          <div
            style={{
              color: "#334155",
              fontSize: "0.92rem",
              fontWeight: 600,
              marginTop: "0.3rem",
            }}
          >
            Academic Management System
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "0.78rem",
              marginTop: "0.2rem",
              fontWeight: 500,
            }}
          >
            Maharaja Institute of Technology Thandavapura
          </div>
        </div>

        {/* Inactivity Notice Alert */}
        {inactivityNotice && (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              color: "#b45309",
              fontSize: "0.85rem",
            }}
          >
            <Clock size={18} flexShrink={0} />
            <span>You were logged out due to 30 minutes of inactivity. Please log in again.</span>
          </div>
        )}

        {/* Error Feedback Alert */}
        {errorMessage && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              color: "#b91c1c",
              fontSize: "0.85rem",
            }}
          >
            <AlertCircle size={18} style={{ marginTop: "2px", flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo 1-Click Accounts */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#475569",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.4rem",
              textAlign: "center",
            }}
          >
            1-Click Demo Logins:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.35rem" }}>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@campus.edu")}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#1e3a8a",
                padding: "0.4rem 0.2rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
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
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#7e22ce",
                padding: "0.4rem 0.2rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
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
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#0e7490",
                padding: "0.4rem 0.2rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("amulya.h.s@mitt.ac.in")}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#047857",
                padding: "0.4rem 0.2rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Student
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "0.4rem",
              }}
            >
              Username, Email or USN / Employee ID
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin@campus.edu or 4MH21CS001"
                style={{
                  width: "100%",
                  padding: "0.75rem 0.85rem 0.75rem 2.6rem",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#0f172a",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.4rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#1e293b",
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
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem 2.75rem 0.75rem 2.6rem",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#0f172a",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#475569",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: "#1e3a8a",
                  cursor: "pointer",
                  width: "15px",
                  height: "15px",
                }}
              />
              Remember me on this device
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.4rem",
              padding: "0.85rem 1.25rem",
              borderRadius: "10px",
              background: "#1e3a8a",
              color: "#ffffff",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: 700,
              letterSpacing: "0.03em",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              boxShadow: "0 4px 14px rgba(30, 58, 138, 0.25)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>SIGN IN</span>
              </>
            )}
          </button>
        </form>

        {/* Register Account Section */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 0.75rem" }}>
            Don't have an institutional account yet?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Link
              to="/student-login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "0.88rem",
                fontWeight: 600,
                boxSizing: "border-box",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              }}
            >
              <LogIn size={16} color="#ffffff" />
              <span>Dedicated Student Login (USN & Password)</span>
            </Link>

            <Link
              to="/student-register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1px solid #4f46e5",
                background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "0.88rem",
                fontWeight: 600,
                boxSizing: "border-box",
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              }}
            >
              <UserPlus size={16} color="#ffffff" />
              <span>Easy Student Registration (USN & Password)</span>
            </Link>

            <Link
              to="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                width: "100%",
                padding: "0.65rem 1rem",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#1e293b",
                textDecoration: "none",
                fontSize: "0.82rem",
                fontWeight: 600,
                boxSizing: "border-box",
              }}
            >
              <span>Other Institutional Roles (Teacher / HOD)</span>
            </Link>
          </div>
        </div>

        {/* Footer Badge */}
        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.78rem",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}
        >
          <ShieldCheck size={16} color="#059669" />
          <span>VTU Affiliated & AICTE Approved Institutional Portal</span>
        </div>
      </div>

      {/* College Footer */}
      <footer
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#64748b",
        }}
      >
        Maharaja Institute of Technology Thandavapura • NH 766, Nanjangud Taluk, Mysuru
      </footer>
    </div>
  );
}
