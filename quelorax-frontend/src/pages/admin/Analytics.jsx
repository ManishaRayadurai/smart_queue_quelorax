import { useEffect, useState } from "react";
import { computeAnalytics } from "../../utils/analytics.js";
import { forecastForDepartments } from "../../utils/aiPredictions.js";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import StatCard from "../../components/StatCard.jsx";
import { Users, CheckCircle2, Clock, TrendingUp, AlertTriangle, HeartPulse, XCircle, Gauge, Ticket } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const DENSITY_TONE = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function AdminAnalytics() {
  const [range, setRange] = useState("week");
  const [departments, setDepartments] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [depts, toks] = await Promise.all([departmentsApi.getAll(), tokensApi.getAll()]);
        if (!cancelled) { setDepartments(depts); setTokens(toks); setErr(""); }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (loading) return <div className="text-sm text-slate-500">Loading analytics…</div>;

  const a = computeAnalytics(tokens, departments, range);
  const forecast = forecastForDepartments(departments, tokens);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {["day","week","month","all"].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold capitalize ${range === r ? "bg-white dark:bg-slate-900 shadow" : "text-slate-500"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard icon={Ticket} label={`Total tokens (${range})`} value={a.total} tone="sky" />
        <StatCard icon={CheckCircle2} label="Completed" value={a.completed} hint={`${a.completionRate}% completion rate`} tone="emerald" />
        <StatCard icon={Clock} label="Pending" value={a.pending} hint="waiting & delayed" tone="amber" />
        <StatCard icon={XCircle} label="Cancelled" value={a.cancelled} hint={`${a.cancelledRate}% cancelled rate`} tone="rose" />
        <StatCard icon={TrendingUp} label="Active / Booked" value={a.activeBooked} hint="current & scheduled" tone="violet" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Clock} label="Avg wait time" value={`${a.avgWait} m`} tone="amber" />
        <StatCard icon={TrendingUp} label="Peak hour" value={a.peakHour} tone="sky" />
        <StatCard icon={AlertTriangle} label="Emergency handled" value={a.emergencyHandled} hint={`${a.emergencyTotal} total`} tone="rose" />
        <StatCard icon={HeartPulse} label="Senior citizen visits" value={a.seniorHandled} hint={`${a.seniorTotal} total`} tone="amber" />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Gauge size={16} /> Crowd density forecasting (AI)</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {forecast.map((f) => (
            <div key={f.departmentId} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{f.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${DENSITY_TONE[f.level]}`}>{f.level}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{f.waiting} waiting · {f.tokensToday} tokens today</p>
              <p className="text-xs text-slate-500 mt-1">Suggested counters: <span className="font-semibold text-slate-700 dark:text-slate-300">{f.recommendedCounters}</span></p>
            </div>
          ))}
          {!forecast.length && <p className="text-sm text-slate-500">No departments to forecast yet.</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Token status breakdown (${range})`}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={a.statusBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                label
              >
                {a.statusBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title={`Visitor trends (${range === "day" ? "Today" : range === "week" ? "Last 7 Days" : range === "month" ? "Last 30 Days" : "All Time"})`}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={a.daily}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
              <Line type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={3} name="Total Visitors" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Department token comparison">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a.departments}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
              <Bar dataKey="total" fill="#0ea5e9" name="Total" />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="waiting" fill="#f59e0b" name="Pending" />
              <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Department share (total bookings)">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={a.departments} dataKey="total" nameKey="name" outerRadius={90} label>
                {a.departments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
