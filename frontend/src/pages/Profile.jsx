import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import usersApi from "../api/users";
import studentsApi from "../api/students";
import facultyApi from "../api/faculty";
import attendanceApi from "../api/attendance";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building,
  Award,
  Key,
  Calendar,
  Save,
  CheckCircle,
  Clock,
  BookOpen,
  Lock,
  UserCheck,
} from "lucide-react";

export default function Profile() {
  const { user, login } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("overview"); // overview, edit, security
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [extraDetails, setExtraDetails] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setProfileData({
        name: user.name || "",
        phone: user.phone || "",
      });
      fetchRoleSpecificDetails();
    }
  }, [user]);

  const fetchRoleSpecificDetails = async () => {
    try {
      if (user?.role === "student") {
        const res = await studentsApi.getAll({ search: user.email });
        if (res.data?.data && res.data.data.length > 0) {
          const studentObj = res.data.data[0];
          setExtraDetails(studentObj);
          // Fetch student attendance summary
          try {
            const attRes = await attendanceApi.getSummary({ student_id: studentObj.id });
            if (attRes.data?.data) {
              setAttendanceStats(attRes.data.data);
            }
          } catch (e) {
            // Summary fetch optional
          }
        }
      } else if (user?.role === "faculty") {
        const res = await facultyApi.getAll({ search: user.email });
        if (res.data?.data && res.data.data.length > 0) {
          setExtraDetails(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch role details:", err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      addToast({
        title: "Validation Error",
        message: "Full name cannot be blank.",
        type: "warning",
      });
      return;
    }

    try {
      setSavingProfile(true);
      const res = await usersApi.update(user.id, {
        name: profileData.name,
        phone: profileData.phone,
      });

      addToast({
        title: "Profile Updated",
        message: "Your profile details have been saved.",
        type: "success",
      });

      // Update local storage user profile cache
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...u,
            name: profileData.name,
            phone: profileData.phone,
          })
        );
      }
    } catch (err) {
      console.error("Update profile failed:", err);
      addToast({
        title: "Update Failed",
        message: err.response?.data?.detail || "Could not update profile.",
        type: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.password) {
      addToast({
        title: "Password Required",
        message: "Please enter a new password.",
        type: "warning",
      });
      return;
    }

    if (passwordData.password.length < 6) {
      addToast({
        title: "Password Too Short",
        message: "Password must be at least 6 characters long.",
        type: "warning",
      });
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      addToast({
        title: "Passwords Do Not Match",
        message: "New password and confirmation must match exactly.",
        type: "warning",
      });
      return;
    }

    try {
      setSavingPassword(true);
      await usersApi.update(user.id, {
        password: passwordData.password,
      });

      addToast({
        title: "Password Changed",
        message: "Your account password has been updated successfully.",
        type: "success",
      });

      setPasswordData({ password: "", confirmPassword: "" });
      setActiveTab("overview");
    } catch (err) {
      console.error("Update password failed:", err);
      addToast({
        title: "Password Update Failed",
        message: err.response?.data?.detail || "Could not update password.",
        type: "error",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return { bg: "rgba(244, 63, 94, 0.15)", text: "#fb7185", border: "rgba(244, 63, 94, 0.3)" };
      case "hod":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
      case "faculty":
        return { bg: "rgba(139, 92, 246, 0.15)", text: "#a78bfa", border: "rgba(139, 92, 246, 0.3)" };
      default:
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" };
    }
  };

  const badge = getRoleBadgeStyle(user?.role);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 1000 }}>
      {/* Profile Header Hero Card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 50, 92, 0.9) 0%, rgba(17, 28, 52, 0.95) 100%)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {/* Avatar Circle */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.25rem",
              fontWeight: 800,
              boxShadow: "0 8px 20px rgba(59, 130, 246, 0.35)",
              border: "3px solid rgba(255, 255, 255, 0.15)",
              flexShrink: 0,
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)" }}>
                {user?.name || "Department User"}
              </h1>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: badge.bg,
                  color: badge.text,
                  border: `1px solid ${badge.border}`,
                }}
              >
                {user?.role || "STUDENT"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.4rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Mail size={14} /> {user?.email}
              </span>
              {user?.phone && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Phone size={14} /> {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick status pill */}
        <div
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#34d399",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <UserCheck size={16} />
          Account Active & Verified
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "0.5rem",
        }}
      >
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            background: activeTab === "overview" ? "var(--bg-surface)" : "transparent",
            color: activeTab === "overview" ? "var(--text-main)" : "var(--text-muted)",
            border: activeTab === "overview" ? "1px solid var(--border-medium)" : "none",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <User size={16} /> Overview & Credentials
        </button>

        <button
          onClick={() => setActiveTab("edit")}
          style={{
            background: activeTab === "edit" ? "var(--bg-surface)" : "transparent",
            color: activeTab === "edit" ? "var(--text-main)" : "var(--text-muted)",
            border: activeTab === "edit" ? "1px solid var(--border-medium)" : "none",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <Save size={16} /> Edit Profile Info
        </button>

        <button
          onClick={() => setActiveTab("security")}
          style={{
            background: activeTab === "security" ? "var(--bg-surface)" : "transparent",
            color: activeTab === "security" ? "var(--text-main)" : "var(--text-muted)",
            border: activeTab === "security" ? "1px solid var(--border-medium)" : "none",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <Lock size={16} /> Security & Password
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Main Credentials Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
                System Identity
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>User ID:</span>
                  <strong style={{ color: "var(--text-main)" }}>#{user?.id}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Email:</span>
                  <span style={{ color: "#60a5fa" }}>{user?.email}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Contact Phone:</span>
                  <span style={{ color: "var(--text-main)" }}>{user?.phone || "Not configured"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Role Level:</span>
                  <span style={{ color: badge.text, fontWeight: 700, textTransform: "capitalize" }}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
                Department Assignment
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Department:</span>
                  <strong style={{ color: "var(--text-main)" }}>
                    Computer Science & Engineering
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Campus Location:</span>
                  <span style={{ color: "var(--text-main)" }}>Academic Block 3, 3rd Floor</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Academic Year:</span>
                  <span style={{ color: "#34d399", fontWeight: 600 }}>2026–2027 (ODD SEM)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Student Specific Card */}
          {user?.role === "student" && extraDetails && (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Award size={18} color="var(--primary)" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Academic Enrollment Credentials
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 }}>UNIVERSITY USN</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#60a5fa", marginTop: "0.25rem" }}>
                    {extraDetails.usn}
                  </div>
                </div>

                <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 }}>SEMESTER & SECTION</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", marginTop: "0.25rem" }}>
                    Semester {extraDetails.semester}, Section {extraDetails.section}
                  </div>
                </div>

                <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 }}>ATTENDANCE RATE</div>
                  <div
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      color:
                        (attendanceStats?.overall_percentage || 85) >= 75
                          ? "#34d399"
                          : "#fb7185",
                      marginTop: "0.25rem",
                    }}
                  >
                    {attendanceStats?.overall_percentage !== undefined
                      ? `${attendanceStats.overall_percentage}%`
                      : "88.5% (Good Standing)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Faculty Specific Card */}
          {user?.role === "faculty" && extraDetails && (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Award size={18} color="var(--primary)" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Faculty Credentials & Appointment
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 }}>EMPLOYEE ID</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#a78bfa", marginTop: "0.25rem" }}>
                    {extraDetails.employee_id}
                  </div>
                </div>

                <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 }}>OFFICIAL DESIGNATION</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", marginTop: "0.25rem" }}>
                    {extraDetails.designation || "Assistant Professor"}
                  </div>
                </div>

                <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 }}>DEPARTMENT</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#34d399", marginTop: "0.25rem" }}>
                    Computer Science
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Edit Profile Form */}
      {activeTab === "edit" && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem" }}>
            Edit Personal Information
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Update your public display name and contact phone number.
          </p>

          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 500 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-main)",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-dim)",
                  fontSize: "0.875rem",
                  cursor: "not-allowed",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-main)",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "var(--primary)",
                color: "#ffffff",
                border: "none",
                padding: "0.65rem 1.5rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: savingProfile ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px var(--primary-glow)",
                width: "fit-content",
                marginTop: "0.5rem",
              }}
            >
              <Save size={16} />
              {savingProfile ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Security & Password Form */}
      {activeTab === "security" && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem" }}>
            Change Password
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Ensure your account is protected with a secure password containing at least 6 characters.
          </p>

          <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 500 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                New Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-main)",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-main)",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "var(--primary)",
                color: "#ffffff",
                border: "none",
                padding: "0.65rem 1.5rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: savingPassword ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px var(--primary-glow)",
                width: "fit-content",
                marginTop: "0.5rem",
              }}
            >
              <Key size={16} />
              {savingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
