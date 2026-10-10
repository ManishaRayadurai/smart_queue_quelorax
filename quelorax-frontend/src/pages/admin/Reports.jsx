import { useEffect, useMemo, useState } from "react";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import { exportCSV, exportPDF } from "../../utils/Export.js";
import { Download } from "lucide-react";

export default function Reports() {
  const [range, setRange] = useState("daily");
  const [tokens, setTokens] = useState([]);
  const [deptsById, setDeptsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const now = Date.now();

  useEffect(() => {
    (async () => {
      try {
        const [depts, toks] = await Promise.all([departmentsApi.getAll(), tokensApi.getAll()]);
        setDeptsById(Object.fromEntries(depts.map((d) => [d.id, d])));
        setTokens(toks);
        setErr("");
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = useMemo(() => {
    const cutoff = { daily: 1, weekly: 7, monthly: 30 }[range] * 24 * 60 * 60 * 1000;
    return tokens
      .filter((t) => {
        if (!t) return false;
        let ts = t.createdAt;
        if (!ts && t.bookingDate) {
          ts = new Date(t.bookingDate).getTime();
        }
        if (typeof ts === "string") {
          ts = Number(ts) || new Date(ts).getTime();
        }
        return ts && ts >= now - cutoff;
      })
      .map((t) => ({
        token: t.code && t.number ? `${t.code}-${t.number}` : t.code || "—",
        visitor: t.visitorName || `User #${t.userId || "—"}`,
        department: deptsById[t.departmentId]?.name || "—",
        status: t.status,
        walkIn: t.walkIn ? "Yes" : "No",
        booked: t.createdAt ? new Date(t.createdAt).toLocaleString() : (t.bookingDate || "—"),
        completed: t.completedAt ? new Date(t.completedAt).toLocaleString() : "—",
      }));
  }, [range, tokens, deptsById, now]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {["daily","weekly","monthly"].map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold capitalize ${range === r ? "bg-white dark:bg-slate-900 shadow" : "text-slate-500"}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={() => exportCSV(`quelorax_${range}.csv`, rows)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold text-sm">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => exportPDF(`Quelorax ${range} report`, rows)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 text-white font-semibold text-sm">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-left">
            <tr>
              {["Token","Visitor","Department","Status","Walk-in","Booked","Completed"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : rows.length ? (
              rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-semibold">{r.token}</td>
                  <td className="px-4 py-3">{r.visitor}</td>
                  <td className="px-4 py-3">{r.department}</td>
                  <td className="px-4 py-3 capitalize">{r.status}</td>
                  <td className="px-4 py-3">{r.walkIn}</td>
                  <td className="px-4 py-3">{r.booked}</td>
                  <td className="px-4 py-3">{r.completed}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No data for this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
