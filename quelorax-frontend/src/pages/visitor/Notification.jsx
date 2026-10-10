import { useState } from "react";
import { Bell, CheckCheck, Trash2, AlertTriangle, X } from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function Notifications() {
  const { items, markRead, readAll, deleteNotification, clearAll } = useNotifications();
  const { user } = useAuth();
  
  const [modal, setModal] = useState({ open: false, type: null, id: null, title: "", message: "" });

  const askClearAll = () => {
    if (!items.length) return;
    setModal({
      open: true,
      type: "clearAll",
      id: null,
      title: "Clear all notifications?",
      message: "This will remove all current notifications from your list. This action cannot be undone.",
    });
  };

  const askDeleteSingle = (e, id) => {
    e.stopPropagation();
    setModal({
      open: true,
      type: "single",
      id,
      title: "Delete notification?",
      message: "Are you sure you want to delete this notification?",
    });
  };

  const handleConfirm = () => {
    if (modal.type === "single" && modal.id) {
      deleteNotification(modal.id);
    } else if (modal.type === "clearAll") {
      clearAll();
    }
    setModal({ open: false, type: null, id: null, title: "", message: "" });
  };

  const handleClose = () => {
    setModal({ open: false, type: null, id: null, title: "", message: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500">Stay updated on queue positions, token calls, and system alerts.</p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={readAll}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
            <button
              onClick={askClearAll}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
            >
              <Trash2 size={16} /> Clear all
            </button>
          </div>
        )}
      </div>

      {!items.length && (
        <EmptyState
          title="No notifications"
          icon={Bell}
          message="You're all caught up! Queue updates and announcements will appear here."
        />
      )}

      <div className="space-y-3">
        {items.map((n) => {
          const read = (n.readBy || []).includes(user?.id);
          return (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 transition flex items-start justify-between gap-4 ${
                read
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  : "bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60"
              }`}
            >
              <div
                onClick={() => markRead(n.id)}
                className="flex-1 cursor-pointer flex items-start gap-3"
              >
                <span className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shrink-0 shadow-sm mt-0.5">
                  <Bell size={16} />
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{n.title}</p>
                    {!read && (
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" title="Unread" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{n.body}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => askDeleteSingle(e, n.id)}
                  title="Delete notification"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom In-App Modal Dialog */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 relative animate-scale-up">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Confirm your action below
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {modal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md transition"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}