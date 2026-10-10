import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import StatCard from "../../components/StatCard.jsx";
import { computeAnalytics } from "../../utils/analytics.js";
import { ListOrdered, CheckCircle2, Clock, Users } from "lucide-react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [dept, setDept] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user.departmentId) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const [d, t] = await Promise.all([
          departmentsApi.getOne(user.departmentId),
          tokensApi.getByDepartment(user.departmentId),
        ]);
        if (cancelled) return;
        setDept(d); setTokens(t); setErr("");
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user.departmentId]);

  if (loading) return <div className="text-sm text-slate-500">Loading dashboard…</div>;

  const waiting = tokens.filter((t) => t.status === "waiting");
  const serving = tokens.find((t) => t.status === "serving");
  const a = computeAnalytics(tokens, dept ? [dept] : [], "day", user.departmentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{dept?.name || "No department assigned"}</h1>
        <p className="text-sm text-slate-500">Manage your department's queue in real time.</p>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={ListOrdered} label="Waiting" value={waiting.length} tone="sky" />
        <StatCard icon={Users} label="Now serving" value={serving?.code || "—"} tone="emerald" />
        <StatCard icon={CheckCircle2} label="Completed today" value={a.completed} tone="violet" />
        <StatCard icon={Clock} label="Avg wait" value={`${a.avgWait} m`} tone="amber" />
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Queue overview</h2>
          <Link to="/staff/queue" className="text-sm text-sky-600 font-semibold">Manage queue →</Link>
        </div>
        <div className="mt-4 space-y-2">
          {waiting.slice(0, 6).map((t, i) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div>
                <p className="font-semibold">{t.code}</p>
                <p className="text-xs text-slate-500">{t.visitorName}</p>
              </div>
              <span className="text-sm text-slate-500">#{i + 1}</span>
            </div>
          ))}
          {!waiting.length && <p className="text-sm text-slate-500">Queue is empty.</p>}
        </div>
      </div>
    </div>
  );
}
