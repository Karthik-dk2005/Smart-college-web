import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import studentAuthApi from "../api/studentAuth";
import CollegeLogo from "../components/CollegeLogo";
import {
  IdCard,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function StudentLogin() {
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { setSession, login: ctxLogin } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanUsn = usn.trim().toUpperCase();
    if (!cleanUsn) {
      setErrorMessage("Please enter your USN.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // Call dedicated student login API endpoint: POST /api/auth/student/login
      const res = await studentAuthApi.login(cleanUsn, password);

      const targetStorage = rememberMe ? localStorage : sessionStorage;
      targetStorage.setItem("token", res.access_token);
      targetStorage.setItem("auth_token", res.access_token);
      targetStorage.setItem("role", "student");
      targetStorage.setItem("user", JSON.stringify(res.user));

      if (setSession) {
        setSession(res.access_token, res.user, "student");
      }

      success(`Welcome back, ${res.user.name || "Student"}!`);
      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      try {
        await ctxLogin({
          username_or_email: cleanUsn,
          password: password,
          remember_me: rememberMe,
        });
        success("Logged in successfully!");
        navigate("/student/dashboard", { replace: true });
        return;
      } catch (fallbackErr) {
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          fallbackErr.response?.data?.detail ||
          fallbackErr.message ||
          "Invalid USN or password. Please verify your credentials.";
        setErrorMessage(msg);
        toastError(msg);
      }
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
      {/* Centered White Card in Blue & White Theme */}
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
            Student Login
          </h1>
          <p
            style={{
              fontSize: "0.82rem",
              color: "#64748b",
              margin: 0,
              fontWeight: 500,
            }}
          >
            Smart Department Academic & Campus Management System
          </p>
        </div>

        {/* Error Alert */}
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

        <form onSubmit={handleLoginSubmit}>
          {/* USN Input */}
          <div style={{ marginBottom: "1.15rem" }}>
            <label
              htmlFor="student-usn"
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "0.4rem",
              }}
            >
              University Seat Number (USN) *
            </label>
            <div style={{ position: "relative" }}>
              <IdCard
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
                id="student-usn"
                type="text"
                placeholder="e.g. 4MN23CS001 or 4MN25CS410"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
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
                  fontWeight: 600,
                  fontFamily: "monospace",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
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
                htmlFor="student-password"
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
                id="student-password"
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
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1.35rem",
              fontSize: "0.82rem",
              color: "#475569",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "#1e3a8a", width: "15px", height: "15px", cursor: "pointer" }}
              />
              Remember me on this device
            </label>
          </div>

          {/* Submit Button */}
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
                <span>LOGIN TO DASHBOARD</span>
              </>
            )}
          </button>
        </form>

        {/* Links */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.15rem",
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 0.75rem 0" }}>
            New student? Register with your USN
          </p>
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
            }}
          >
            <GraduationCap size={18} />
            <span>Easy Student Registration (with USN)</span>
          </Link>
          <div style={{ marginTop: "0.75rem" }}>
            <Link
              to="/login"
              style={{
                color: "#64748b",
                fontSize: "0.78rem",
                textDecoration: "none",
              }}
            >
              Faculty / Admin Portal Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
