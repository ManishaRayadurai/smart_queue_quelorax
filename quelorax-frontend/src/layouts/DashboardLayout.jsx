import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, Moon, Sun, X, AlertTriangle, Home } from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import AnimatedLogo from "../components/AnimatedLogo.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNotifications } from "../contexts/NotificationContext.jsx";
import { getGreeting, formatClock } from "../utils/greeting.js";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { unread } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const firstName = user?.name?.split(" ")[0];
  const greeting = getGreeting(now);

  const handleLogout = () => {
    setConfirmOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 z-30 h-screen w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform flex flex-col ${
            open ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            <Link to="/app" className="flex items-center gap-2">
              <AnimatedLogo size={30} />
              <span className="font-bold">Quelorax</span>
            </Link>
            <button className="lg:hidden p-2" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
          <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white grid place-items-center font-semibold overflow-hidden shrink-0">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user?.name || "?").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Home size={16} />
              Back to Home
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-sm hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 lg:pl-0">
          <header className="h-16 sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2" onClick={() => setOpen(true)}>
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white grid place-items-center font-semibold overflow-hidden shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    (user?.name || "?").slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500">{greeting}{firstName ? `, ${firstName}` : ""}</p>
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    {user?.name}
                    <span className="hidden sm:inline text-xs font-normal text-slate-400">· {formatClock(now)}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggle} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700" aria-label="Toggle theme">
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Link
                to="/visitor/notifications"
                className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <Bell size={16} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </Link>
            </div>
          </header>
          <main className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Logout confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 grid place-items-center">
              <AlertTriangle size={22} />
            </div>
            <h2 className="mt-4 text-lg font-bold">Log out of Quelorax?</h2>
            <p className="mt-1 text-sm text-slate-500">
              You'll need to sign in again to access your dashboard.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
