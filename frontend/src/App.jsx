import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import ProfileView from "./pages/ProfileView";

// Student Views
import StudentDashboardView from "./pages/student/StudentDashboardView";
import StudentAttendanceView from "./pages/student/StudentAttendanceView";
import StudentTimetableView from "./pages/student/StudentTimetableView";
import StudentMarksView from "./pages/student/StudentMarksView";
import StudentExamsView from "./pages/student/StudentExamsView";
import StudentMaterialsView from "./pages/student/StudentMaterialsView";
import StudentBusView from "./pages/student/StudentBusView";
import StudentNoticesView from "./pages/student/StudentNoticesView";

// Teacher Views
import TeacherDashboardView from "./pages/teacher/TeacherDashboardView";
import TeacherAttendanceView from "./pages/teacher/TeacherAttendanceView";
import TeacherMarksView from "./pages/teacher/TeacherMarksView";

// HOD & Admin Views
import HodDashboardView from "./pages/hod/HodDashboardView";
import AdminDashboardView from "./pages/admin/AdminDashboardView";

import { Loader2 } from "lucide-react";

function MainApp() {
  const { isAuthenticated, loading, role, activeTab } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0f1d",
          color: "#fff",
        }}
      >
        <Loader2 size={36} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActiveTab = () => {
    // Universal profile tab
    if (activeTab === "profile") {
      return <ProfileView />;
    }

    // Role-specific routing
    switch (role) {
      case "student":
        switch (activeTab) {
          case "dashboard":
            return <StudentDashboardView />;
          case "attendance":
            return <StudentAttendanceView />;
          case "timetable":
            return <StudentTimetableView />;
          case "exams":
            return <StudentExamsView />;
          case "marks":
            return <StudentMarksView />;
          case "assignments":
          case "materials":
            return <StudentMaterialsView />;
          case "notices":
            return <StudentNoticesView />;
          case "bus":
            return <StudentBusView />;
          default:
            return <StudentDashboardView />;
        }

      case "teacher":
        switch (activeTab) {
          case "dashboard":
          case "classes":
            return <TeacherDashboardView />;
          case "attendance":
            return <TeacherAttendanceView />;
          case "timetable":
            return <StudentTimetableView />;
          case "students":
            return <TeacherDashboardView />;
          case "exams":
            return <StudentExamsView />;
          case "marks":
            return <TeacherMarksView />;
          case "assignments":
          case "materials":
            return <StudentMaterialsView />;
          case "notices":
            return <StudentNoticesView />;
          default:
            return <TeacherDashboardView />;
        }

      case "hod":
        switch (activeTab) {
          case "dashboard":
          case "students":
          case "teachers":
          case "attendance":
          case "marks":
          case "reports":
            return <HodDashboardView />;
          case "timetable":
            return <StudentTimetableView />;
          case "rooms":
            return <AdminDashboardView />;
          case "exams":
            return <StudentExamsView />;
          case "notices":
            return <StudentNoticesView />;
          default:
            return <HodDashboardView />;
        }

      case "admin":
        switch (activeTab) {
          case "dashboard":
          case "users":
          case "rooms":
          case "audit":
            return <AdminDashboardView />;
          case "timetable":
            return <StudentTimetableView />;
          case "exams":
            return <StudentExamsView />;
          case "bus":
            return <StudentBusView />;
          default:
            return <AdminDashboardView />;
        }

      default:
        return <StudentDashboardView />;
    }
  };

  return <DashboardLayout>{renderActiveTab()}</DashboardLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
