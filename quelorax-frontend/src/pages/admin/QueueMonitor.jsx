import { useCallback, useEffect, useState } from "react";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import { forecastForDepartments, predictWaitTime } from "../../utils/aiPredictions.js";
import { ListOrdered, Users, AlertCircle, PauseCircle, PlayCircle, Gauge } from "lucide-react";

const PRIORITY_TONE = {
  emergency: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  senior: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  vip: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  normal: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};
const DENSITY_TONE = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function QueueMonitor() {
  const [departments, setDepartments] = useState([]);
  const [allTokens, setAllTokens] = useState([]);
  const [waitingByDept, setWaitingByDept] = useState({}); // deptId -> waiting tokens[]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [depts, tokens] = await Promise.all([departmentsApi.getAll(), tokensApi.getAll()]);
      setDepartments(depts);
      setAllTokens(tokens);
      const pairs = await Promise.all(
        depts.map((d) => tokensApi.getWaiting(d.id).then((w) => [d.id, w]).catch(() => [d.id, []]))
      );
      setWaitingByDept(Object.fromEntries(pairs));
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const toggleActive = async (d) => {
    await departmentsApi.update(d.id, { active: !d.active });
    refresh();
  };

  const forecast = forecastForDepartments(departments, allTokens);
  const allWaiting = departments.flatMap((d) =>
    (waitingByDept[d.id] || []).map((t, i) => ({ ...t, deptName: d.name, deptAvg: d.avgServiceTime, position: i + 1 }))
  );

  if (loading) return <div className="text-sm text-slate-500">Loading queue monitor…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Queue monitor</h1>
        <p className="text-sm text-slate-500">Live view of every department's queue, with AI-based wait and crowd forecasts.</p>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {forecast.map((f) => {
          const d = departments.find((dep) => dep.id === f.departmentId);
          const serving = allTokens.find((t) => t.departmentId === d.id && t.status === "serving");
          return (
            <div key={d.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{d.name}</p>
                <button
                  onClick={() => toggleActive(d)}
                  title={d.active ? "Pause bookings" : "Resume bookings"}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {d.active ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                </button>
              </div>
              <p className="text-xs mt-0.5 text-slate-500">{d.active ? "Open for booking" : "Paused — not accepting new tokens"}</p>

              <div className="mt-4 flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${DENSITY_TONE[f.level]}`}>
                  {f.level} crowd
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1"><Users size={12} /> {f.waiting} waiting</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5">
                  <p className="text-xs text-slate-500">Now serving</p>
                  <p className="font-bold">{serving?.code || "—"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5">
                  <p className="text-xs text-slate-500">Tokens today</p>
                  <p className="font-bold">{f.tokensToday}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Gauge size={12} /> AI suggests <span className="font-semibold text-slate-700 dark:text-slate-300">{f.recommendedCounters} counter{f.recommendedCounters > 1 ? "s" : ""}</span> for current load
              </div>
            </div>
          );
        })}
        {!departments.length && (
          <p className="text-sm text-slate-500">No departments yet — create one to start monitoring queues.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><ListOrdered size={16} /> Waiting visitors — all departments</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {allWaiting.map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 grid place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold">{t.position}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{t.code}</p>
                    <span className="text-xs text-slate-500">{t.deptName}</span>
                    {t.priority !== "normal" && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${PRIORITY_TONE[t.priority]}`}>
                        <AlertCircle size={10} /> {t.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{t.visitorName}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">~{predictWaitTime(t.deptAvg, t.position)} min wait</span>
            </div>
          ))}
          {!allWaiting.length && (
            <p className="py-4 text-sm text-slate-500">No one is currently waiting anywhere.</p>
          )}
        </div>
      </div>
    </div>
  );
}
