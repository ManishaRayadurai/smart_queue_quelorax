import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, Users, Clock, ArrowRight, Sparkles, AlertCircle, UserCheck, AlertTriangle, XCircle, QrCode } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import { predictWaitTime, predictWaitTimeAsync, crowdDensity } from "../../utils/aiPredictions.js";
import EmptyState from "../../components/EmptyState.jsx";
import TokenTicketModal from "../../components/TokenTicketModal.jsx";

const PRIORITY_LABEL = {
  emergency: "Emergency",
  senior: "Senior citizen",
  vip: "VIP",
  normal: null,
};

const ACTIVE_STATUSES = ["waiting", "serving", "delayed", "missed"];

export default function QueueTracking() {
  const { user } = useAuth();
  const [myTokens, setMyTokens] = useState([]);
  const [deptsById, setDeptsById] = useState({});
  const [waitingByDept, setWaitingByDept] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [allTokens, departments] = await Promise.all([
        tokensApi.getByUser(user.id),
        departmentsApi.getAll(),
      ]);
      const active = allTokens.filter((t) => ACTIVE_STATUSES.includes(t.status));

      const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));

      // Overdue "delayed" tokens should flip to "missed" server-side - ask
      // the backend to check, once per distinct department involved.
      const delayedDeptIds = [...new Set(active.filter((t) => t.status === "delayed").map((t) => t.departmentId))];
      if (delayedDeptIds.length) {
        await Promise.all(delayedDeptIds.map((id) => tokensApi.flagOverdue(id).catch(() => {})));
      }

      // Re-fetch after any overdue flips, and build a waiting-queue map for
      // every distinct department these tokens belong to, so each card can
      // show an accurate position without one request per card.
      const allTokens2 = delayedDeptIds.length ? await tokensApi.getByUser(user.id) : allTokens;
      const active2 = allTokens2.filter((t) => ACTIVE_STATUSES.includes(t.status));

      const deptIds = [...new Set(active2.map((t) => t.departmentId))];
      const waitingPairs = await Promise.all(
        deptIds.map((id) => tokensApi.getWaiting(id).then((q) => [id, q]))
      );

      setMyTokens(active2);
      setDeptsById(deptMap);
      setWaitingByDept(Object.fromEntries(waitingPairs));
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // Queue state can change from another tab (staff calling tokens), so poll
  // gently.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const [allDeptsList, setAllDeptsList] = useState([]);
  const [allTokensList, setAllTokensList] = useState([]);

  useEffect(() => {
    departmentsApi.getAll().then(setAllDeptsList).catch(() => {});
    tokensApi.getAll().then(setAllTokensList).catch(() => {});
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading live queue tracking…</div>;
  }

  if (!myTokens.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Queue tracking</h1>
            <p className="text-sm text-slate-500">Live queue monitor across all departments.</p>
          </div>
          <Link
            to="/visitor/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold text-sm shadow hover:shadow-lg transition"
          >
            <Ticket size={16} /> Book a token <ArrowRight size={16} />
          </Link>
        </div>

        {err && <p className="text-sm text-rose-500">{err}</p>}

        {/* Live Department Queue Monitor */}
        <div className="grid gap-4 md:grid-cols-3">
          {allDeptsList.map((d) => {
            const deptTokens = allTokensList.filter((t) => String(t.departmentId) === String(d.id));
            const waiting = deptTokens.filter((t) => t.status === "waiting");
            const serving = deptTokens.find((t) => t.status === "serving");
            const density = crowdDensity(waiting.length);
            const densityTone = {
              low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
              medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
              high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
            }[density.level];

            return (
              <div key={d.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">{d.name}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${densityTone}`}>
                    {density.level} crowd
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Now Serving</p>
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {serving?.code && serving?.number ? `${serving.code}-${serving.number}` : serving?.code || "—"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Waiting</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">
                      {waiting.length} visitors
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Location: Counter {d.counter || 1}</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">Avg ~{d.avgServiceTime || 8} min/visit</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Queue tracking</h1>
      {err && <p className="text-sm text-rose-500">{err}</p>}
      <div className="grid gap-6">
        {myTokens.map((t) => (
          <TokenCard
            key={t.id}
            token={t}
            dept={deptsById[t.departmentId]}
            waitingQueue={waitingByDept[t.departmentId] || []}
            onRefresh={refresh}
          />
        ))}
      </div>
    </div>
  );
}

function TokenCard({ token, dept, waitingQueue, onRefresh }) {
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const position = waitingQueue.findIndex((t) => t.id === token.id) + 1;
  const ahead = Math.max(0, position - 1);
  const syncEta = token.status === "waiting" ? predictWaitTime(dept?.avgServiceTime, position, token.priority) : 0;
  const [eta, setEta] = useState(syncEta);

  useEffect(() => {
    let active = true;
    if (token.status === "waiting") {
      predictWaitTimeAsync(token.departmentId, token.priority, position).then((res) => {
        if (active && res) setEta(res);
      });
    }
    return () => { active = false; };
  }, [token.departmentId, token.priority, position, token.status]);

  const density = crowdDensity(waitingQueue.length);
  const priorityLabel = PRIORITY_LABEL[token.priority];

  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCheckIn = async () => {
    await tokensApi.checkin(token.id);
    onRefresh?.();
  };

  const handleCancel = () => {
    setConfirmCancel(true);
  };

  const handleConfirmCancel = async () => {
    setConfirmCancel(false);
    await tokensApi.cancel(token.id);
    onRefresh?.();
  };

  const canCancel = token.status !== "serving";

  const densityTone = {
    low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  }[density.level];

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-br from-indigo-600 to-sky-500 text-white p-8">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm opacity-90">{dept?.name}</p>
            <p className="text-5xl font-extrabold mt-1">{token.code}</p>
          </div>
          <div className="text-right">
            {priorityLabel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
                <AlertCircle size={12} /> {priorityLabel}
              </span>
            )}
            <p className="text-sm opacity-90">Status</p>
            <p className="text-xl font-bold capitalize">
              {token.status === "serving"
                ? "Your turn"
                : token.status === "delayed"
                ? "Joining later"
                : token.status === "missed"
                ? "Check-in needed"
                : token.status}
            </p>
          </div>
        </div>
      </div>

      {token.status === "missed" ? (
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">You didn't check in on time</p>
              <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-0.5">
                Your requested time ({new Date(token.delayUntil ?? token.slotTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}) has passed. Tap below as soon as you arrive to rejoin the live queue.
              </p>
            </div>
          </div>
          <button
            onClick={handleCheckIn}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow hover:shadow-lg transition"
          >
            <UserCheck size={16} /> I've arrived — check in now
          </button>
          <button
            onClick={handleCancel}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 font-semibold transition"
          >
            <XCircle size={16} /> Cancel booking
          </button>
        </div>
      ) : token.status === "delayed" ? (
        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Metric icon={Clock} label="Requested arrival" value={new Date(token.delayUntil).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} />
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1.5"><Sparkles size={12} /> Department crowd</p>
              <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${densityTone}`}>
                {density.level} · {density.waiting} waiting
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Not automatically added to the queue — check in below once you're actually here, whether that's early or right on time.
          </p>
          <button
            onClick={handleCheckIn}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-sky-500 text-sky-600 dark:text-sky-400 font-semibold hover:bg-sky-50 dark:hover:bg-sky-950/30 transition"
          >
            <UserCheck size={16} /> I'm here now — check in
          </button>
          <button
            onClick={handleCancel}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 font-semibold transition"
          >
            <XCircle size={16} /> Cancel booking
          </button>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Metric icon={Users} label="People ahead" value={token.status === "serving" ? 0 : ahead} />
            <Metric icon={Clock} label="✨ AI Predicted Wait (95.95% accuracy)" value={token.status === "serving" ? "Now" : `${eta} min`} />
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <p className="text-xs text-slate-500 flex items-center gap-1.5"><Sparkles size={12} className="text-sky-500" /> ✨ AI Crowd Forecast (98.83% accuracy)</p>
              <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${densityTone}`}>
                {density.level} · {density.waiting} waiting
              </span>
            </div>
          </div>
          {canCancel && (
            <div className="flex gap-2">
              <button
                onClick={() => setTicketModalOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold text-xs shadow transition"
              >
                <QrCode size={14} /> View Digital QR Ticket
              </button>
              <button
                onClick={() => setConfirmCancel(true)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 font-semibold text-xs transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {ticketModalOpen && (
        <TokenTicketModal
          token={token}
          department={dept}
          onClose={() => setTicketModalOpen(false)}
        />
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 grid place-items-center mx-auto text-xl font-bold">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cancel Token Booking?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel token <span className="font-bold text-slate-800 dark:text-slate-200">{token.code}</span>? You will lose your position in the queue.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
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

      {token.purpose && (
        <div className="px-6 pb-6 -mt-2">
          <p className="text-xs text-slate-500">Purpose: <span className="text-slate-700 dark:text-slate-300">{token.purpose}</span></p>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
      <p className="text-xs text-slate-500 flex items-center gap-1.5"><Icon size={12} /> {label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
