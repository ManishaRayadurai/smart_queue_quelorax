import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles) {
    const userRole = (user.role || "").toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());
    if (!allowed.includes(userRole)) return <Navigate to="/app" replace />;
  }
  return children;
}