import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { computeAnalytics } from "../../utils/analytics.js";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import StatCard from "../../components/StatCard.jsx";
import { Clock, CheckCircle2, Users, Timer } from "lucide-react";

export default function StaffAnalytics() {
  const { user } = useAuth();
  const [dept, setDept] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user.departmentId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
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
    })();
    return () => { cancelled = true; };
  }, [user.departmentId]);

  if (loading) return <div className="text-sm text-slate-500">Loading analytics…</div>;

  const a = computeAnalytics(tokens, dept ? [dept] : [], "week", user.departmentId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{dept?.name} — Analytics</h1>
      {err && <p className="text-sm text-rose-500">{err}</p>}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Total tokens" value={a.total} tone="sky" />
        <StatCard icon={CheckCircle2} label="Completed" value={a.completed} tone="emerald" />
        <StatCard icon={Clock} label="Avg wait" value={`${a.avgWait} m`} tone="amber" />
        <StatCard icon={Timer} label="Avg service" value={`${a.avgService} m`} tone="violet" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Visitors per day (last 7)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={a.daily}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Bookings by hour">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={a.byHour}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="hour" hide /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
