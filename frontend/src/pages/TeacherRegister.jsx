import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/auth";
import departmentsApi from "../api/departments";
import CollegeLogo from "../components/CollegeLogo";
import { useToast } from "../components/Toast";
import {
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Building2,
  User,
  KeyRound,
} from "lucide-react";

export default function TeacherRegister() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  // Workflow steps: "details" | "otp" | "success"
  const [step, setStep] = useState("details");

  // Form fields
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP field & cooldown
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load department list
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await departmentsApi.getAll();
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          setDepartments(list);
          setDepartmentId(list[0].id);
        }
      } catch (e) {
        setDepartments([
          { id: 1, name: "Computer Science & Engineering", code: "CSE" },
          { id: 2, name: "Information Science & Engineering", code: "ISE" },
          { id: 3, name: "Electronics & Communication Engineering", code: "ECE" },
        ]);
      }
    }
    loadDepts();
  }, []);

  // Cooldown countdown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to teacher's Gmail
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmp = employeeId.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanMail = gmail.trim().toLowerCase();

    if (!cleanEmp) {
      setErrorMessage("Please enter your Teacher Employee ID (e.g. FAC-CSE-001).");
      return;
    }
    if (!cleanName) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!cleanMail || !cleanMail.includes("@")) {
      setErrorMessage("Please enter a valid Gmail address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Password and Confirm Password do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOtp(cleanMail, "Teacher Registration");
      setSuccessMessage(
        res.data?.message ||
        `A 6-digit OTP code has been dispatched to ${cleanMail}. Valid for 5 minutes.`
      );
      toastSuccess("OTP verification code sent!");
      setStep("otp");
      setResendCooldown(60);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to send OTP code. Please verify the Gmail address.";
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage("");
    setLoading(true);
    try {
      await authApi.sendOtp(gmail.trim().toLowerCase(), "Teacher Registration");
      setSuccessMessage(`New verification code sent to ${gmail}.`);
      toastSuccess("New OTP sent!");
      setResendCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to resend OTP. Please wait a moment.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete Teacher Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP code received on your Gmail.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employee_id: employeeId.trim().toUpperCase(),
        name: name.trim(),
        department_id: Number(departmentId) || 1,
        gmail: gmail.trim().toLowerCase(),
        password: password,
        confirm_password: confirmPassword,
        otp: cleanOtp,
      };

      const res = await authApi.registerTeacher(payload);
      toastSuccess("Teacher registration request submitted!");
      setSuccessMessage(
        res.data?.message ||
        "Registration request submitted successfully. Admin approval is required before you can log in."
      );
      setStep("success");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Registration failed. Please check the OTP and details.";
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
        padding: "2rem 1rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.35)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
            padding: "1.75rem 1.5rem 1.25rem 1.5rem",
            color: "#ffffff",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
            <CollegeLogo size="md" invert />
          </div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 0.25rem 0" }}>
            Teacher Registration
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#bfdbfe", margin: 0 }}>
            Faculty & Academic Staff Account Setup
          </p>

          <Link
            to="/register"
            style={{
              position: "absolute",
              top: "1.25rem",
              left: "1.25rem",
              color: "#bfdbfe",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.78rem",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>
        </div>

        {/* Step Indicator */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "0.75rem",
              textAlign: "center",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: step === "details" ? "#2563eb" : "#16a34a",
              borderBottom: step === "details" ? "2px solid #2563eb" : "none",
            }}
          >
            1. Faculty Details
          </div>
          <div
            style={{
              flex: 1,
              padding: "0.75rem",
              textAlign: "center",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: step === "otp" ? "#2563eb" : (step === "success" ? "#16a34a" : "#94a3b8"),
              borderBottom: step === "otp" ? "2px solid #2563eb" : "none",
            }}
          >
            2. Gmail OTP
          </div>
          <div
            style={{
              flex: 1,
              padding: "0.75rem",
              textAlign: "center",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: step === "success" ? "#16a34a" : "#94a3b8",
            }}
          >
            3. Approval Status
          </div>
        </div>

        {/* Body Container */}
        <div style={{ padding: "1.75rem 1.5rem" }}>
          {errorMessage && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 0.9rem",
                borderRadius: "8px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "0.85rem",
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-start",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && step !== "success" && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 0.9rem",
                borderRadius: "8px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "0.85rem",
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-start",
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{successMessage}</div>
            </div>
          )}

          {/* STEP 1: FORM */}
          {step === "details" && (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Employee ID */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Teacher Employee ID <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Briefcase size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    placeholder="e.g. FAC-CSE-001"
                    required
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem 0.7rem 2.4rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                      textTransform: "uppercase",
                    }}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Full Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <User size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prof. Ananya Iyer"
                    required
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem 0.7rem 2.4rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Department <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Building2 size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem 0.7rem 2.4rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                      background: "#ffffff",
                    }}
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code || dept.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Personal or College Gmail */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Personal or College Gmail <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type="email"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    placeholder="faculty.name@gmail.com"
                    required
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem 0.7rem 2.4rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Password <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    style={{
                      width: "100%",
                      padding: "0.7rem 2.4rem 0.7rem 2.4rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Confirm Password <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    style={{
                      width: "100%",
                      padding: "0.7rem 2.4rem 0.7rem 2.4rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Notice */}
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  fontSize: "0.8rem",
                  color: "#1e40af",
                }}
              >
                <strong>Admin Approval Note:</strong> Teacher accounts require verification by the Department HOD or College Administrator before access to marks, attendance, and timetable modules is enabled.
              </div>

              {/* Submit Step 1 */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  background: loading ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  border: "none",
                  cursor: loading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Gmail & Continue</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === "otp" && (
            <form onSubmit={handleCompleteRegistration} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <KeyRound size={24} />
                </div>
                <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem", color: "#1e293b" }}>
                  Verify Your Gmail
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  A 6-digit OTP code was sent to <strong style={{ color: "#1e40af" }}>{gmail}</strong>.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem", textAlign: "center" }}>
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="------"
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    borderRadius: "8px",
                    border: "2px solid #2563eb",
                    fontSize: "1.5rem",
                    letterSpacing: "0.5rem",
                    textAlign: "center",
                    fontWeight: 700,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", textDecoration: "underline" }}
                >
                  Edit details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 ? "#94a3b8" : "#2563eb",
                    cursor: resendCooldown > 0 ? "default" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  borderRadius: "8px",
                  background: loading || otp.length !== 6 ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Submit Teacher Registration</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: SUCCESS & PENDING STATE */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#fef3c7",
                  color: "#d97706",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <CheckCircle2 size={36} color="#16a34a" />
              </div>

              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem 0" }}>
                Registration Submitted!
              </h2>

              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "10px",
                  padding: "1rem",
                  margin: "1rem 0",
                  textAlign: "left",
                  fontSize: "0.86rem",
                  color: "#92400e",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>
                  Status: Pending Administrator Approval
                </div>
                <div>
                  Your teacher registration for <strong>{name}</strong> ({employeeId}) has been logged. For security and role verification, an Administrator or Department HOD must approve this account before login is granted.
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem" }}>
                <Link
                  to="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  <span>Go to Login</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}

          {/* Back to Login Footer */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid #e2e8f0",
              textAlign: "center",
              fontSize: "0.85rem",
              color: "#64748b",
            }}
          >
            Already have an active account?{" "}
            <Link to="/login" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
