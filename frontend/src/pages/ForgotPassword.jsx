import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import studentAuthApi from "../api/studentAuth";
import CollegeLogo from "../components/CollegeLogo";
import {
  IdCard,
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Workflow steps: "request" | "verify_reset" | "success"
  const [step, setStep] = useState("request");

  // Form Fields
  const [usn, setUsn] = useState("");
  const [maskedGmail, setMaskedGmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send Recovery OTP to registered Gmail
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanUsn = usn.trim().toUpperCase();
    if (!cleanUsn) {
      setErrorMessage("Please enter your registered USN.");
      return;
    }

    setLoading(true);

    try {
      const res = await studentAuthApi.forgotPassword(cleanUsn);
      setMaskedGmail(res.masked_gmail || res.gmail || "your registered Gmail");
      setSuccessMessage(res.message || "A recovery OTP has been sent to your registered Gmail.");
      setStep("verify_reset");
      setResendCooldown(60);
    } catch (err) {
      if (err.response?.status === 404) {
        setErrorMessage("Student record not found. Please contact your Admin.");
      } else {
        setErrorMessage(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Student record not found. Please contact your Admin."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP received on your registered Gmail.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await studentAuthApi.resetPassword({
        usn: usn.trim().toUpperCase(),
        otp: cleanOtp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccessMessage(res.message || "Password updated successfully!");
      setStep("success");
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to reset password. Please verify the OTP code."
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend Recovery OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await studentAuthApi.forgotPassword(usn.trim().toUpperCase());
      setSuccessMessage(res.message || "A fresh OTP code has been sent.");
      setResendCooldown(60);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to resend OTP. Please try again."
      );
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
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
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
            Password Recovery
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

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.85rem 1rem",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              color: "#16a34a",
              fontSize: "0.84rem",
              marginBottom: "1.25rem",
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <div>{successMessage}</div>
          </div>
        )}

        {/* STEP 1: ENTER REGISTERED USN */}
        {step === "request" && (
          <form onSubmit={handleRequestOtp}>
            <p style={{ fontSize: "0.84rem", color: "#475569", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
              Enter your registered University Seat Number (USN). A verification OTP will be sent to your registered Gmail address.
            </p>

            <div style={{ marginBottom: "1.35rem" }}>
              <label
                htmlFor="forgot-usn"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.4rem",
                }}
              >
                Registered USN *
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
                  id="forgot-usn"
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

            <button
              type="submit"
              disabled={loading || !usn.trim()}
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
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>SEND RECOVERY OTP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP & ENTER NEW PASSWORD */}
        {step === "verify_reset" && (
          <form onSubmit={handleResetPassword}>
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                padding: "0.75rem",
                marginBottom: "1.25rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 600 }}>
                OTP Sent to Registered Gmail:
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1d4ed8", fontFamily: "monospace", marginTop: "2px" }}>
                {maskedGmail}
              </div>
            </div>

            {/* OTP Input */}
            <div style={{ marginBottom: "1.15rem" }}>
              <label
                htmlFor="reset-otp"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.4rem",
                }}
              >
                6-Digit OTP Code *
              </label>
              <input
                id="reset-otp"
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#f8fafc",
                  border: "2px solid #2563eb",
                  borderRadius: "10px",
                  color: "#0f172a",
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  letterSpacing: "0.4em",
                  textAlign: "center",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* New Password Input */}
            <div style={{ marginBottom: "1.15rem" }}>
              <label
                htmlFor="reset-new-password"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.4rem",
                }}
              >
                New Password *
              </label>
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
                  id="reset-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {/* Confirm New Password Input */}
            <div style={{ marginBottom: "1.35rem" }}>
              <label
                htmlFor="reset-confirm-password"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
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
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                  }}
                />
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.6rem 0.75rem 2.5rem",
                    background: "#f8fafc",
                    border:
                      confirmPassword && newPassword !== confirmPassword
                        ? "1px solid #ef4444"
                        : "1px solid #cbd5e1",
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
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6 || !newPassword || newPassword !== confirmPassword}
              style={{
                width: "100%",
                padding: "0.85rem",
                background:
                  otp.length === 6 && newPassword && newPassword === confirmPassword
                    ? "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)"
                    : "#cbd5e1",
                border: "none",
                borderRadius: "10px",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor:
                  otp.length === 6 && newPassword && newPassword === confirmPassword
                    ? "pointer"
                    : "not-allowed",
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
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>UPDATE PASSWORD</span>
                </>
              )}
            </button>

            {/* Resend and Back Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "1.25rem",
                fontSize: "0.82rem",
              }}
            >
              <button
                type="button"
                onClick={() => setStep("request")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontWeight: 500,
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: "none",
                  border: "none",
                  color: resendCooldown > 0 ? "#94a3b8" : "#2563eb",
                  cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS */}
        {step === "success" && (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.15rem auto",
                border: "2px solid #16a34a",
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#0f172a" }}>
              Password Updated!
            </h2>
            <p style={{ fontSize: "0.86rem", color: "#64748b", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
              Your password has been securely updated. You can now log in using your USN and new password.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                width: "100%",
                padding: "0.85rem",
                background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
                border: "none",
                borderRadius: "10px",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              }}
            >
              <span>PROCEED TO LOGIN</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Footer Back to Login Link */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.15rem",
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
            fontSize: "0.84rem",
            color: "#64748b",
          }}
        >
          Remember your password?{" "}
          <Link
            to="/login"
            style={{
              color: "#2563eb",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
