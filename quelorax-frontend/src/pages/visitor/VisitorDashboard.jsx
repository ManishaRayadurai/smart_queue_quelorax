import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Ticket, ListOrdered, FileText, Mic, ArrowRight, AlertTriangle } from "lucide-react";
import StatCard from "../../components/StatCard.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { tokensApi } from "../../api/tokens.js";
import { documentsApi } from "../../api/documents.js";
import { departmentsApi } from "../../api/departments.js";
import { getGreeting } from "../../utils/greeting.js";

export default function VisitorDashboard() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [docs, setDocs] = useState([]);
  const [deptsById, setDeptsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [toks, documents, depts] = await Promise.all([
          tokensApi.getByUser(user.id),
          documentsApi.getByUser(user.id),
          departmentsApi.getAll(),
        ]);
        if (cancelled) return;
        setTokens(toks);
        setDocs(documents);
        setDeptsById(Object.fromEntries(depts.map((d) => [d.id, d])));
        setErr("");
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user.id]);

  const active = tokens.find(
    (t) => t.status === "waiting" || t.status === "serving" || t.status === "delayed" || t.status === "missed"
  );
  const missedTokens = tokens.filter((t) => t.status === "missed");

  // Real-time greeting — flips from "Good morning" to "Good afternoon" etc.
  // live, without needing a page refresh.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const greeting = getGreeting(now);

  if (loading) return <div className="text-sm text-slate-500">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-400 text-white p-8 shadow-lg">
        <p className="text-sm opacity-90">{greeting}, {user.name.split(" ")[0]}</p>
        <h1 className="text-3xl font-bold mt-1">Ready to skip the line?</h1>
        <p className="mt-2 opacity-90 max-w-lg">Book a token for any department in seconds and track your position live.</p>
        <Link
          to="/visitor/book"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100"
        >
          Book a token <ArrowRight size={16} />
        </Link>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      {!!missedTokens.length && (
        <Link
          to="/visitor/queue"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition"
        >
          <AlertTriangle size={18} className="text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              Check-in needed for {missedTokens.map((t) => t.code).join(", ")}
            </p>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-0.5">
              Your requested time has passed. Tap here to check in and rejoin the live queue.
            </p>
          </div>
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Ticket} label="Total bookings" value={tokens.length} tone="sky" />
        <StatCard icon={ListOrdered} label="Active" value={active ? 1 : 0} tone="emerald" hint={active ? active.code : "None"} />
        <StatCard icon={FileText} label="Documents" value={docs.length} tone="amber" />
        <StatCard icon={Mic} label="Voice ready" value="Yes" tone="violet" />
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-semibold text-lg">Recent bookings</h2>
        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {tokens.slice(-6).reverse().map((t) => {
            const d = deptsById[t.departmentId];
            return (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t.code && t.number ? `${t.code}-${t.number}` : t.code}</p>
                  <p className="text-xs text-slate-500">{d?.name} · {new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <StatusPill status={t.status} />
              </div>
            );
          })}
          {tokens.length === 0 && <p className="py-6 text-sm text-slate-500">No bookings yet.</p>}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    waiting: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    serving: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    skipped: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    delayed: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    missed: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  const label = status === "delayed" ? "joining later" : status === "missed" ? "check-in needed" : status;
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}>{label}</span>;
}
