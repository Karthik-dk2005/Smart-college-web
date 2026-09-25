import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  GraduationCap,
  Award,
  FileText,
  BookOpen,
  BellRing,
  Bus,
  User,
  LogOut,
  Users,
  Building,
  ClipboardList,
  ShieldCheck,
  FileCheck,
  Clock,
} from "lucide-react";

export default function Sidebar() {
  const { role, activeTab, setActiveTab, logout } = useAuth();

  const getNavItems = () => {
    switch (role) {
      case "student":
        return [
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
          { id: "attendance", label: "My Attendance", icon: <CalendarCheck size={18} /> },
          { id: "timetable", label: "Timetable", icon: <Calendar size={18} /> },
          { id: "exams", label: "Exams", icon: <GraduationCap size={18} /> },
          { id: "marks", label: "My Marks", icon: <Award size={18} /> },
          { id: "assignments", label: "Assignments", icon: <FileText size={18} /> },
          { id: "materials", label: "Study Materials", icon: <BookOpen size={18} /> },
          { id: "notices", label: "Notices", icon: <BellRing size={18} /> },
          { id: "bus", label: "College Bus", icon: <Bus size={18} /> },
          { id: "profile", label: "Profile", icon: <User size={18} /> },
        ];

      case "teacher":
        return [
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
          { id: "attendance", label: "Attendance Sessions", icon: <CalendarCheck size={18} /> },
          { id: "timetable", label: "Timetable", icon: <Calendar size={18} /> },
          { id: "students", label: "Students", icon: <Users size={18} /> },
          { id: "exams", label: "Exams", icon: <GraduationCap size={18} /> },
          { id: "marks", label: "Marks Entry", icon: <Award size={18} /> },
          { id: "assignments", label: "Assignments", icon: <FileText size={18} /> },
          { id: "materials", label: "Materials", icon: <BookOpen size={18} /> },
          { id: "notices", label: "Announcements", icon: <BellRing size={18} /> },
          { id: "profile", label: "Profile", icon: <User size={18} /> },
        ];

      case "hod":
        return [
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
          { id: "students", label: "Students", icon: <Users size={18} /> },
          { id: "teachers", label: "Faculty", icon: <GraduationCap size={18} /> },
          { id: "attendance", label: "Attendance Stats", icon: <CalendarCheck size={18} /> },
          { id: "timetable", label: "Timetable & Shifts", icon: <Calendar size={18} /> },
          { id: "rooms", label: "Rooms & Labs", icon: <Building size={18} /> },
          { id: "exams", label: "Exams", icon: <ClipboardList size={18} /> },
          { id: "marks", label: "Finalize Marks", icon: <FileCheck size={18} /> },
          { id: "notices", label: "Notices", icon: <BellRing size={18} /> },
          { id: "profile", label: "Profile", icon: <User size={18} /> },
        ];

      case "admin":
        return [
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
          { id: "users", label: "User Management", icon: <Users size={18} /> },
          { id: "rooms", label: "Rooms & Labs", icon: <Building size={18} /> },
          { id: "timetable", label: "Timetable", icon: <Calendar size={18} /> },
          { id: "exams", label: "Examinations", icon: <ClipboardList size={18} /> },
          { id: "bus", label: "College Bus Transit", icon: <Bus size={18} /> },
          { id: "audit", label: "Audit Logs", icon: <ShieldCheck size={18} /> },
          { id: "profile", label: "Profile", icon: <User size={18} /> },
        ];

      default:
        return [{ id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> }];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span style={{ fontSize: "1.5rem" }}>🎓</span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="sidebar-brand">SmartDept ERP</div>
          <span className="sidebar-brand-badge">CSE Academic Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => setActiveTab(item.id)}
            style={{ width: "100%", background: activeTab === item.id ? undefined : "transparent", textAlign: "left" }}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-item"
          onClick={logout}
          style={{ width: "100%", background: "transparent", color: "#f87171" }}
        >
          <span className="nav-item-icon">
            <LogOut size={18} />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
