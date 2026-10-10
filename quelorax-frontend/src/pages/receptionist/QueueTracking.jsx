import { useCallback, useEffect, useState } from "react";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import { predictWaitTime, crowdDensity } from "../../utils/aiPredictions.js";
import { useNotifications } from "../../contexts/NotificationContext.jsx";
import { speak } from "../../utils/voice.js";
import { PhoneCall, CheckCircle2, SkipForward, RotateCcw, AlertCircle, Users, Building2, Clock, Hourglass, ArrowUpToLine, UserCheck, XCircle, QrCode, Volume2 } from "lucide-react";
import QrScannerModal from "../../components/QrScannerModal.jsx";

const PRIORITY_OPTIONS = [
  { id: "normal", label: "Normal" },
  { id: "senior", label: "Senior citizen" },
  { id: "emergency", label: "Emergency" },
  { id: "vip", label: "VIP" },
];

const DELAY_OPTIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
];

const formatTime = (ms) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const PRIORITY_TONE = {
  emergency: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  senior: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  vip: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  normal: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const DENSITY_TONE = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

export default function ReceptionQueueTracking() {
  const { push } = useNotifications();
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [activeDept, setActiveDept] = useState("");
  const [dept, setDept] = useState(null);
  const [allTokens, setAllTokens] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [delayed, setDelayed] = useState([]);
  const [missed, setMissed] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [err, setErr] = useState("");
  const [waitingCounts, setWaitingCounts] = useState({});
  const [showQrScanner, setShowQrScanner] = useState(false);

  const notify = (token, title, body) => {
    if (!token?.userId) return;
    push({ userId: token.userId, type: "info", title, body });
  };

  // Load active departments once, then default to the first one.
  useEffect(() => {
    (async () => {
      try {
        const data = await departmentsApi.getAll();
        const active = data.filter((d) => d.active);
        setDepartments(active);
        setActiveDept(active[0]?.id || "");
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoadingDepts(false);
      }
    })();
  }, []);

  // Every few seconds, check whether any "join later" visitors have reached their
  // requested time. We don't auto-add them to the live queue anymore — that would
  // assume they're present when they might not be — we just flag them as a
  // likely no-show so reception can see it and check them in once they actually arrive.
  const refresh = useCallback(async () => {
    if (!activeDept) { setLoadingQueue(false); return; }
    try {
      const nowMissed = await tokensApi.flagOverdue(activeDept);
      if (nowMissed?.length) {
        nowMissed.forEach((t) => notify(t, "Please check in", `Token ${t.code} — your requested time has passed. Check in as soon as you arrive to rejoin the queue.`));
      }
      const [d, all, w, dl, ms] = await Promise.all([
        departmentsApi.getOne(activeDept),
        tokensApi.getByDepartment(activeDept),
        tokensApi.getWaiting(activeDept),
        tokensApi.getDelayed(activeDept),
        tokensApi.getMissed(activeDept),
      ]);
      setDept(d);
      setAllTokens(all);
      setWaiting(w);
      setDelayed(dl);
      setMissed(ms);
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingQueue(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDept]);

  useEffect(() => {
    if (!activeDept) return;
    setLoadingQueue(true);
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [activeDept, refresh]);

  // Live "N waiting" badge on every department tab, not just the active one.
  useEffect(() => {
    if (!departments.length) return;
    let cancelled = false;
    const loadCounts = async () => {
      const pairs = await Promise.all(
        departments.map((d) => tokensApi.getWaiting(d.id).then((w) => [d.id, w.length]).catch(() => [d.id, 0]))
      );
      if (!cancelled) setWaitingCounts(Object.fromEntries(pairs));
    };
    loadCounts();
    const id = setInterval(loadCounts, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [departments]);

  const current = allTokens.find((t) => t.status === "serving");
  const lastResolved = allTokens
    .filter((t) => t.status === "completed" || t.status === "skipped")
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];

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

  const handleDelay = async (token, minutes) => {
    if (!minutes) return;
    await tokensApi.delay(token.id, Number(minutes));
    const until = Date.now() + Number(minutes) * 60 * 1000;
    notify(token, "We've held your spot", `No problem — we'll add token ${token.code} back into the queue around ${formatTime(until)}.`);
    refresh();
  };

  const handleCheckIn = async (token) => {
    await tokensApi.checkin(token.id);
    notify(token, "You're checked in", `Token ${token.code} has been checked in and added to the live queue.`);
    refresh();
  };

  const [cancelTargetToken, setCancelTargetToken] = useState(null);

  const handleConfirmCancel = async () => {
    if (!cancelTargetToken) return;
    const t = cancelTargetToken;
    setCancelTargetToken(null);
    await tokensApi.cancel(t.id);
    notify(t, "Booking cancelled", `Token ${t.code} was cancelled.`);
    refresh();
  };

  if (loadingDepts) {
    return <div className="text-sm text-slate-500">Loading departments…</div>;
  }

  if (!departments.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
        <p className="font-semibold">No active departments</p>
        <p className="text-sm text-slate-500 mt-1">Ask an admin to create a department first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Queue tracking</h1>
          <p className="text-sm text-slate-500">Monitor every department's queue and manage priority in real time.</p>
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow transition"
          >
            <QrCode size={16} /> Scan Visitor QR Pass
          </button>
        </div>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      {/* Department tabs — monitor department-wise queues */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {departments.map((d) => {
          const density = crowdDensity(waitingCounts[d.id] ?? 0);
          return (
            <button
              key={d.id}
              onClick={() => setActiveDept(d.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                activeDept === d.id
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <Building2 size={14} />
              {d.name}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] capitalize ${DENSITY_TONE[density.level]}`}>
                {density.waiting}
              </span>
            </button>
          );
        })}
      </div>

      {loadingQueue ? (
        <div className="text-sm text-slate-500">Loading queue…</div>
      ) : (
        <>
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white p-8 shadow-lg">
            <p className="text-sm opacity-90">Now serving — {dept?.name}</p>
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Waiting ({waiting.length})</h2>
              <span className="text-xs text-slate-500 flex items-center gap-1"><Users size={12} /> Mark priority to move visitors up the queue</span>
            </div>
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
                        {t.walkIn && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">Walk-in</span>}
                      </div>
                      <p className="text-xs text-slate-500">
                        {t.visitorName} · {new Date(t.createdAt).toLocaleTimeString()} · ~{predictWaitTime(dept?.avgServiceTime, i + 1)} min wait
                        {t.slotTime && (
                          <span className="inline-flex items-center gap-1 ml-1.5 text-sky-600 dark:text-sky-400">
                            <Clock size={11} /> wants {formatTime(t.slotTime)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={t.priority}
                      onChange={(e) => changePriority(t, e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      {PRIORITY_OPTIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                    <select
                      value=""
                      onChange={(e) => handleDelay(t, e.target.value)}
                      title="If the visitor said they'll join later, pick how long and we'll hold their spot"
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="" disabled>Join later…</option>
                      {DELAY_OPTIONS.map((o) => <option key={o.minutes} value={o.minutes}>{o.label}</option>)}
                    </select>
                    <button
                      onClick={() => setCancelTargetToken(t)}
                      title="Cancel this visitor's booking"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-400 text-rose-600"
                    >
                      <XCircle size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ))}
              {!waiting.length && <p className="py-4 text-sm text-slate-500">No one is waiting in this department.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-1.5"><Hourglass size={15} /> Joining later ({delayed.length})</h2>
              <span className="text-xs text-slate-500">If they don't check in by the time shown, they'll move to "Not checked in" below</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {delayed.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{t.code}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <Clock size={10} /> expected {formatTime(t.delayUntil)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{t.visitorName} · {t.delayNote}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCheckIn(t)}
                      title="They're here now — add them to the live queue right away"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-400"
                    >
                      <ArrowUpToLine size={13} /> Check in now
                    </button>
                    <button
                      onClick={() => setCancelTargetToken(t)}
                      title="Cancel this visitor's booking"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-400 text-rose-600"
                    >
                      <XCircle size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ))}
              {!delayed.length && <p className="py-4 text-sm text-slate-500">No one has asked to join later.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-1.5"><UserCheck size={15} /> Not checked in ({missed.length})</h2>
              <span className="text-xs text-slate-500">Their requested time passed without a check-in — a possible no-show</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {missed.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{t.code}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                        <Clock size={10} /> was due {formatTime(t.delayUntil)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{t.visitorName} · {t.delayNote}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCheckIn(t)}
                      title="They've just arrived — add them to the live queue now"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <UserCheck size={13} /> Check in now
                    </button>
                    <button
                      onClick={() => setCancelTargetToken(t)}
                      title="They're not coming — cancel this booking"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-400 text-rose-600"
                    >
                      <XCircle size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ))}
              {!missed.length && <p className="py-4 text-sm text-slate-500">No no-shows right now.</p>}
            </div>
          </div>
        </>
      )}

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
          onVerified={() => refresh()}
        />
      )}
    </div>
  );
}
