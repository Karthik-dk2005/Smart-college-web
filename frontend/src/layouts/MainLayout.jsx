import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-primary, #0a0f1d)" }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: "var(--sidebar-width, 260px)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.3s ease",
        }}
        className="main-layout-content"
      >
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ flex: 1, padding: "1.5rem" }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .main-layout-content {
            margin-left: 0 !important;
          }
          .sidebar-container {
            transform: translateX(-100%);
          }
          .sidebar-container.open {
            transform: translateX(0);
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .time-badge {
            display: none !important;
          }
          .user-name-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
