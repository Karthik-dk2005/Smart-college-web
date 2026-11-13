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
  Check,
  ArrowLeft,
} from "lucide-react";

export default function StudentRegister() {
  const navigate = useNavigate();
  const { setSession } = useAuth() || {};

  // Workflow steps: "form" | "otp" | "success"
  const [step, setStep] = useState("form");

  // Form inputs (strictly USN, Password, Confirm Password)
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Automatically retrieved read-only information
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
        setSuccessMsg(`Official record retrieved for ${data.name}.`);
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

  const handleUsnChange = (e) => {
    const val = e.target.value.toUpperCase();
    setUsn(val);
    setError("");
    if (studentInfo && val !== studentInfo.usn) {
      setStudentInfo(null);
    }
    if (val.length === 10) {
      handleCheckUsn(val);
    }
  };

  // Submit Registration Form
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

      // Sends OTP to the official registered Gmail address
      const res = await studentAuthApi.register({
        usn: cleanUsn,
        password,
        confirm_password: confirmPassword,
      });

      setSuccessMsg(
        res.message ||
        `Verification code sent to registered Gmail: ${res.gmail || currentInfo.gmail}`
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

  // Verify OTP & Activate Account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code sent to your registered Gmail.");
      return;
    }

    setLoading(true);

    try {
      const res = await studentAuthApi.verifyOtp(usn.trim().toUpperCase(), cleanOtp);

      if (setSession && res.access_token && res.user) {
        setSession(res.access_token, res.user, "student");
      }

      setSuccessMsg("Account successfully verified and activated!");
      setStep("success");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Invalid or expired OTP. Please check your Gmail and try again."
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
      setSuccessMsg(res.message || "A new OTP code has been dispatched to your Gmail.");
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
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)",
        padding: "1.5rem 1rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Centered Card in Blue & White Theme */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
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
            Student Registration
          </h1>
          <p
            style={{
              fontSize: "0.82rem",
              color: "#64748b",
              margin: 0,
              fontWeight: 500,
            }}
          >
            Smart Department Academic Management System
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
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
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
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
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* STEP 1: FORM */}
        {step === "form" && (
          <form onSubmit={handleRegisterSubmit}>
            {/* 1. USN Input */}
            <div style={{ marginBottom: "1.15rem" }}>
              <label
                htmlFor="register-usn"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.4rem",
                }}
              >
                1. Student USN *
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
                  id="register-usn"
                  type="text"
                  placeholder="e.g. 4MN23CS001 or 4MN25CS410"
                  value={usn}
                  onChange={handleUsnChange}
                  onBlur={() => handleCheckUsn()}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.8rem 0.75rem 2.5rem",
                    background: "#f8fafc",
                    border: studentInfo
                      ? "1px solid #16a34a"
                      : error
                      ? "1px solid #ef4444"
                      : "1px solid #cbd5e1",
                    borderRadius: "10px",
                    color: "#0f172a",
                    fontSize: "0.92rem",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
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
                      color: "#2563eb",
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
                      color: "#16a34a",
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
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1d4ed8",
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
              <p style={{ fontSize: "0.72rem", color: "#64748b", margin: "0.3rem 0 0 0" }}>
                Name and registered Gmail will be loaded automatically from official college records.
              </p>
            </div>

            {/* Read-Only Automatically Displayed Information */}
            {studentInfo && (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #bfdbfe",
                  borderRadius: "12px",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "0.74rem", color: "#1d4ed8", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <ShieldCheck size={14} /> Official Record (Read-Only)
                  </span>
                  <span style={{ fontSize: "0.7rem", background: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: "10px", fontWeight: 700, border: "1px solid #a7f3d0" }}>
                    Section {studentInfo.section}
                  </span>
                </div>

                <div style={{ marginBottom: "0.6rem" }}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#475569", fontWeight: 600, marginBottom: "0.2rem" }}>
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={studentInfo.name}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      color: "#0f172a",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "not-allowed",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#475569", fontWeight: 600, marginBottom: "0.2rem" }}>
                    Registered Gmail Address (OTP Destination)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={studentInfo.gmail}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      color: "#2563eb",
                      fontSize: "0.9rem",
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
            <div style={{ marginBottom: "1.15rem" }}>
              <label
                htmlFor="register-password"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.4rem",
                }}
              >
                2. Password *
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
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
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

            {/* 3. Confirm Password Input */}
            <div style={{ marginBottom: "1.35rem" }}>
              <label
                htmlFor="register-confirm-password"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.4rem",
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
                    color: "#64748b",
                  }}
                />
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.6rem 0.75rem 2.5rem",
                    background: "#f8fafc",
                    border:
                      confirmPassword && password !== confirmPassword
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
              {confirmPassword && password !== confirmPassword && (
                <p style={{ fontSize: "0.72rem", color: "#dc2626", margin: "0.3rem 0 0 0" }}>
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
                  <span>Sending OTP to Gmail...</span>
                </>
              ) : (
                <>
                  <span>REGISTER & SEND OTP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 0.85rem auto",
                  border: "1px solid #bfdbfe",
                }}
              >
                <Mail size={24} />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.35rem 0", color: "#0f172a" }}>
                Verify Registered Gmail
              </h2>
              <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Enter the 6-digit OTP code sent to:
              </p>
              <div
                style={{
                  display: "inline-block",
                  margin: "0.4rem 0",
                  padding: "4px 10px",
                  background: "#eff6ff",
                  borderRadius: "6px",
                  color: "#1d4ed8",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  border: "1px solid #bfdbfe",
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
                  background: "#f8fafc",
                  border: "2px solid #2563eb",
                  borderRadius: "12px",
                  color: "#0f172a",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: "0.45em",
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
                    ? "linear-gradient(135deg, #15803d 0%, #16a34a 100%)"
                    : "#cbd5e1",
                border: "none",
                borderRadius: "10px",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: otp.length === 6 ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 14px rgba(22, 163, 74, 0.25)",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>VERIFY OTP & ACTIVATE</span>
                </>
              )}
            </button>

            {/* Resend and Back links */}
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
              <CheckCircle size={32} />
            </div>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#0f172a" }}>
              Account Activated!
            </h2>
            <p style={{ fontSize: "0.86rem", color: "#64748b", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
              Your student account has been verified with official department records. You can now access your timetable, attendance, and IA marks.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
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
                <span>Go to Student Dashboard</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        )}

        {/* Footer Login Link */}
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
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#2563eb",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Login here →
          </Link>
        </div>
      </div>
    </div>
  );
}
