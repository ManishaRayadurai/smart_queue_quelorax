import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { departmentsApi } from "../../api/departments.js";
import { notificationsApi } from "../../api/notifications.js";
import { Megaphone, Send, Building2, Users, Globe2 } from "lucide-react";

const TARGETS = [
  { id: "org", label: "Everyone", icon: Globe2, desc: "All visitors, staff, receptionists" },
  { id: "role", label: "By role", icon: Users, desc: "All users with a specific role" },
  { id: "department", label: "By department", icon: Building2, desc: "Visitors currently queued in a department" },
];

export default function Broadcast() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [target, setTarget] = useState("org");
  const [role, setRole] = useState("visitor");
  const [deptId, setDeptId] = useState("");
  const [form, setForm] = useState({ title: "", body: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const data = await notificationsApi.getForUser(user.id, user.role, user.departmentId);
      setHistory(data.filter((n) => n.type === "announcement"));
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const depts = await departmentsApi.getAll();
        setDepartments(depts);
        setDeptId(depts[0]?.id || "");
        await loadHistory();
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSending(true);
    setErr("");
    try {
      const base = { type: "announcement", title: form.title, body: form.body };
      if (target === "org") await notificationsApi.create({ ...base, scope: "org" });
      if (target === "role") await notificationsApi.create({ ...base, scope: "role", role });
      if (target === "department") await notificationsApi.create({ ...base, scope: "department", departmentId: deptId });
      setForm({ title: "", body: "" });
      setSent(true);
      await loadHistory();
      setTimeout(() => setSent(false), 2500);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-slate-500">Broadcast a message to everyone, a role, or a specific department's queue.</p>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <form onSubmit={send} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-500">Audience</label>
          <div className="mt-2 grid sm:grid-cols-3 gap-2">
            {TARGETS.map(({ id, label, icon: Icon, desc }) => (
              <button
                type="button"
                key={id}
                onClick={() => setTarget(id)}
                className={`text-left px-4 py-3 rounded-xl border-2 transition ${
                  target === id ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon size={16} className="text-slate-500" />
                <p className="mt-2 font-semibold text-sm">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {target === "role" && (
          <div>
            <label className="text-xs font-semibold text-slate-500">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <option value="visitor">Visitor</option>
              <option value="staff">Staff</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>
        )}
        {target === "department" && (
          <div>
            <label className="text-xs font-semibold text-slate-500">Department</label>
            <select value={deptId} onChange={(e) => setDeptId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-500">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Counter 3 temporarily closed"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Message</label>
          <textarea
            rows={3}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400 resize-none"
          />
        </div>

        <button disabled={sending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-60">
          <Send size={16} /> {sending ? "Sending…" : "Send announcement"}
        </button>
        {sent && <p className="text-sm text-emerald-600">Announcement sent.</p>}
      </form>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Megaphone size={16} /> Recent announcements</h2>
        <p className="text-xs text-slate-500 -mt-2 mb-3">
          Shows announcements relevant to your account (everyone, your role, or your department) — the backend
          doesn't have a "show every announcement ever sent" endpoint yet, so role/department broadcasts aimed
          at other accounts won't appear here.
        </p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {history.slice(0, 10).map((n) => (
            <div key={n.id} className="py-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{n.title}</p>
                <span className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
              <span className="mt-1 inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
                {n.scope === "org" ? "Everyone" : n.scope === "role" ? `Role: ${n.role}` : `Department`}
              </span>
            </div>
          ))}
          {!history.length && <p className="py-4 text-sm text-slate-500">No announcements sent yet.</p>}
        </div>
      </div>
    </div>
  );
}
