import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import {
  User,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  Settings,
  Users,
  Tv,
  UserPlus,
} from "lucide-react";

export default function LoginForm({ onSuccess }) {
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
      const loggedUser = await login({
        username_or_email: cleanId,
        password: password,
        remember_me: rememberMe,
      });

      const role = (loggedUser?.role || "").toLowerCase();
      const userName = loggedUser?.full_name || loggedUser?.name || "User";
      success(`Welcome back, ${userName}!`);

      if (onSuccess) {
        onSuccess(loggedUser);
      } else if (from && from !== "/login") {
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
        width: "100%",
        maxWidth: "460px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Top Graduation Cap Icon with Horizontal Divider Lines */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "0.85rem",
        }}
      >
        <div style={{ flex: 1, height: "1.5px", background: "#e2e8f0" }} />
        <div
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Custom Stylized Graduation Cap matching reference */}
          <svg width="44" height="34" viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Diamond cap top */}
            <path
              d="M24 3L44 14L24 25L4 14L24 3Z"
              fill="#0d3b8c"
              stroke="#0b2e6f"
              strokeWidth="1.5"
            />
            {/* Skullcap / base */}
            <path
              d="M12 18.5V28C12 28 17 33 24 33C31 33 36 28 36 28V18.5"
              fill="#0d3b8c"
              stroke="#0b2e6f"
              strokeWidth="1.5"
            />
            {/* Golden yellow tassel */}
            <path
              d="M37 18.5V26.5"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="37" cy="28.5" r="2.5" fill="#f59e0b" />
          </svg>
        </div>
        <div style={{ flex: 1, height: "1.5px", background: "#e2e8f0" }} />
      </div>

      {/* Welcome Heading & Subtitle */}
      <div style={{ textAlign: "center", marginBottom: "1.6rem" }}>
        <h1
          style={{
            fontSize: "2.4rem",
            fontWeight: 800,
            color: "#0c2c68",
            margin: "0 0 0.35rem 0",
            letterSpacing: "-0.03em",
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
          Welcome
        </h1>
        <p
          style={{
            fontSize: "1.02rem",
            color: "#475569",
            margin: 0,
            fontWeight: 500,
          }}
        >
          Login to SmartDept
        </p>
      </div>

      {/* Error Notification */}
      {errorMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "0.75rem 0.95rem",
            marginBottom: "1.25rem",
            color: "#991b1b",
            fontSize: "0.84rem",
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={17} style={{ flexShrink: 0 }} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {/* Username / USN input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1.5px solid #cbd5e1",
            borderRadius: "10px",
            padding: "0 0.85rem",
            backgroundColor: "#ffffff",
            transition: "all 0.2s ease",
            height: "48px",
          }}
          tabIndex={-1}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#0d3b8c";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 59, 140, 0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Blue User Icon in rounded box */}
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "#0d3b8c",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "0.75rem",
              flexShrink: 0,
            }}
          >
            <User size={16} />
          </div>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter your Gmail or Student USN"
            autoComplete="username"
            required
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "0.92rem",
              color: "#1e293b",
              backgroundColor: "transparent",
              padding: "0",
            }}
          />
        </div>

        {/* Password input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1.5px solid #cbd5e1",
            borderRadius: "10px",
            padding: "0 0.85rem",
            backgroundColor: "#ffffff",
            transition: "all 0.2s ease",
            height: "48px",
          }}
          tabIndex={-1}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#0d3b8c";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 59, 140, 0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Blue Lock Icon in rounded box */}
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "#0d3b8c",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "0.75rem",
              flexShrink: 0,
            }}
          >
            <Lock size={16} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your Password"
            autoComplete="current-password"
            required
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "0.92rem",
              color: "#1e293b",
              backgroundColor: "transparent",
              padding: "0",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
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

        {/* Remember Me & Forgot Password Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            marginTop: "0.15rem",
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              cursor: "pointer",
              color: "#0c2c68",
              fontWeight: 500,
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "#0d3b8c",
                cursor: "pointer",
                borderRadius: "3px",
              }}
            />
            <span>Remember Me</span>
          </label>

          <Link
            to="/forgot-password"
            style={{
              color: "#0d3b8c",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Large Blue Login Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "0.4rem",
            width: "100%",
            height: "46px",
            background: loading
              ? "#94a3b8"
              : "linear-gradient(135deg, #0c3888 0%, #082866 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "23px",
            fontSize: "1.02rem",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.55rem",
            boxShadow: "0 8px 18px rgba(12, 56, 136, 0.35)",
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
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn size={18} />
              <span>Login</span>
            </>
          )}
        </button>
      </form>

      {/* New Student Registration CTA */}
      <div
        style={{
          marginTop: "1rem",
          padding: "0.7rem 0.9rem",
          borderRadius: "12px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "0.84rem", color: "#475569", fontWeight: 500 }}>
          New Student? Activate your USN account
        </span>
        <Link
          to="/register/student"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.42rem 0.85rem",
            borderRadius: "20px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#0c3888",
            fontSize: "0.82rem",
            fontWeight: 700,
            textDecoration: "none",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <UserPlus size={15} />
          <span>Register as Student</span>
        </Link>
      </div>

      {/* Authorized Users Section Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          margin: "1.5rem 0 1rem 0",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "#cbd5e1" }} />
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "#0c2c68",
            letterSpacing: "0.01em",
          }}
        >
          Authorized Users
        </span>
        <div style={{ flex: 1, height: "1px", background: "#cbd5e1" }} />
      </div>

      {/* Four Role Badges Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.55rem",
          marginBottom: "1.75rem",
        }}
      >
        {/* Admin Card */}
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            borderRadius: "10px",
            padding: "0.6rem 0.3rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Admin: Log in using your registered Admin Gmail"
          onClick={() => {
            if (!identifier) setIdentifier("admin@gmail.com");
          }}
        >
          <Settings size={20} color="#0c3888" />
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0c2c68" }}>Admin</span>
        </div>

        {/* HOD Card */}
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            borderRadius: "10px",
            padding: "0.6rem 0.3rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="HOD: Log in using your registered HOD Gmail"
          onClick={() => {
            if (!identifier) setIdentifier("hod.cse@gmail.com");
          }}
        >
          <Users size={20} color="#0c3888" />
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0c2c68" }}>HOD</span>
        </div>

        {/* Teacher Card */}
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            borderRadius: "10px",
            padding: "0.6rem 0.3rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Teacher: Log in using your registered Teacher Gmail"
          onClick={() => {
            if (!identifier) setIdentifier("teacher@gmail.com");
          }}
        >
          <Tv size={20} color="#0c3888" />
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0c2c68" }}>Teacher</span>
        </div>

        {/* Student Card */}
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            borderRadius: "10px",
            padding: "0.6rem 0.3rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Student: Log in using your University Seat Number (USN)"
          onClick={() => {
            if (!identifier) setIdentifier("4MN24CS002");
          }}
        >
          <GraduationCap size={20} color="#0c3888" />
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0c2c68" }}>Student</span>
        </div>
      </div>

      {/* Footer Tagline with Gold Underline Curve & Books Outline Icon */}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          paddingBottom: "0.5rem",
        }}
      >
        <p
          style={{
            margin: "0 0 0.25rem 0",
            fontSize: "0.85rem",
            fontStyle: "italic",
            color: "#0c2c68",
            fontWeight: 500,
            fontFamily: "'Georgia', serif",
            letterSpacing: "0.01em",
          }}
        >
          Empowering Education... Enriching Future...
        </p>

        {/* Gold curved brush accent line */}
        <div
          style={{
            margin: "0 auto",
            width: "120px",
            height: "3px",
            background: "linear-gradient(90deg, transparent 0%, #f59e0b 50%, transparent 100%)",
            borderRadius: "2px",
          }}
        />

        {/* Stack of books with graduation cap icon on bottom right */}
        <div
          style={{
            position: "absolute",
            right: "-10px",
            bottom: "-4px",
            color: "#0c3888",
            opacity: 0.85,
            pointerEvents: "none",
          }}
        >
          <svg width="44" height="34" viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Top graduation cap on books */}
            <path d="M42 4L49 8L42 12L35 8L42 4Z" stroke="#0c3888" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M37 9.5V13C37 13 39 15 42 15C45 15 47 13 47 13V9.5" stroke="#0c3888" strokeWidth="1.5" />
            <path d="M48 10V14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
            {/* Top Book */}
            <path d="M32 17H48C49.1 17 50 17.9 50 19V20C50 21.1 49.1 22 48 22H32C30.9 22 30 21.1 30 20V19C30 17.9 30.9 17 32 17Z" stroke="#0c3888" strokeWidth="1.3" />
            <line x1="33" y1="19.5" x2="47" y2="19.5" stroke="#0c3888" strokeWidth="1" />
            {/* Middle Book */}
            <path d="M28 22H47C48.1 22 49 22.9 49 24V25C49 26.1 48.1 27 47 27H28C26.9 27 26 26.1 26 25V24C26 22.9 26.9 22 28 22Z" stroke="#0c3888" strokeWidth="1.3" />
            <line x1="29" y1="24.5" x2="45" y2="24.5" stroke="#0c3888" strokeWidth="1" />
            {/* Bottom Book */}
            <path d="M24 27H49C50.1 27 51 27.9 51 29V31C51 32.1 50.1 33 49 33H24C22.9 33 22 32.1 22 31V29C22 27.9 22.9 27 24 27Z" stroke="#0c3888" strokeWidth="1.3" />
            <line x1="25" y1="30" x2="47" y2="30" stroke="#0c3888" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}
