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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Fallback: try ctxLogin in case user is registered via general auth
      try {
        await ctxLogin({
          username_or_email: cleanUsn,
          password: password,
          remember_me: rememberMe,
        });
        success("Logged in successfully!");
        navigate("/dashboard", { replace: true });
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
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)",
        padding: "1.5rem 1rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#f8fafc",
      }}
    >
      {/* College & Department Branding */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "inline-block", marginBottom: "0.5rem" }}>
          <CollegeLogo size="lg" showText={false} />
        </div>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            margin: "0.25rem 0",
          }}
        >
          Smart Department Academic System
        </h1>
        <p style={{ fontSize: "0.88rem", color: "#94a3b8", margin: 0 }}>
          Department of Computer Science & Engineering • Student Login Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "18px",
          padding: "2rem",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)",
        }}
      >
        <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <GraduationCap style={{ color: "#6366f1" }} size={22} />
            Student Login
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "0.25rem 0 0 0" }}>
            Enter your University Seat Number (USN) and password
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: "0.85rem 1rem",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "10px",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              color: "#fca5a5",
              fontSize: "0.88rem",
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleLoginSubmit}>
          {/* USN Input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="student-login-usn"
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#cbd5e1",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
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
                  color: "#94a3b8",
                }}
              />
              <input
                id="student-login-usn"
                type="text"
                placeholder="e.g. 4MN23CS001 or 4MN25CS410"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.6rem",
                  background: "rgba(30, 41, 59, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="student-login-password"
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#cbd5e1",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Password *
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                id="student-login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 2.6rem 0.75rem 2.6rem",
                  background: "rgba(30, 41, 59, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                  outline: "none",
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
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
              fontSize: "0.82rem",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "#cbd5e1" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "#6366f1" }}
              />
              Remember Me
            </label>

            <Link
              to="/forgot-password"
              style={{
                color: "#818cf8",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: loading
                ? "rgba(99, 102, 241, 0.6)"
                : "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              border: "none",
              borderRadius: "10px",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                Authenticating...
              </>
            ) : (
              <>
                <LogIn size={18} /> Login to Student Dashboard
              </>
            )}
          </button>
        </form>

        {/* Links to Register & Staff Login */}
        <div
          style={{
            marginTop: "1.75rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
            fontSize: "0.84rem",
            color: "#94a3b8",
          }}
        >
          Not registered yet?{" "}
          <Link
            to="/student-register"
            style={{
              color: "#818cf8",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Easy Registration with USN →
          </Link>
          <div style={{ marginTop: "0.6rem" }}>
            <Link
              to="/login"
              style={{
                color: "#64748b",
                fontSize: "0.78rem",
                textDecoration: "none",
              }}
            >
              Faculty / Admin Portal Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
