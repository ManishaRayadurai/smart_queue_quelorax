import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard.jsx";
import { Users, Building2, Ticket, TrendingUp, Gauge, Megaphone, SlidersHorizontal, LogIn } from "lucide-react";
import { computeAnalytics } from "../../utils/analytics.js";
import { departmentsApi } from "../../api/departments.js";
import { usersApi } from "../../api/users.js";
import { tokensApi } from "../../api/tokens.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const [range, setRange] = useState("day");
  const [depts, setDepts] = useState([]);
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loginStats, setLoginStats] = useState({ totalUsers: 0, usersLoggedInCount: 0, onlineNowCount: 0, totalLogins: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [d, u, t, ls] = await Promise.all([
          departmentsApi.getAll(),
          usersApi.getAll(),
          tokensApi.getAll(),
          usersApi.loginStats(),
        ]);
        if (cancelled) return;
        setDepts(d); setUsers(u); setTokens(t); setLoginStats(ls); setErr("");
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

  if (loading) return <div className="text-sm text-slate-500">Loading dashboard…</div>;

  const a = computeAnalytics(tokens, depts, range);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin overview</h1>
          <p className="text-sm text-slate-500">Manage your organization at a glance.</p>
        </div>
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

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/queues" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
          <Gauge size={15} /> Queue monitor
        </Link>
        <Link to="/admin/broadcast" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
          <Megaphone size={15} /> Send announcement
        </Link>
        <Link to="/admin/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
          <SlidersHorizontal size={15} /> System settings
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Users" value={users.length} tone="sky" />
        <StatCard icon={Building2} label="Departments" value={depts.length} tone="emerald" />
        <StatCard icon={Ticket} label={`Tokens (${range})`} value={a.total} tone="amber" />
        <StatCard icon={TrendingUp} label="Completion rate" value={`${a.completionRate}%`} tone="violet" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={LogIn}
          label="Users logged in"
          value={loginStats.usersLoggedInCount}
          hint={`out of ${loginStats.totalUsers} total users`}
          tone="sky"
        />
        <StatCard
          icon={Users}
          label="Active now"
          value={loginStats.onlineNowCount}
          hint="logged in within 15 min"
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Total logins"
          value={loginStats.totalLogins}
          hint="all-time login count"
          tone="amber"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="font-semibold mb-2">Visitors — {range === "day" ? "Today (Hourly)" : range === "week" ? "Last 7 Days" : range === "month" ? "Last 30 Days" : "All Time"}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={a.daily}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="font-semibold mb-2">Department comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={a.departments}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="total" fill="#0ea5e9" radius={[4,4,0,0]} />
              <Bar dataKey="completed" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
