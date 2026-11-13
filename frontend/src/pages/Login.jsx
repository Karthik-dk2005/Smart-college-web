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
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function Login() {
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

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setErrorMessage("Please enter your USN / Username and password.");
      return;
    }

    setLoading(true);
    try {
      // Backend automatically authenticates USN, username, or email and determines role from database
      const loggedUser = await login({
        username_or_email: cleanId,
        password: password,
        remember_me: rememberMe,
      });

      success(`Welcome back, ${loggedUser.full_name || loggedUser.name || "User"}!`);

      // Automatic Role-Based Redirection based on database-verified role
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
        err.response?.data?.message ||
        err.message ||
        "Invalid USN/Username or password. Please verify and try again.";
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)",
        padding: "1.5rem 1rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Centered Login Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "2.25rem 2rem",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 1px 1px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          boxSizing: "border-box",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "0.85rem",
            }}
          >
            <CollegeLogo
              size="lg"
              style={{
                height: "64px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>

          <h1
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 0.35rem 0",
              letterSpacing: "-0.02em",
            }}
          >
            Smart Department System
          </h1>
          <p
            style={{
              fontSize: "0.82rem",
              color: "#64748b",
              margin: 0,
              fontWeight: 500,
            }}
          >
            Department of Computer Science & Engineering
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              padding: "0.85rem 1rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              color: "#b91c1c",
              fontSize: "0.84rem",
              lineHeight: 1.4,
              marginBottom: "1.25rem",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* USN / Username Input */}
          <div style={{ marginBottom: "1.15rem" }}>
            <label
              htmlFor="login-identifier"
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "0.4rem",
              }}
            >
              USN / Username *
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />
              <input
                id="login-identifier"
                type="text"
                placeholder="e.g. 4MN23CS001 or admin"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#0f172a",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
              />
            </div>
            <p style={{ fontSize: "0.72rem", color: "#64748b", margin: "0.3rem 0 0 0" }}>
              Students enter USN; Staff enter Username or Email.
            </p>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "1.15rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.4rem",
              }}
            >
              <label
                htmlFor="login-password"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                Password *
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "0.78rem",
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
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 2.6rem 0.75rem 2.5rem",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#0f172a",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 0,
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1.35rem",
              fontSize: "0.82rem",
              color: "#475569",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "#1e3a8a", width: "15px", height: "15px", cursor: "pointer" }}
              />
              Remember me on this device
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: loading
                ? "#93c5fd"
                : "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
              border: "none",
              borderRadius: "10px",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>LOGIN</span>
              </>
            )}
          </button>
        </form>

        {/* Register Links */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
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
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
              textDecoration: "none",
              fontSize: "0.88rem",
              fontWeight: 600,
              boxSizing: "border-box",
              transition: "all 0.15s ease",
            }}
          >
            <GraduationCap size={18} />
            <span>Register as Student (with USN)</span>
          </Link>

          <Link
            to="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.45rem",
              fontSize: "0.84rem",
              color: "#475569",
              textDecoration: "none",
              fontWeight: 500,
              padding: "0.35rem",
            }}
          >
            <span>Don't have an account? <strong style={{ color: "#2563eb" }}>Create New Account</strong></span>
          </Link>
        </div>

        {/* Roles footer indicator */}
        <div
          style={{
            marginTop: "1.25rem",
            textAlign: "center",
            fontSize: "0.72rem",
            color: "#94a3b8",
            display: "flex",
            justifyContent: "center",
            gap: "0.4rem",
            flexWrap: "wrap",
          }}
        >
          <span>Roles:</span>
          <span style={{ color: "#475569", fontWeight: 600 }}>Admin</span>
          <span>•</span>
          <span style={{ color: "#475569", fontWeight: 600 }}>HOD</span>
          <span>•</span>
          <span style={{ color: "#475569", fontWeight: 600 }}>Teacher</span>
          <span>•</span>
          <span style={{ color: "#475569", fontWeight: 600 }}>Student</span>
        </div>
      </div>
    </div>
  );
}
