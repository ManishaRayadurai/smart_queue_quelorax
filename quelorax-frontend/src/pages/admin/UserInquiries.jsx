import { useEffect, useState } from "react";
import { MessageSquare, Mail, Trash2, Search, CheckCircle2 } from "lucide-react";
import { notificationsApi } from "../../api/notifications.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function UserInquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadInquiries = async () => {
    try {
      const data = await notificationsApi.getForUser(user.id, user.role, user.departmentId).catch(() => []);
      const localInquiries = JSON.parse(localStorage.getItem("qx_public_inquiries") || "[]");

      const combined = [...localInquiries, ...data];
      const unique = [];
      const seen = new Set();
      for (const item of combined) {
        if (!item) continue;
        const key = `${item.title}_${item.body}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      }

      setInquiries(unique);
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
    const id = setInterval(loadInquiries, 4000);
    return () => clearInterval(id);
  }, []);

  const handleDelete = async (id) => {
    setInquiries((prev) => {
      const next = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem("qx_public_inquiries", JSON.stringify(next.filter((i) => String(i.id).startsWith("inq_"))));
      } catch {}
      return next;
    });
    if (typeof id === "number" || (!String(id).startsWith("inq_") && !isNaN(Number(id)))) {
      await notificationsApi.delete(id).catch(() => {});
    }
  };

  const filtered = inquiries.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-sky-500" size={24} /> User Inquiries & Reviews
          </h1>
          <p className="text-sm text-slate-500">
            Messages and feedback submitted by visitors from the Landing Page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold text-xs border border-sky-200 dark:border-sky-800/60">
            {inquiries.length} total inquiries
          </span>
        </div>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <div className="flex items-center gap-2 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search inquiries by visitor name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm outline-none text-slate-800 dark:text-slate-200"
        />
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading inquiries…</div>
      ) : !filtered.length ? (
        <EmptyState
          icon={MessageSquare}
          title="No inquiries found"
          message={search ? "No messages match your search filter." : "When visitors send contact messages, they will appear here for the admin."}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            // Parse visitor name, email, message body
            const bodyStr = item.body || "";
            const emailMatch = bodyStr.match(/Email:\s*([^\s·]+)/);
            const msgMatch = bodyStr.match(/Message:\s*(.*)/);
            const visitorEmail = emailMatch ? emailMatch[1] : "";
            const messageBody = msgMatch ? msgMatch[1] : bodyStr;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 hover:border-sky-300 dark:hover:border-sky-700 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shrink-0 shadow-sm mt-0.5">
                      <MessageSquare size={18} />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                        {item.title}
                      </h3>
                      {visitorEmail && (
                        <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mt-0.5">
                          {visitorEmail}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {visitorEmail && (
                      <a
                        href={`mailto:${visitorEmail}?subject=Re: Your Quelorax Inquiry`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 text-xs font-semibold text-sky-600 dark:text-sky-300 hover:bg-sky-100 transition"
                      >
                        <Mail size={14} /> Reply
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition"
                      title="Delete inquiry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {messageBody}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
