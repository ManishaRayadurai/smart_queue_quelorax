import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  LayoutDashboard, TicketPlus, ListOrdered, FileText, Bell, Settings,
  Building2, Users, BarChart3, FileBarChart, Megaphone, Gauge, SlidersHorizontal, MessageSquare,
} from "lucide-react";

const menus = {
  visitor: [
    { to: "/visitor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/visitor/book", label: "Book Token", icon: TicketPlus },
    { to: "/visitor/queue", label: "Queue Tracking", icon: ListOrdered },
    { to: "/visitor/documents", label: "Documents", icon: FileText },
    { to: "/visitor/notifications", label: "Notifications", icon: Bell },
    { to: "/visitor/settings", label: "Settings", icon: Settings },
  ],
  staff: [
    { to: "/staff", label: "Dashboard", icon: LayoutDashboard },
    { to: "/staff/queue", label: "Current Queue", icon: ListOrdered },
    { to: "/staff/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/visitor/notifications", label: "Notifications", icon: Bell },
    { to: "/visitor/settings", label: "Settings", icon: Settings },
  ],
  receptionist: [
    { to: "/reception", label: "Dashboard", icon: LayoutDashboard },
    { to: "/reception/book", label: "Book Walk-in", icon: TicketPlus },
    { to: "/reception/queue", label: "Queue Tracking", icon: ListOrdered },
    { to: "/visitor/notifications", label: "Notifications", icon: Bell },
    { to: "/visitor/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/departments", label: "Departments", icon: Building2 },
    { to: "/admin/staff", label: "Users & Staff", icon: Users },
    { to: "/admin/queues", label: "Queue Monitor", icon: Gauge },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/reports", label: "Reports", icon: FileBarChart },
    { to: "/admin/inquiries", label: "User Inquiries", icon: MessageSquare },
    { to: "/admin/broadcast", label: "Announcements", icon: Megaphone },
    { to: "/admin/settings", label: "System Settings", icon: SlidersHorizontal },
    { to: "/visitor/notifications", label: "Notifications", icon: Bell },
    { to: "/visitor/settings", label: "My Settings", icon: Settings },
  ],
};

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const roleKey = (user?.role || "visitor").toLowerCase();
  const items = menus[roleKey] || [];
  return (
    <nav className="p-3 space-y-1">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive
                ? "bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`
          }
        >
          <Icon size={16} /> {label}
        </NavLink>
      ))}
    </nav>
  );
}
