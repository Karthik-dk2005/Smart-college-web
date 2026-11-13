import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import departmentsApi from "../api/departments";
import CollegeLogo from "../components/CollegeLogo";
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  GraduationCap,
  Briefcase,
  Hash,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    usn_or_employee_id: "",
    email: "",
    mobile_number: "",
    department_id: "",
    role: "student",
    semester: 5,
    section: "A",
    designation: "Assistant Professor",
    username: "",
    password: "",
    confirm_password: "",
  });

  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const { register } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await departmentsApi.getAll();
        const deptList = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        setDepartments(deptList);
        if (deptList.length > 0 && !formData.department_id) {
          setFormData((prev) => ({ ...prev, department_id: deptList[0].id }));
        }
      } catch (err) {
        console.warn("Could not load departments:", err);
        // Fallback default departments if API unavailable
        setDepartments([
          { id: 1, name: "Computer Science & Engineering", code: "CSE" },
          { id: 2, name: "Information Science & Engineering", code: "ISE" },
          { id: 3, name: "Electronics & Communication Engineering", code: "ECE" },
          { id: 4, name: "Mechanical Engineering", code: "ME" },
          { id: 5, name: "Civil Engineering", code: "CV" },
        ]);
        setFormData((prev) => ({ ...prev, department_id: 1 }));
      }
    }
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage("");
  };

  const validateForm = () => {
    // 1. Required fields
    if (!formData.full_name.trim()) return "Full name is required.";
    if (!formData.usn_or_employee_id.trim()) {
      return formData.role === "student" ? "USN is required." : "Employee ID is required.";
    }
    if (!formData.email.trim()) return "Email address is required.";
    if (!formData.mobile_number.trim()) return "Mobile number is required.";
    if (!formData.username.trim()) return "Username is required.";
    if (!formData.password) return "Password is required.";
    if (!formData.confirm_password) return "Please confirm your password.";

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return "Please enter a valid institutional or personal email address.";
    }

    // 3. Mobile number validation (10 digits)
    const mobileDigits = formData.mobile_number.replace(/\D/g, "");
    if (mobileDigits.length !== 10) {
      return "Mobile number must be exactly 10 digits.";
    }

    // 4. Password length and match
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    if (formData.password !== formData.confirm_password) {
      return "Password and Confirm Password do not match.";
    }

    // 5. Username format
    if (formData.username.length < 3) {
      return "Username must be at least 3 characters long.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationErr = validateForm();
    if (validationErr) {
      setErrorMessage(validationErr);
      toastError(validationErr);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        name: formData.full_name.trim(),
        usn_or_employee_id: formData.usn_or_employee_id.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        mobile_number: formData.mobile_number.trim(),
        department_id: formData.department_id ? Number(formData.department_id) : null,
        role: formData.role,
        semester: formData.role === "student" ? Number(formData.semester) : null,
        section: formData.role === "student" ? formData.section : null,
        designation: formData.role === "teacher" ? formData.designation : null,
        username: formData.username.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
      };

      const res = await register(payload);
      setSuccessInfo(res);
      setSubmittedSuccess(true);
      toastSuccess("Registration submitted successfully!");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Registration failed. Please check your information and try again.";
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submittedSuccess) {
    const isPending =
      successInfo?.account_status === "Pending" || formData.role === "student";

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
            maxWidth: "520px",
            width: "100%",
            background: "#ffffff",
            borderRadius: "20px",
            padding: "2.75rem 2.25rem",
            textAlign: "center",
            boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.12)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: isPending ? "#ecfdf5" : "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              color: isPending ? "#059669" : "#2563eb",
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>
            Registration Submitted Successfully!
          </h2>

          <div
            style={{
              display: "inline-block",
              background: isPending ? "#fef3c7" : "#ecfdf5",
              color: isPending ? "#b45309" : "#047857",
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.82rem",
              fontWeight: 700,
              margin: "0.5rem 0 1.25rem",
            }}
          >
            Status: {isPending ? "Pending Admin / HOD Approval" : "Approved"}
          </div>

          <p style={{ color: "#475569", fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 1.75rem" }}>
            {isPending ? (
              <>
                Thank you, <strong>{formData.full_name}</strong>. Your student account request has been
                recorded. For security and academic verification, your account must be approved by your
                Department HOD or the Institutional Administrator before you can log in.
              </>
            ) : (
              <>
                Your account has been created successfully. You can now log in with your credentials.
              </>
            )}
          </p>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.85rem",
              color: "#334155",
              marginBottom: "1.75rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              Registration Summary:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", rowGap: "0.35rem" }}>
              <span style={{ color: "#64748b" }}>Username:</span>
              <strong style={{ color: "#0f172a" }}>{formData.username}</strong>
              <span style={{ color: "#64748b" }}>Email:</span>
              <strong style={{ color: "#0f172a" }}>{formData.email}</strong>
              <span style={{ color: "#64748b" }}>
                {formData.role === "student" ? "USN:" : "Employee ID:"}
              </span>
              <strong style={{ color: "#0f172a" }}>{formData.usn_or_employee_id}</strong>
              <span style={{ color: "#64748b" }}>Role:</span>
              <strong style={{ textTransform: "capitalize", color: "#0f172a" }}>
                {formData.role}
              </strong>
            </div>
          </div>

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
            <span>Proceed to Login</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
        padding: "2rem 1.25rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "2.5rem 2.25rem",
          boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "0.75rem",
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
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            ACADEMIC PORTAL REGISTRATION
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

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              color: "#b91c1c",
              fontSize: "0.88rem",
            }}
          >
            <AlertCircle size={18} style={{ marginTop: "2px", flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Role Selection Tabs */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "0.45rem",
              }}
            >
              Account Type / Role *
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                background: "#f8fafc",
                padding: "0.35rem",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
              }}
            >
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "student" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 1rem",
                  borderRadius: "9px",
                  border: "none",
                  background: formData.role === "student" ? "#1e3a8a" : "transparent",
                  color: formData.role === "student" ? "#ffffff" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <GraduationCap size={18} />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "teacher" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 1rem",
                  borderRadius: "9px",
                  border: "none",
                  background: formData.role === "teacher" ? "#1e3a8a" : "transparent",
                  color: formData.role === "teacher" ? "#ffffff" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Briefcase size={18} />
                <span>Teacher / Faculty</span>
              </button>
            </div>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.76rem", color: "#64748b" }}>
              {formData.role === "student"
                ? "ℹ️ Student registrations require approval from HOD or Admin before activation."
                : "ℹ️ Teacher accounts can also be created directly by HOD or Institutional Admin."}
            </p>
          </div>

          {/* 2-Column Grid for Fields */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.1rem",
            }}
          >
            {/* Full Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.35rem",
                }}
              >
                Full Name *
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="text"
                  required
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Amulya H S"
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.8rem 0.7rem 2.4rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* USN / Employee ID */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.35rem",
                }}
              >
                {formData.role === "student" ? "USN (University Seat Number) *" : "Employee / Faculty ID *"}
              </label>
              <div style={{ position: "relative" }}>
                <Hash
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="text"
                  required
                  name="usn_or_employee_id"
                  value={formData.usn_or_employee_id}
                  onChange={handleChange}
                  placeholder={formData.role === "student" ? "e.g. 4MH21CS001" : "e.g. FAC-CSE-012"}
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.8rem 0.7rem 2.4rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    fontSize: "0.9rem",
                    outline: "none",
                    textTransform: "uppercase",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Institutional Email Address */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.35rem",
                }}
              >
                Email Address *
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. name@mitt.ac.in"
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.8rem 0.7rem 2.4rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.35rem",
                }}
              >
                Mobile Number (10 digits) *
              </label>
              <div style={{ position: "relative" }}>
                <Phone
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.8rem 0.7rem 2.4rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Department Dropdown */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.35rem",
                }}
              >
                Department *
              </label>
              <div style={{ position: "relative" }}>
                <Building2
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <select
                  required
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.8rem 0.7rem 2.4rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional: Semester & Section for Students */}
            {formData.role === "student" && (
              <>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Semester (1 to 8) *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.8rem",
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "9px",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Section *
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.8rem",
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "9px",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    {["A", "B", "C", "D"].map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Conditional: Designation for Teachers */}
            {formData.role === "teacher" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "0.35rem",
                  }}
                >
                  Designation *
                </label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.8rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Adjunct Faculty">Adjunct Faculty</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>
            )}

            {/* Username */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.35rem",
                }}
              >
                Username *
              </label>
              <div style={{ position: "relative" }}>
                <UserCheck
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="text"
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. amulya_cs"
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.8rem 0.7rem 2.4rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.35rem",
                }}
              >
                Password (min 6 characters) *
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "0.7rem 2.5rem 0.7rem 2.4rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    fontSize: "0.9rem",
                    outline: "none",
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
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "0.35rem",
                }}
              >
                Confirm Password *
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "0.7rem 2.5rem 0.7rem 2.4rem",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    fontSize: "0.9rem",
                    outline: "none",
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
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Registration Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "1rem",
              padding: "0.9rem 1.5rem",
              borderRadius: "10px",
              background: "#1e3a8a",
              color: "#ffffff",
              border: "none",
              fontSize: "0.98rem",
              fontWeight: 700,
              letterSpacing: "0.03em",
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
              <span>Submitting Registration...</span>
            ) : (
              <>
                <UserCheck size={18} />
                <span>SUBMIT REGISTRATION</span>
              </>
            )}
          </button>
        </form>

        {/* Existing Account Link */}
        <div
          style={{
            marginTop: "1.75rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 0.5rem" }}>
            Already registered with an institutional account?
          </p>
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "#1e3a8a",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            <span>Sign in to your account</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Security / Compliance Badge */}
        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
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
