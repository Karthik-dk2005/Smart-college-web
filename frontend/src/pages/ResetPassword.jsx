import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import CollegeLogo from "../components/CollegeLogo";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successReset, setSuccessReset] = useState(false);

  const { resetPassword } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token.trim()) {
      setErrorMessage("Reset token is required.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        token: token.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccessReset(true);
      toastSuccess("Password has been reset successfully! Please log in.");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to reset password. The token may be expired or invalid.";
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
        background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
        padding: "1.5rem",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "2.5rem 2.25rem",
          boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.12)",
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
                height: "64px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>

          <h1
            style={{
              fontSize: "1.45rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "0.02em",
              margin: 0,
            }}
          >
            SET NEW PASSWORD
          </h1>

          <div
            style={{
              color: "#334155",
              fontSize: "0.9rem",
              fontWeight: 600,
              marginTop: "0.25rem",
            }}
          >
            Smart Department Academic & Campus Management System
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "0.78rem",
              marginTop: "0.2rem",
            }}
          >
            Maharaja Institute of Technology Thandavapura
          </div>
        </div>

        {successReset ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                color: "#059669",
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>
              Password Reset Complete!
            </h2>
            <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.5, margin: "0 0 1.75rem" }}>
              Your password has been securely updated. You can now log into your account using your new credentials.
            </p>

            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "#1e3a8a",
                color: "#ffffff",
                width: "100%",
                padding: "0.85rem 1.25rem",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
                boxShadow: "0 4px 14px rgba(30, 58, 138, 0.25)",
              }}
            >
              <span>Sign In Now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {errorMessage && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  color: "#b91c1c",
                  fontSize: "0.85rem",
                }}
              >
                <AlertCircle size={18} flexShrink={0} />
                <span>{errorMessage}</span>
              </div>
            )}

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
                Reset Token *
              </label>
              <div style={{ position: "relative" }}>
                <KeyRound
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
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your reset token"
                  style={{
                    width: "100%",
                    padding: "0.75rem 0.85rem 0.75rem 2.6rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    color: "#0f172a",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

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
                New Password (min 6 characters) *
              </label>
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
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  onClick={() => setShowNewPassword(!showNewPassword)}
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
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

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
                Confirm New Password *
              </label>
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
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "0.5rem",
                padding: "0.85rem 1.25rem",
                borderRadius: "10px",
                background: "#1e3a8a",
                color: "#ffffff",
                border: "none",
                fontSize: "0.95rem",
                fontWeight: 700,
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
                <span>Updating Password...</span>
              ) : (
                <>
                  <KeyRound size={18} />
                  <span>RESET PASSWORD</span>
                </>
              )}
            </button>
          </form>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "1.75rem",
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

