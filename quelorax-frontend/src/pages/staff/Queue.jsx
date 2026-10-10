import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useNotifications } from "../../contexts/NotificationContext.jsx";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import { predictWaitTime, crowdDensity } from "../../utils/aiPredictions.js";
import { speak } from "../../utils/voice.js";
import { PhoneCall, CheckCircle2, SkipForward, RotateCcw, AlertCircle, Users, Volume2, QrCode } from "lucide-react";
import QrScannerModal from "../../components/QrScannerModal.jsx";

const PRIORITY_OPTIONS = [
  { id: "normal", label: "Normal" },
  { id: "senior", label: "Senior citizen" },
  { id: "emergency", label: "Emergency" },
  { id: "vip", label: "VIP" },
];

const PRIORITY_TONE = {
  emergency: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  senior: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  vip: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  normal: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function StaffQueue() {
  const { user } = useAuth();
  const { push } = useNotifications();
  const [dept, setDept] = useState(null);
  const [allTokens, setAllTokens] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);

  const notify = (token, title, body) => {
    if (!token?.userId) return;
    push({ userId: token.userId, type: "info", title, body });
  };

  const refresh = useCallback(async () => {
    if (!user.departmentId) { setLoading(false); return; }
    try {
      const missed = await tokensApi.flagOverdue(user.departmentId);
      if (missed?.length) {
        missed.forEach((t) => notify(t, "Please check in", `Token ${t.code} — your requested time has passed. Check in from the queue tracking page as soon as you arrive.`));
      }
      const [d, all, w] = await Promise.all([
        departmentsApi.getOne(user.departmentId),
        tokensApi.getByDepartment(user.departmentId),
        tokensApi.getWaiting(user.departmentId),
      ]);
      setDept(d);
      setAllTokens(all);
      setWaiting(w);
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.departmentId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const current = allTokens.find((t) => t.status === "serving");
  const lastResolved = allTokens
    .filter((t) => t.status === "completed" || t.status === "skipped")
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
  const density = user.departmentId ? crowdDensity(waiting.length) : null;

  const [audioLang, setAudioLang] = useState("en-US");

  const callNext = async () => {
    if (current) return;
    const next = waiting[0];
    if (!next) return;
    await tokensApi.call(next.id);

    const tokenStr = next.code && next.number ? `${next.code}-${next.number}` : next.code;
    const counterNum = dept?.counter || 1;
    const deptName = dept?.name || "Counter";

    if (audioLang === "ta-IN") {
      speak(`டோக்கன் ${tokenStr}, தயவுசெய்து ${deptName}, கவுண்டர் ${counterNum} க்கு செல்லவும்.`, "ta-IN");
    } else {
      speak(`Token ${tokenStr}, please proceed to ${deptName}, counter ${counterNum}.`, "en-US");
    }

    notify(next, "You're being called", `Token ${tokenStr} — please proceed to Counter ${counterNum} (${deptName}).`);
    refresh();
  };

  const complete = async () => {
    if (!current) return;
    await tokensApi.complete(current.id);
    const tokenStr = current.code && current.number ? `${current.code}-${current.number}` : current.code;
    notify(current, "Token completed", `Token ${tokenStr} has been completed. Thank you for visiting.`);
    refresh();
  };
  const skip = async () => {
    if (!current) return;
    await tokensApi.skip(current.id);
    const tokenStr = current.code && current.number ? `${current.code}-${current.number}` : current.code;
    notify(current, "Token skipped", `Token ${tokenStr} was skipped. Please check in at the desk.`);
    refresh();
  };
  const recall = async () => {
    if (!lastResolved || current) return;
    await tokensApi.call(lastResolved.id);
    const tokenStr = lastResolved.code && lastResolved.number ? `${lastResolved.code}-${lastResolved.number}` : lastResolved.code;
    const counterNum = dept?.counter || 1;
    const deptName = dept?.name || "Counter";

    if (audioLang === "ta-IN") {
      speak(`டோக்கன் ${tokenStr} மீண்டும் அழைக்கப்படுகிறது, தயவுசெய்து ${deptName}, கவுண்டர் ${counterNum} க்கு செல்லவும்.`, "ta-IN");
    } else {
      speak(`Recalling token ${tokenStr}, please proceed to ${deptName}, counter ${counterNum}.`, "en-US");
    }

    notify(lastResolved, "You're being recalled", `Token ${tokenStr} — please proceed to Counter ${counterNum} (${deptName}).`);
    refresh();
  };

  const changePriority = async (token, priority) => {
    if (token.priority === priority) return;
    await tokensApi.setPriority(token.id, priority);
    const label = PRIORITY_OPTIONS.find((p) => p.id === priority)?.label || priority;
    notify(token, "Priority updated", `Your visit was marked as ${label}. Waiting time updated.`);
    if (priority === "emergency") {
      waiting.filter((t) => t.id !== token.id && t.userId).forEach((t) => {
        notify(t, "Emergency case added", "Emergency case added. Waiting time updated.");
      });
    }
    refresh();
  };

  if (!user.departmentId) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
        <p className="font-semibold">No department assigned</p>
        <p className="text-sm text-slate-500 mt-1">Ask an admin to assign you to a department to manage a queue.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading queue…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Queue — {dept?.name}</h1>
          <p className="text-sm text-slate-500">Call, complete, skip or recall tokens. Mark priority as needed.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <Volume2 size={14} className="text-sky-500" /> Audio:
            <select
              value={audioLang}
              onChange={(e) => setAudioLang(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="en-US">English 🇺🇸</option>
              <option value="ta-IN">Tamil 🇮🇳 (தமிழ்)</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              const testMsg = audioLang === "ta-IN" 
                ? "டோக்கன் ஏ சி சி 201, கவுண்டர் 2 க்கு செல்லவும்." 
                : "Testing counter audio announcement system. Token ACC-201, please proceed to Counter 2.";
              speak(testMsg, audioLang);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition"
            title="Test Speaker Audio Announcement"
          >
            <Volume2 size={14} /> Test Audio
          </button>
          <button
            type="button"
            onClick={() => setShowQrScanner(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition"
          >
            <QrCode size={14} /> Scan Visitor QR
          </button>
          {density && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 ${
              { low: "bg-emerald-100 text-emerald-700", medium: "bg-amber-100 text-amber-700", high: "bg-rose-100 text-rose-700" }[density.level]
            }`}>
              <Users size={12} /> {density.level} crowd · {density.waiting} waiting
            </span>
          )}
        </div>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white p-8 shadow-lg">
        <p className="text-sm opacity-90">Now serving</p>
        <p className="text-5xl font-extrabold mt-1">{current?.code || "—"}</p>
        <p className="mt-1 opacity-90">{current?.visitorName || "No one is being served"}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={callNext} disabled={!!current || !waiting.length}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold disabled:opacity-50">
            <PhoneCall size={16} /> Call next
          </button>
          <button onClick={complete} disabled={!current}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold disabled:opacity-50">
            <CheckCircle2 size={16} /> Complete
          </button>
          <button onClick={skip} disabled={!current}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white font-semibold disabled:opacity-50">
            <SkipForward size={16} /> Skip
          </button>
          <button onClick={recall} disabled={!lastResolved || !!current}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 text-white font-semibold disabled:opacity-50">
            <RotateCcw size={16} /> Recall last
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="font-semibold mb-3">Waiting ({waiting.length})</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {waiting.map((t, i) => (
            <div key={t.id} className="py-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 grid place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold">{i + 1}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{t.code}</p>
                    {t.priority !== "normal" && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${PRIORITY_TONE[t.priority]}`}>
                        <AlertCircle size={10} /> {t.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{t.visitorName} · {new Date(t.createdAt).toLocaleTimeString()} · ~{predictWaitTime(dept?.avgServiceTime, i + 1)} min wait</p>
                </div>
              </div>
              <select
                value={t.priority}
                onChange={(e) => changePriority(t, e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {PRIORITY_OPTIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          ))}
          {!waiting.length && <p className="py-4 text-sm text-slate-500">No one is waiting.</p>}
        </div>
      </div>

      {showQrScanner && (
        <QrScannerModal
          onClose={() => setShowQrScanner(false)}
          onVerified={() => refresh()}
        />
      )}
    </div>
  );
}
