import React from "react";
import { Link, useNavigate } from "react-router-dom";
import CollegeLogo from "../components/CollegeLogo";
import {
  GraduationCap,
  Briefcase,
  Shield,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const roles = [
    {
      id: "student",
      title: "Student Registration",
      subtitle: "5th Semester Students",
      badge: "Instant Activation with USN",
      badgeColor: "#16a34a",
      badgeBg: "#f0fdf4",
      icon: <GraduationCap size={32} color="#2563eb" />,
      description:
        "Register quickly using your official USN. Your name and details are auto-retrieved from the college roster. Verify via Gmail OTP for immediate access.",
      path: "/student-register",
      actionText: "Register as Student",
      buttonBg: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
    },
    {
      id: "teacher",
      title: "Teacher Registration",
      subtitle: "Faculty & Teaching Staff",
      badge: "Requires Admin Approval",
      badgeColor: "#d97706",
      badgeBg: "#fffbeb",
      icon: <Briefcase size={32} color="#0284c7" />,
      description:
        "Register using your Teacher Employee ID and personal or college Gmail. Account is activated following Admin or Department HOD verification.",
      path: "/register/teacher",
      actionText: "Register as Teacher",
      buttonBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    },
    {
      id: "hod",
      title: "Head of Department",
      subtitle: "Department Leadership",
      badge: "Super Admin Approval Required",
      badgeColor: "#7c3aed",
      badgeBg: "#f5f3ff",
      icon: <Shield size={32} color="#6d28d9" />,
      description:
        "Department HOD registration portal. Authorize access to department timetable, faculty assignments, and attendance logs. Super Admin approval required.",
      path: "/register/hod",
      actionText: "Register as HOD",
      buttonBg: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)",
        padding: "2.5rem 1rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Top Header Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "2rem",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
            position: "relative",
          }}
        >
          <Link
            to="/login"
            style={{
              position: "absolute",
              top: "1.5rem",
              left: "1.5rem",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.85rem",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            <CollegeLogo size="lg" />
          </div>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e293b", margin: "0 0 0.5rem 0" }}>
            SmartDept Registration Portal
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "0 auto 0.35rem", fontWeight: 600 }}>
            Smart Department Academic & Campus Management System
          </p>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "0 auto", maxWidth: "600px" }}>
            Please select your institutional role below to initiate your registration and account setup.
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {roles.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                padding: "1.75rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                border: "1px solid #e2e8f0",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div>
                {/* Header & Icon */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {r.icon}
                  </div>

                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.55rem",
                      borderRadius: "6px",
                      background: r.badgeBg,
                      color: r.badgeColor,
                    }}
                  >
                    {r.badge}
                  </span>
                </div>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.25rem 0" }}>
                  {r.title}
                </h2>
                <div style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 600, marginBottom: "0.75rem" }}>
                  {r.subtitle}
                </div>

                <p style={{ fontSize: "0.86rem", color: "#64748b", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
                  {r.description}
                </p>
              </div>

              <Link
                to={r.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.8rem 1rem",
                  borderRadius: "10px",
                  background: r.buttonBg,
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                <span>{r.actionText}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        {/* Administrator Policy Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            border: "1px solid #cbd5e1",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b" }}>
              Administrator Account Notice
            </div>
            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
              Public self-registration for Administrator accounts is strictly prohibited by institutional policy. New Administrator credentials must be authorized directly by existing System Administrators.
            </div>
          </div>
        </div>

        {/* Sign In Footer */}
        <div style={{ textAlign: "center", color: "#ffffff", fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#93c5fd",
              fontWeight: 700,
              textDecoration: "none",
              marginLeft: "0.25rem",
            }}
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
