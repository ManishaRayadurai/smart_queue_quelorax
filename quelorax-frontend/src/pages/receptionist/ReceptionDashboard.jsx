import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import StatCard from "../../components/StatCard.jsx";
import { TicketPlus, ListOrdered, Users, Hourglass, UserX, XCircle, AlertTriangle, QrCode } from "lucide-react";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import { isSameDay } from "../../utils/dates.js";
import QrScannerModal from "../../components/QrScannerModal.jsx";

export default function ReceptionDashboard() {
  const [tokens, setTokens] = useState([]);
  const [deptsById, setDeptsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await load();
    };
    run();
    const id = setInterval(run, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [load]);

  const [cancelTargetToken, setCancelTargetToken] = useState(null);

  const handleConfirmCancel = async () => {
    if (!cancelTargetToken) return;
    const t = cancelTargetToken;
    setCancelTargetToken(null);
    try {
      await tokensApi.cancel(t.id);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  if (loading) return <div className="text-sm text-slate-500">Loading dashboard…</div>;

  const today = tokens.filter((t) => isSameDay(t.createdAt, Date.now()));
  const walkIns = today.filter((t) => t.walkIn);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold">Reception desk</h1>
        <p className="mt-2 opacity-90">Book walk-in visitors and manage every department's queue.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/reception/book" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition">
            <TicketPlus size={16} /> Book walk-in
          </Link>
          <button
            type="button"
            onClick={() => setShowQrScanner(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/20 text-white font-semibold border border-white/30 hover:bg-white/30 transition"
          >
            <QrCode size={16} /> Scan Visitor QR Pass
          </button>
          <Link to="/reception/queue" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/15 text-white font-semibold border border-white/30 hover:bg-white/25 transition">
            <ListOrdered size={16} /> Queue tracking
          </Link>
        </div>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard icon={Users} label="Today's tokens" value={today.length} tone="sky" />
        <StatCard icon={TicketPlus} label="Walk-ins today" value={walkIns.length} tone="emerald" />
        <StatCard icon={ListOrdered} label="Currently waiting" value={today.filter((t) => t.status === "waiting").length} tone="amber" />
        <StatCard icon={Hourglass} label="Joining later" value={today.filter((t) => t.status === "delayed").length} tone="violet" />
        <StatCard icon={UserX} label="Not checked in" value={today.filter((t) => t.status === "missed").length} tone="rose" />
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="font-semibold mb-3">Recent walk-ins</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {walkIns.slice(-8).reverse().map((t) => {
            const d = deptsById[t.departmentId];
            const cancellable = t.status !== "completed" && t.status !== "cancelled" && t.status !== "skipped";
            return (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{t.code} — {t.visitorName}</p>
                  <p className="text-xs text-slate-500">{d?.name} · {new Date(t.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">{t.status}</span>
                  {cancellable && (
                    <button
                      onClick={() => setCancelTargetToken(t)}
                      title="Cancel this visitor's booking"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-400 text-rose-600"
                    >
                      <XCircle size={12} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!walkIns.length && <p className="py-4 text-sm text-slate-500">No walk-ins yet today.</p>}
        </div>
      </div>

      {cancelTargetToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 grid place-items-center mx-auto text-xl font-bold">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cancel Visitor Token?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel token <span className="font-bold text-slate-800 dark:text-slate-200">{cancelTargetToken.code}</span> for <span className="font-bold">{cancelTargetToken.visitorName || "this visitor"}</span>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetToken(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow transition"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrScanner && (
        <QrScannerModal
          onClose={() => setShowQrScanner(false)}
          onVerified={() => load()}
        />
      )}
    </div>
  );
}
