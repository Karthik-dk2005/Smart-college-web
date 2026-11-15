import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import MainLayout from "./layouts/MainLayout";

// All Application Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserManagement from "./pages/UserManagement";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Departments from "./pages/Departments";
import Subjects from "./pages/Subjects";
import Marks from "./pages/Marks";
import IAMarks from "./pages/IAMarks";
import UploadIAMarks from "./pages/UploadIAMarks";
import MyIAMarks from "./pages/MyIAMarks";
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

// Bus Route Management Pages
import BusDashboard from "./pages/BusDashboard";
import BusRoutes from "./pages/BusRoutes";
import AddBusRoute from "./pages/AddBusRoute";
import EditBusRoute from "./pages/EditBusRoute";
import BusRouteDetails from "./pages/BusRouteDetails";
import BusStops from "./pages/BusStops";
import StudentBus from "./pages/StudentBus";

// Events & Announcements Module Pages
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import AddEvent from "./pages/AddEvent";
import EditEvent from "./pages/EditEvent";
import EventParticipants from "./pages/EventParticipants";
import EventCalendarPage from "./pages/EventCalendar";
import Announcements from "./pages/Announcements";
import AddAnnouncement from "./pages/AddAnnouncement";
import EditAnnouncement from "./pages/EditAnnouncement";
import MyEvents from "./pages/MyEvents";

// Student Activities & Achievements Module Pages
import StudentActivities from "./pages/StudentActivities";
import AddStudentActivity from "./pages/AddStudentActivity";
import EditStudentActivity from "./pages/EditStudentActivity";
import StudentActivityDetails from "./pages/StudentActivityDetails";
import AdminStudentActivities from "./pages/AdminStudentActivities";
import HODStudentActivities from "./pages/HODStudentActivities";
import StudentPortfolio from "./pages/StudentPortfolio";
import AchievementReport from "./pages/AchievementReport";
import StudentRegister from "./pages/StudentRegister";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import AdminStudentRegistration from "./pages/AdminStudentRegistration";
import TeacherRegister from "./pages/TeacherRegister";
import HODRegister from "./pages/HODRegister";
import AdminRegistrationRequests from "./pages/AdminRegistrationRequests";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/student" element={<StudentRegister />} />
            <Route path="/register-student" element={<StudentRegister />} />
            <Route path="/register/teacher" element={<TeacherRegister />} />
            <Route path="/register/hod" element={<HODRegister />} />
            <Route path="/student-register" element={<StudentRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

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

              {/* 1. Dashboard (All roles & Role-specific paths) */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="student-dashboard" element={<StudentDashboard />} />
              <Route path="admin/dashboard" element={<Dashboard />} />
              <Route path="hod/dashboard" element={<Dashboard />} />
              <Route path="teacher/dashboard" element={<Dashboard />} />
              <Route path="student/dashboard" element={<StudentDashboard />} />

              {/* 1.0 Admin Registration Approval Dashboard */}
              <Route
                path="admin/registration-requests"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <AdminRegistrationRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hod/registration-requests"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <AdminRegistrationRequests />
                  </ProtectedRoute>
                }
              />

              {/* 1.1 Student Registration Management (Admin & HOD) */}
              <Route
                path="admin/student-registration"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <AdminStudentRegistration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hod/student-registration"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <AdminStudentRegistration />
                  </ProtectedRoute>
                }
              />

              {/* 1.2 User Accounts & Approval Management (Admin & HOD) */}
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />

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

              {/* 5.1 Internal Assessment Marks & Gradebook (All roles) */}
              <Route path="marks" element={<Marks />} />
              <Route path="my-marks" element={<Marks />} />
              <Route path="student/marks" element={<Marks />} />
              <Route path="admin/marks" element={<Marks />} />
              <Route path="hod/marks" element={<Marks />} />
              <Route path="teacher/marks" element={<Marks />} />
              <Route path="ia-marks" element={<IAMarks />} />
              <Route path="admin/ia-marks" element={<IAMarks />} />
              <Route path="hod/ia-marks" element={<IAMarks />} />
              <Route path="teacher/ia-marks" element={<IAMarks />} />
              <Route path="upload-ia-marks" element={<UploadIAMarks />} />
              <Route path="marks/upload" element={<UploadIAMarks />} />
              <Route path="admin/marks/upload" element={<UploadIAMarks />} />
              <Route path="hod/marks/upload" element={<UploadIAMarks />} />
              <Route path="my-ia-marks" element={<MyIAMarks />} />
              <Route path="student/my-ia-marks" element={<MyIAMarks />} />

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

              {/* 13. Bus Route Management System */}
              <Route path="admin/buses" element={<BusDashboard />} />
              <Route path="buses" element={<BusDashboard />} />
              <Route path="buses/routes" element={<BusRoutes />} />

              {/* Add Bus Route (Admin only) */}
              <Route
                path="admin/buses/add"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AddBusRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="buses/add"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AddBusRoute />
                  </ProtectedRoute>
                }
              />

              {/* Edit Bus Route (Admin only) */}
              <Route
                path="admin/buses/:routeId/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <EditBusRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="buses/:routeId/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <EditBusRoute />
                  </ProtectedRoute>
                }
              />

              {/* Bus Route Details */}
              <Route path="admin/buses/:routeId" element={<BusRouteDetails />} />
              <Route path="buses/:routeId" element={<BusRouteDetails />} />

              {/* Bus Stops Management */}
              <Route path="admin/buses/stops" element={<BusStops />} />
              <Route path="buses/stops" element={<BusStops />} />

              {/* Student Bus Assignment View */}
              <Route
                path="student/bus"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentBus />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-bus"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentBus />
                  </ProtectedRoute>
                }
              />

              {/* ---------------------------------------------------- */}
              {/* Events & Announcements Module Routes                  */}
              {/* ---------------------------------------------------- */}
              {/* Events Browsing (All roles) */}
              <Route path="events" element={<Events />} />
              <Route path="events/:eventId" element={<EventDetails />} />
              <Route path="events/calendar" element={<EventCalendarPage />} />
              <Route path="calendar" element={<EventCalendarPage />} />
              <Route path="my-events" element={<MyEvents />} />

              {/* Admin & HOD Event Management Routes */}
              <Route
                path="admin/events"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <Events />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/events/add"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <AddEvent />
                  </ProtectedRoute>
                }
              />
              <Route path="admin/events/:eventId" element={<EventDetails />} />
              <Route
                path="admin/events/:eventId/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <EditEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/events/:eventId/participants"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <EventParticipants />
                  </ProtectedRoute>
                }
              />

              {/* Announcements Routes */}
              <Route path="announcements" element={<Announcements />} />
              <Route
                path="admin/announcements/add"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <AddAnnouncement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/announcements/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <EditAnnouncement />
                  </ProtectedRoute>
                }
              />

              {/* ---------------------------------------------------- */}
              {/* Student Activities & Achievements Module Routes      */}
              {/* ---------------------------------------------------- */}
              {/* Student Routes */}
              <Route path="student/activities" element={<StudentActivities />} />
              <Route path="student/activities/add" element={<AddStudentActivity />} />
              <Route path="student/activities/:activityId" element={<StudentActivityDetails />} />
              <Route path="student/activities/:activityId/edit" element={<EditStudentActivity />} />
              <Route path="student/portfolio" element={<StudentPortfolio />} />

              {/* Admin & HOD Verification Management */}
              <Route
                path="admin/student-activities"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminStudentActivities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hod/student-activities"
                element={
                  <ProtectedRoute allowedRoles={["hod"]}>
                    <HODStudentActivities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/reports/student-achievements"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hod"]}>
                    <AchievementReport />
                  </ProtectedRoute>
                }
              />

              {/* Convenience direct aliases */}
              <Route path="activities" element={<StudentActivities />} />
              <Route path="my-activities" element={<StudentActivities />} />
              <Route path="portfolio" element={<StudentPortfolio />} />
            </Route>

            {/* Catch-all Wildcard Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
