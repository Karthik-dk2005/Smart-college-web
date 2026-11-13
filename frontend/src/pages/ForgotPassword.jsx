import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import CollegeLogo from "../components/CollegeLogo";
import {
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { forgotPassword } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      toastError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setSubmitted(true);
      if (res?.reset_token) {
        setResetToken(res.reset_token);
      }
      toastSuccess("Password recovery instructions generated.");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Unable to process password reset request.";
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
            RESET PASSWORD
          </h1>

          <div
            style={{
              color: "#334155",
              fontSize: "0.9rem",
              fontWeight: 600,
              marginTop: "0.25rem",
            }}
          >
            Smart Department Academic Management System
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

        {submitted ? (
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

            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>
              Reset Request Sent
            </h2>
            <p style={{ color: "#475569", fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              If an account is associated with <strong>{email}</strong>, a password reset token has been
              created.
            </p>

            {resetToken && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534", marginBottom: "0.35rem" }}>
                  Dev / Academic Verification Token:
                </div>
                <code
                  style={{
                    display: "block",
                    background: "#ffffff",
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #dcfce7",
                    fontSize: "0.82rem",
                    color: "#15803d",
                    wordBreak: "break-all",
                  }}
                >
                  {resetToken}
                </code>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    marginTop: "0.75rem",
                    fontSize: "0.85rem",
                    color: "#166534",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  <span>Click here to set your new password directly</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                to="/reset-password"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  background: "#1e3a8a",
                  color: "#ffffff",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                <KeyRound size={16} /> Enter Reset Token
              </Link>

              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  color: "#475569",
                  padding: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={16} /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "0 0 0.5rem", lineHeight: 1.5 }}>
              Enter your registered institutional or personal email address. We will verify your account and
              generate a password recovery token.
            </p>

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
                Registered Email Address *
              </label>
              <div style={{ position: "relative" }}>
                <Mail
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
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@mitt.ac.in"
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

            <button
              type="submit"
              disabled={loading}
              style={{
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
                <span>Generating Token...</span>
              ) : (
                <>
                  <KeyRound size={18} />
                  <span>REQUEST PASSWORD RESET</span>
                </>
              )}
            </button>

            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "#1e3a8a",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={16} /> Return to Login
              </Link>
            </div>
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

