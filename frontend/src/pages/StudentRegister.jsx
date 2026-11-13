import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import studentAuthApi from "../api/studentAuth";
import { useAuth } from "../context/AuthContext";
import CollegeLogo from "../components/CollegeLogo";
import {
  IdCard,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  GraduationCap,
  Sparkles,
  Check,
  Building2,
  Calendar,
} from "lucide-react";

export default function StudentRegister() {
  const navigate = useNavigate();
  const { setSession } = useAuth() || {};

  // Workflow steps: "form" | "otp" | "success"
  const [step, setStep] = useState("form");

  // Form inputs (Only USN, Password, Confirm Password as specified)
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Automatically fetched read-only information
  const [studentInfo, setStudentInfo] = useState(null);
  const [fetchingUsn, setFetchingUsn] = useState(false);

  // OTP State
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  // Automatically fetch student Name and registered Gmail when USN is entered
  const handleCheckUsn = async (usnToLookup) => {
    const cleanUsn = (usnToLookup || usn).trim().toUpperCase();
    if (!cleanUsn || cleanUsn.length < 5) return;

    setFetchingUsn(true);
    setError("");

    try {
      const data = await studentAuthApi.checkUsn(cleanUsn);
      setStudentInfo(data);
      if (data.is_registered) {
        setError("This account is already registered! Please proceed to Login.");
      } else {
        setSuccessMsg(`Official record matched for ${data.name}.`);
      }
    } catch (err) {
      setStudentInfo(null);
      if (err.response?.status === 404) {
        setError("Student record not found. Please contact your Admin.");
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Student record not found. Please contact your Admin."
        );
      }
    } finally {
      setFetchingUsn(false);
    }
  };

  // Debounced / onBlur USN auto-check
  const handleUsnChange = (e) => {
    const val = e.target.value.toUpperCase();
    setUsn(val);
    setError("");
    if (studentInfo && val !== studentInfo.usn) {
      setStudentInfo(null);
    }
    // Auto-fetch if user types a standard VTU USN length (10 chars e.g. 4MN23CS001, 4MN25CS410)
    if (val.length === 10) {
      handleCheckUsn(val);
    }
  };

  // Step 1: Submit Registration (USN + Password + Confirm Password)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanUsn = usn.trim().toUpperCase();
    if (!cleanUsn) {
      setError("Please enter your USN.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setLoading(true);

    try {
      // First ensure details are fetched if not already
      let currentInfo = studentInfo;
      if (!currentInfo || currentInfo.usn !== cleanUsn) {
        currentInfo = await studentAuthApi.checkUsn(cleanUsn);
        setStudentInfo(currentInfo);
      }

      if (currentInfo.is_registered) {
        setError("This account is already registered. Please proceed to login.");
        setLoading(false);
        return;
      }

      // Call registration API - sends OTP to registered Gmail
      const res = await studentAuthApi.register({
        usn: cleanUsn,
        password,
        confirm_password: confirmPassword,
      });

      setSuccessMsg(
        res.message ||
        `OTP sent successfully to registered Gmail: ${res.gmail || currentInfo.gmail}`
      );
      setStep("otp");
      setResendCooldown(60);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Student record not found. Please contact your Admin.");
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Registration failed. Please verify your details."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP sent to your registered Gmail.");
      return;
    }

    setLoading(true);

    try {
      const res = await studentAuthApi.verifyOtp(usn.trim().toUpperCase(), cleanOtp);

      // Successfully activated!
      if (setSession && res.access_token && res.user) {
        setSession(res.access_token, res.user, "student");
      }

      setSuccessMsg("Account successfully verified and activated!");
      setStep("success");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Invalid or expired OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await studentAuthApi.resendOtp(usn.trim().toUpperCase());
      setSuccessMsg(res.message || "A fresh OTP has been sent to your registered Gmail.");
      setResendCooldown(60);
    } catch (err) {
      setError(
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
          Department of Computer Science & Engineering • Easy Student Portal
        </p>
      </div>

      {/* Main Registration Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "18px",
          padding: "2rem",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)",
        }}
      >
        {/* Step Indicator Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <GraduationCap style={{ color: "#6366f1" }} size={22} />
              {step === "form" && "Easy Student Registration"}
              {step === "otp" && "Verify Gmail with OTP"}
              {step === "success" && "Registration Completed!"}
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0.25rem 0 0 0" }}>
              {step === "form" && "Enter your USN and password to activate your account"}
              {step === "otp" && "Enter the 6-digit OTP code sent to your registered Gmail"}
              {step === "success" && "Your student account is now active and ready"}
            </p>
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "20px",
              background: step === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(99, 102, 241, 0.2)",
              color: step === "success" ? "#34d399" : "#a5b4fc",
              border: step === "success" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(99, 102, 241, 0.4)",
            }}
          >
            {step === "form" ? "Step 1 of 2" : step === "otp" ? "Step 2 of 2" : "Completed"}
          </span>
        </div>

        {/* Global Notifications */}
        {error && (
          <div
            style={{
              padding: "0.9rem 1rem",
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
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "0.85rem 1rem",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              borderRadius: "10px",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              color: "#6ee7b7",
              fontSize: "0.86rem",
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* ================= STEP 1: REGISTRATION FORM ================= */}
        {step === "form" && (
          <form onSubmit={handleRegisterSubmit}>
            {/* 1. USN Input */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="usn-input"
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
                1. University Seat Number (USN) *
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
                  id="usn-input"
                  type="text"
                  placeholder="e.g. 4MN23CS001 or 4MN25CS410"
                  value={usn}
                  onChange={handleUsnChange}
                  onBlur={() => handleCheckUsn()}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.6rem 0.75rem 2.6rem",
                    background: "rgba(30, 41, 59, 0.7)",
                    border: studentInfo
                      ? "1px solid #10b981"
                      : error
                      ? "1px solid #ef4444"
                      : "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    fontFamily: "monospace",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                {fetchingUsn ? (
                  <RefreshCw
                    size={16}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#818cf8",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                ) : studentInfo ? (
                  <Check
                    size={18}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#10b981",
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCheckUsn()}
                    style={{
                      position: "absolute",
                      right: "6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(99, 102, 241, 0.3)",
                      border: "none",
                      color: "#c7d2fe",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Check
                  </button>
                )}
              </div>
              <p style={{ fontSize: "0.74rem", color: "#64748b", margin: "0.3rem 0 0 0" }}>
                Enter your official VTU USN. Your name and registered Gmail will be retrieved automatically.
              </p>
            </div>

            {/* Read-only Automatically Fetched Information Card */}
            {studentInfo && (
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.55)",
                  border: "1px solid rgba(99, 102, 241, 0.35)",
                  borderRadius: "12px",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <ShieldCheck size={14} /> Official Record Retrieved (Read-Only)
                  </span>
                  <span style={{ fontSize: "0.7rem", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                    Section {studentInfo.section}
                  </span>
                </div>

                {/* Read-Only Student Name */}
                <div style={{ marginBottom: "0.6rem" }}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={studentInfo.name}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      cursor: "not-allowed",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Read-Only Registered Gmail */}
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                    Registered Gmail Address (OTP Destination)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={studentInfo.gmail}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#38bdf8",
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      fontFamily: "monospace",
                      cursor: "not-allowed",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {/* 2. Password Input */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="password-input"
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
                2. Create Password *
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
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
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

            {/* 3. Confirm Password Input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="confirm-password-input"
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
                3. Confirm Password *
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
                  id="confirm-password-input"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.6rem 0.75rem 2.6rem",
                    background: "rgba(30, 41, 59, 0.7)",
                    border:
                      confirmPassword && password !== confirmPassword
                        ? "1px solid #ef4444"
                        : "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                    outline: "none",
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
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ fontSize: "0.75rem", color: "#f87171", margin: "0.3rem 0 0 0" }}>
                  Passwords do not match.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || fetchingUsn}
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
                  Sending OTP to Gmail...
                </>
              ) : (
                <>
                  Register & Send OTP <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= STEP 2: OTP VERIFICATION ================= */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem auto",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                <Mail size={28} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.4rem 0", color: "#f8fafc" }}>
                Enter 6-Digit OTP Code
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
                We have sent an authentication code to your registered Gmail:
              </p>
              <div
                style={{
                  display: "inline-block",
                  margin: "0.5rem 0",
                  padding: "4px 12px",
                  background: "rgba(56, 189, 248, 0.1)",
                  borderRadius: "6px",
                  color: "#38bdf8",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                }}
              >
                {studentInfo?.gmail || "your registered Gmail"}
              </div>
            </div>

            {/* OTP Input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  background: "rgba(30, 41, 59, 0.7)",
                  border: "2px solid rgba(99, 102, 241, 0.4)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: "0.5em",
                  textAlign: "center",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{
                width: "100%",
                padding: "0.85rem",
                background:
                  otp.length === 6
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "rgba(16, 185, 129, 0.4)",
                border: "none",
                borderRadius: "10px",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: otp.length === 6 ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Verifying OTP...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> Verify OTP & Complete Registration
                </>
              )}
            </button>

            {/* Resend & Back buttons */}
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
                onClick={() => setStep("form")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                ← Back to Edit Details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: "none",
                  border: "none",
                  color: resendCooldown > 0 ? "#64748b" : "#818cf8",
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

        {/* ================= STEP 3: SUCCESS COMPLETED ================= */}
        {step === "success" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.2)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem auto",
                border: "2px solid #10b981",
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#ffffff" }}>
              Registration Successful!
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#94a3b8", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
              Your student account has been registered and verified with your official department records.
              You can now access your personal timetable, attendance, and IA marks.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  border: "none",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
                }}
              >
                Go to Student Dashboard <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/student-login")}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Go to Student Login
              </button>
            </div>
          </div>
        )}

        {/* Footer Links */}
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
          Already registered?{" "}
          <Link
            to="/student-login"
            style={{
              color: "#818cf8",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Login with USN & Password
          </Link>
          <div style={{ marginTop: "0.5rem" }}>
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
