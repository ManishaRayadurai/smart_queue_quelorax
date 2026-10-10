import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

import VisitorDashboard from "./pages/visitor/VisitorDashboard.jsx";
import BookToken from "./pages/visitor/BookToken.jsx";
import QueueTracking from "./pages/visitor/QueueTracking.jsx";
import Documents from "./pages/visitor/Document.jsx";
import Notifications from "./pages/visitor/Notification.jsx";
import Settings from "./pages/visitor/Settings.jsx";

import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import StaffQueue from "./pages/staff/Queue.jsx";
import StaffAnalytics from "./pages/staff/StaffAnalytics.jsx";

import ReceptionDashboard from "./pages/receptionist/ReceptionDashboard.jsx";
import BookWalkIn from "./pages/receptionist/BookWalkIn.jsx";
import ReceptionQueueTracking from "./pages/receptionist/QueueTracking.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Departments from "./pages/admin/Department.jsx";
import StaffManagement from "./pages/admin/StaffManagement.jsx";
import AdminAnalytics from "./pages/admin/Analytics.jsx";
import Reports from "./pages/admin/Reports.jsx";
import UserInquiries from "./pages/admin/UserInquiries.jsx";
import Broadcast from "./pages/admin/Broadcast.jsx";
import QueueMonitor from "./pages/admin/QueueMonitor.jsx";
import SystemSettings from "./pages/admin/SystemSettings.jsx";

import { useAuth } from "./contexts/AuthContext.jsx";

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const role = (user.role || "").toLowerCase();
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "staff") return <Navigate to="/staff" replace />;
  if (role === "receptionist") return <Navigate to="/reception" replace />;
  return <Navigate to="/visitor" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/app" element={<RoleHome />} />

      <Route
        element={
          <ProtectedRoute roles={["visitor", "admin", "staff", "receptionist"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Visitor */}
        <Route path="/visitor" element={<VisitorDashboard />} />
        <Route path="/visitor/book" element={<BookToken />} />
        <Route path="/visitor/queue" element={<QueueTracking />} />
        <Route path="/visitor/documents" element={<Documents />} />
        <Route path="/visitor/notifications" element={<Notifications />} />
        <Route path="/visitor/settings" element={<Settings />} />

        {/* Staff */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/queue"
          element={
            <ProtectedRoute roles={["staff"]}>
              <StaffQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/analytics"
          element={
            <ProtectedRoute roles={["staff"]}>
              <StaffAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Reception */}
        <Route
          path="/reception"
          element={
            <ProtectedRoute roles={["receptionist"]}>
              <ReceptionDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reception/book"
          element={
            <ProtectedRoute roles={["receptionist"]}>
              <BookWalkIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reception/queue"
          element={
            <ProtectedRoute roles={["receptionist"]}>
              <ReceptionQueueTracking />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute roles={["admin"]}>
              <StaffManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inquiries"
          element={
            <ProtectedRoute roles={["admin"]}>
              <UserInquiries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Broadcast />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queues"
          element={
            <ProtectedRoute roles={["admin"]}>
              <QueueMonitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute roles={["admin"]}>
              <SystemSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}