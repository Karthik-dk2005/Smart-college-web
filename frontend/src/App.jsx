import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

// All Application Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Departments from "./pages/Departments";
import Subjects from "./pages/Subjects";
import Rooms from "./pages/Rooms";
import Attendance from "./pages/Attendance";
import StudentAttendance from "./pages/StudentAttendance";
import Timetable from "./pages/Timetable";
import LiveLocation from "./pages/LiveLocation";
import Notices from "./pages/Notices";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import FaceRegistration from "./pages/FaceRegistration";
import BiometricRegistration from "./pages/BiometricRegistration";
import FaceAttendance from "./pages/FaceAttendance";
import BiometricAttendance from "./pages/BiometricAttendance";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated Dashboard Shell Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Default Index Route */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* 1. Dashboard (All roles) */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* 2. Student Management Routes (Admin & HOD only) */}
              <Route
                path="admin/students"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Students />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/students/add"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Students />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hod/students"
                element={
                  <ProtectedRoute allowedRoles={["hod"]}>
                    <Students />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hod/students/add"
                element={
                  <ProtectedRoute allowedRoles={["hod"]}>
                    <Students />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <Students />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students/add"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <Students />
                  </ProtectedRoute>
                }
              />

              {/* 3. Teacher Management Routes (Admin & HOD only) */}
              <Route
                path="admin/teachers"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/teachers/add"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hod/teachers"
                element={
                  <ProtectedRoute allowedRoles={["hod"]}>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hod/teachers/add"
                element={
                  <ProtectedRoute allowedRoles={["hod"]}>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teachers"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teachers/add"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="faculty"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <Teachers />
                  </ProtectedRoute>
                }
              />

              {/* 4. Departments Management (Admin, HOD) */}
              <Route
                path="departments"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <Departments />
                  </ProtectedRoute>
                }
              />

              {/* 5. Subjects Management (Admin, HOD, Teacher) */}
              <Route
                path="subjects"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod", "teacher", "faculty"]}>
                    <Subjects />
                  </ProtectedRoute>
                }
              />

              {/* 5.1 Rooms Management (Admin, HOD) */}
              <Route
                path="rooms"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <Rooms />
                  </ProtectedRoute>
                }
              />

              {/* 6. Attendance & Biometric/Face Recognition Routes */}
              <Route path="attendance" element={<Attendance />} />
              <Route path="attendance/session/:timetableId" element={<Attendance />} />
              <Route path="my-attendance" element={<StudentAttendance />} />
              <Route path="student/attendance" element={<StudentAttendance />} />
              <Route path="face/attendance" element={<FaceAttendance />} />
              <Route path="biometric/attendance" element={<BiometricAttendance />} />
              <Route path="face/register" element={<FaceRegistration />} />
              <Route path="face/register/:studentId" element={<FaceRegistration />} />
              <Route path="biometric/register" element={<BiometricRegistration />} />
              <Route path="biometric/register/:studentId" element={<BiometricRegistration />} />

              {/* 7. Timetable Routes */}
              <Route path="timetable" element={<Timetable />} />
              <Route path="teacher/timetable" element={<Timetable />} />

              {/* 8. Live Location Tracking & Geofence Radar */}
              <Route path="location" element={<LiveLocation />} />

              {/* 9. Notices & Circulars */}
              <Route path="notices" element={<Notices />} />

              {/* 10. Reports & Attendance Shortage (<75%) */}
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod", "teacher", "faculty"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* 11. Profile Credentials & Edit */}
              <Route path="profile" element={<Profile />} />

              {/* 12. Settings & Geofence Health Probe */}
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all Wildcard Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
