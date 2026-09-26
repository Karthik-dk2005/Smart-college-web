import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Sparkles, User, Mail, Lock, Phone, UserCheck, ArrowRight } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      error("Please complete all required fields");
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      success("Account created successfully! Logging you in...");
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      error(err.message || "Failed to register account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% -20%, #1e1b4b 0%, #0a0f1d 70%)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(17, 24, 39, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "2.25rem",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 8px 25px rgba(99, 102, 241, 0.4)",
              marginBottom: "0.75rem",
            }}
          >
            <Sparkles size={26} />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc" }}>
            Create an Account
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Join the Smart Department Academic Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Full Name *
            </label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Kumar"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem 0.65rem 2.3rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Email Address *
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@college.edu"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem 0.65rem 2.3rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              >
                <option value="student" style={{ background: "#111827" }}>Student</option>
                <option value="faculty" style={{ background: "#111827" }}>Faculty</option>
                <option value="hod" style={{ background: "#111827" }}>HOD</option>
                <option value="admin" style={{ background: "#111827" }}>Admin</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                Phone Number
              </label>
              <div style={{ position: "relative" }}>
                <Phone size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91..."
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem 0.65rem 2.1rem",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
              Password *
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem 0.65rem 2.3rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              padding: "0.75rem",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.35)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.85rem", color: "#94a3b8" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
