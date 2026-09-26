import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarCheck,
  Calendar,
  MapPin,
  Bell,
  FileBarChart,
  User,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const currentRole = role?.toLowerCase() || "student";

  // Build menu items strictly based on role permissions
  const getNavItems = () => {
    if (currentRole === "admin") {
      return [
        { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={19} /> },
        { to: "/admin/students", label: "Students", icon: <Users size={19} /> },
        { to: "/admin/teachers", label: "Teachers", icon: <GraduationCap size={19} /> },
        { to: "/departments", label: "Departments", icon: <Building2 size={19} /> },
        { to: "/subjects", label: "Subjects", icon: <BookOpen size={19} /> },
        { to: "/timetable", label: "Timetable", icon: <Calendar size={19} /> },
        { to: "/attendance", label: "Attendance", icon: <CalendarCheck size={19} /> },
        { to: "/reports", label: "Reports", icon: <FileBarChart size={19} /> },
        { to: "/settings", label: "Settings", icon: <Settings size={19} /> },
      ];
    }

    if (currentRole === "hod") {
      return [
        { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={19} /> },
        { to: "/hod/students", label: "Students", icon: <Users size={19} /> },
        { to: "/hod/teachers", label: "Teachers", icon: <GraduationCap size={19} /> },
        { to: "/timetable", label: "Timetable", icon: <Calendar size={19} /> },
        { to: "/attendance", label: "Attendance", icon: <CalendarCheck size={19} /> },
        { to: "/reports", label: "Reports", icon: <FileBarChart size={19} /> },
      ];
    }

    if (["teacher", "faculty"].includes(currentRole)) {
      return [
        { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={19} /> },
        { to: "/teacher/timetable", label: "My Timetable", icon: <Calendar size={19} /> },
        { to: "/attendance", label: "Attendance", icon: <CalendarCheck size={19} /> },
        { to: "/profile", label: "My Profile", icon: <User size={19} /> },
      ];
    }

    // Default: Student
    return [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={19} /> },
      { to: "/timetable", label: "My Timetable", icon: <Calendar size={19} /> },
      { to: "/attendance", label: "My Attendance", icon: <CalendarCheck size={19} /> },
      { to: "/profile", label: "My Profile", icon: <User size={19} /> },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 40,
          }}
          className="mobile-backdrop"
        />
      )}

      <aside
        style={{
          width: "var(--sidebar-width, 260px)",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          background: "var(--bg-secondary, #111827)",
          borderRight: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isOpen ? "translateX(0)" : undefined,
        }}
        className={`sidebar-container ${isOpen ? "open" : ""}`}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Smart Dept
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Academic Portal
            </div>
          </div>
        </div>

        {/* User Card in Sidebar */}
        <div
          style={{
            padding: "0.85rem 1.25rem",
            margin: "0.75rem 0.75rem 0",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "#fff",
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#f8fafc",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name || "Logged In"}
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#818cf8",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {currentRole}
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                padding: "0.65rem 0.9rem",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#ffffff" : "var(--text-secondary, #94a3b8)",
                background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                border: isActive ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div
          style={{
            padding: "0.85rem",
            borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.65rem 0.9rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
