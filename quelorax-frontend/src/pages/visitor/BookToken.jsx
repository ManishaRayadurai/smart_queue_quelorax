import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useNotifications } from "../../contexts/NotificationContext.jsx";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import { speak, listen } from "../../utils/voice.js";
import { predictWaitTime, crowdDensity } from "../../utils/aiPredictions.js";
import { Ticket, Building2, MessageSquare, AlertTriangle, Mic, Volume2, Sparkles, Clock, CalendarDays, Accessibility, XCircle, QrCode } from "lucide-react";
import { buildSlots, buildDateOptions, formatSlot, formatSlotDateTime, isSlotInPast } from "../../utils/slots.js";
import TokenTicketModal from "../../components/TokenTicketModal.jsx";

export default function BookToken() {
  const { user } = useAuth();
  const { push } = useNotifications();
  const nav = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [deptId, setDeptId] = useState("");
  const [deptQuery, setDeptQuery] = useState("");
  const [purpose, setPurpose] = useState("");
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [dateKey, setDateKey] = useState(dateOptions[0]?.dateKey);
  const [slotTime, setSlotTime] = useState(null); // null = as soon as possible
  const [isSenior, setIsSenior] = useState(false);
  const slots = useMemo(() => buildSlots(30, { dateKey }), [dateKey]);
  const [created, setCreated] = useState(null);
  const [position, setPosition] = useState(null);
  const [cancelled, setCancelled] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingActive, setExistingActive] = useState([]);
  const [waitingCounts, setWaitingCounts] = useState({});

  // If the chosen date changes and the previously-selected time no longer
  // exists (or has since passed) for that date, fall back to "as soon as
  // possible" instead of silently submitting a stale/invalid time.
  useEffect(() => {
    if (slotTime === null) return;
    const stillValid = slots.some((s) => s.time === slotTime && !s.disabled);
    if (!stillValid) setSlotTime(null);
  }, [slots, slotTime]);

  useEffect(() => {
    (async () => {
      try {
        const data = await departmentsApi.getAll();
        const active = data.filter((d) => d.active);
        setDepartments(active);
        setDeptId(active[0]?.id || "");
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoadingDepts(false);
      }
    })();
  }, []);

  // Live "N waiting" per department, so the picker below reflects real
  // queue depth rather than a static number.
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

  // Warn (don't hard-block) if this visitor already has an active token in
  // the department they've currently selected.
  useEffect(() => {
    if (!deptId) { setExistingActive([]); return; }
    tokensApi.getActiveForUser(user.id, deptId).then(setExistingActive).catch(() => setExistingActive([]));
  }, [deptId, created, user.id]);

  const filteredDepartments = useMemo(() => {
    const q = deptQuery.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(q));
  }, [departments, deptQuery]);

  const submit = async (e) => {
    e.preventDefault();
    if (!deptId) {
      setErr("Please choose a department to continue.");
      return;
    }
    if (isSlotInPast(slotTime)) {
      setErr("That date/time has already passed. Please choose a future date and time.");
      return;
    }
    setErr("");
    setSubmitting(true);
    try {
      const token = await tokensApi.create({
        userId: user.id,
        visitorName: user.name,
        phone: user.phone,
        departmentId: deptId,
        purpose,
        slotTime,
        priority: isSenior ? "senior" : "normal",
        walkIn: false,
      });

      const tokenCode = token.code && token.number ? `${token.code}-${token.number}` : token.code;
      push({
        userId: user.id,
        type: "booking",
        title: "Booking confirmed",
        body: `Token ${tokenCode} booked. Estimated wait time calculated based on live queue.`,
      });

      setCancelled(false);
      setCreated(token);

      try {
        const queue = await tokensApi.getWaiting(token.departmentId);
        const idx = (queue || []).findIndex((t) => t.id === token.id);
        setPosition(idx >= 0 ? idx + 1 : (queue ? queue.length + 1 : 1));
      } catch {
        setPosition(1);
      }
    } catch (e) {
      setErr(e.message || "Failed to book token. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancelJustBooked = async () => {
    if (!created) return;
    setConfirmCancel(false);
    try {
      await tokensApi.cancel(created.id);
      setCancelled(true);
    } catch (e) {
      setErr(e.message);
    }
  };

  if (created) {
    if (cancelled) {
      return (
        <div className="max-w-md mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-lg animate-scale-in">
          <span className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            <XCircle size={28} />
          </span>
          <p className="mt-4 font-semibold">Token {created.code} cancelled</p>
          <p className="mt-1 text-sm text-slate-500">You can book a new token any time.</p>
          <div className="mt-6 flex gap-2 justify-center">
            <button onClick={() => { setCreated(null); setCancelled(false); }} className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold">
              Book a token
            </button>
          </div>
        </div>
      );
    }

    const selectedDept = departments.find((d) => String(d.id) === String(created.departmentId));
    const tokenDisplayCode = created.code && created.number ? `${created.code}-${created.number}` : created.code || "TOKEN";

    return (
      <div className="max-w-xl mx-auto text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-lg space-y-4 animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 grid place-items-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-bold">Token Booked Successfully!</h2>
        <p className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
          {tokenDisplayCode}
        </p>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{selectedDept?.name || "Department"}</p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold text-sm">
          Queue position: #{position || 1} · ~{predictWaitTime(selectedDept?.avgServiceTime || 8, position || 1)} min wait
        </div>

        <p className="text-xs text-slate-400">
          We'll notify you when your turn approaches. You can view your QR ticket pass below.
        </p>

        <div className="pt-2 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setTicketModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition inline-flex items-center gap-2"
          >
            <QrCode size={16} /> View Digital QR Ticket Pass
          </button>
          <button onClick={() => nav("/visitor/queue")} className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition">
            Track Queue Live
          </button>
          <button onClick={() => setCreated(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            Book Another
          </button>
          <button
            onClick={() => setConfirmCancel(true)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 font-semibold text-sm transition inline-flex items-center gap-1.5"
          >
            <XCircle size={16} /> Cancel Booking
          </button>
        </div>

        {ticketModalOpen && (
          <TokenTicketModal
            token={created}
            department={selectedDept}
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
                  Are you sure you want to cancel token <span className="font-bold text-slate-800 dark:text-slate-200">{tokenDisplayCode}</span>?
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
                  onClick={handleConfirmCancelJustBooked}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow transition"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loadingDepts) {
    return <div className="text-sm text-slate-500">Loading departments…</div>;
  }

  if (!departments.length) {
    return (
      <div className="max-w-2xl mx-auto text-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-12">
        <AlertTriangle className="mx-auto text-amber-500" size={28} />
        <p className="mt-3 font-semibold">No departments are open for booking right now</p>
        <p className="text-sm text-slate-500 mt-1">Please check back shortly, or contact the front desk.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">Book a token</h1>
      <p className="text-sm text-slate-500">Choose a department and let us know why you're visiting.</p>

      <div className="mt-6 grid md:grid-cols-[1fr_300px] gap-6">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 size={13} /> Department
            </label>
            <input
              type="text"
              value={deptQuery}
              onChange={(e) => setDeptQuery(e.target.value)}
              placeholder="Type a department name to search…"
              className="mt-2 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400 text-sm"
            />
            {deptQuery && filteredDepartments.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                No department matches "{deptQuery}". Not sure which one to pick? Use the voice assistant on the right.
              </p>
            )}
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {filteredDepartments.map((d) => {
                const density = crowdDensity(waitingCounts[d.id] ?? 0);
                const densityTone = {
                  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                  high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
                }[density.level];
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => { setDeptId(d.id); setErr(""); }}
                    className={`text-left px-4 py-3 rounded-xl border-2 transition ${
                      deptId === d.id
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-semibold text-sm">{d.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Avg. {d.avgServiceTime} min per visitor</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${densityTone}`}>
                      ✨ AI Crowd: {density.level} · {density.waiting} waiting · ✨ AI Wait ~{predictWaitTime(d.avgServiceTime, density.waiting + 1)} min
                    </span>
                  </button>
                );
              })}
            </div>
            {existingActive.length > 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                You already have an active token ({existingActive[0].code}) in this department. You can still book another if you need to, but you may want to check its status first.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Accessibility size={13} /> Senior citizen
            </label>
            <p className="mt-1 text-xs text-slate-500">Self-identify as a senior citizen to get priority placement in the live queue.</p>
            <button
              type="button"
              onClick={() => setIsSenior((v) => !v)}
              className={`mt-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition ${
                isSenior
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              {isSenior ? "✓ Booking as a senior citizen" : "I'm a senior citizen"}
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CalendarDays size={13} /> Preferred date
            </label>
            <p className="mt-1 text-xs text-slate-500">Choose which day you'd like to arrive.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {dateOptions.map((d) => (
                <button
                  type="button"
                  key={d.dateKey}
                  onClick={() => setDateKey(d.dateKey)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition ${
                    dateKey === d.dateKey
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Clock size={13} /> Preferred arrival time
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Pick a time slot on the chosen date, or join the live queue right away. Once a date/time has passed it can no longer be booked — greyed-out times are already gone.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSlotTime(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition ${
                  slotTime === null
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                As soon as possible
              </button>
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.time}
                  disabled={s.disabled}
                  onClick={() => setSlotTime(s.time)}
                  title={s.disabled ? "This time has already passed" : undefined}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition ${
                    s.disabled
                      ? "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      : slotTime === s.time
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  {formatSlot(s.time)}
                </button>
              ))}
            </div>
            {slotTime !== null && (
              <p className="mt-2 text-xs text-slate-500">
                You've selected <span className="font-semibold text-slate-700 dark:text-slate-300">{formatSlotDateTime(slotTime)}</span>.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <MessageSquare size={13} /> Purpose (optional)
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              placeholder="e.g. Renewing my registration"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400 resize-none"
            />
          </div>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-xs text-slate-500">
            Notifications will be sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{user.phone || "no phone number on file"}</span>.
            {!user.phone && (
              <> <Link to="/visitor/settings" className="text-sky-600 hover:underline font-semibold">Add one in Settings</Link>.</>
            )}
          </div>

          {err && <p className="text-sm text-rose-500">{err}</p>}
          <button disabled={submitting} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-60">
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
        </form>

        <BookingVoiceHelper departments={departments} onPickDepartment={(id) => { setDeptId(id); setDeptQuery(""); setErr(""); }} />
      </div>
    </div>
  );
}

function BookingVoiceHelper({ departments, onPickDepartment }) {
  const [listening, setListening] = useState(false);
  const [reply, setReply] = useState("");
  const [userSpeech, setUserSpeech] = useState("");

  const handleTranscript = (text) => {
    setUserSpeech(text);
    const lower = text.toLowerCase();
    
    // 1. Check for explicit department name
    const match = departments.find(
      (d) => lower.includes(d.name.toLowerCase()) || (d.code && lower.includes(d.code.toLowerCase()))
    );

    let answer;
    if (match) {
      onPickDepartment(match.id);
      answer = `I have selected ${match.name} for you. Please add any notes or click Confirm Booking below.`;
    } 
    // 2. Financial / Money / Account / Payment intent ➔ Account Services (ACC)
    else if (/money|cash|deposit|bank|account|payment|fee|balance|savings|pay|withdraw|billing/.test(lower)) {
      const accDept = departments.find((d) => d.code === "ACC" || d.name.toLowerCase().includes("account"));
      if (accDept) {
        onPickDepartment(accDept.id);
        answer = `For money deposits, payments, or banking queries, I have selected ${accDept.name} for you.`;
      } else {
        answer = "For financial services or payments, please select Account Services.";
      }
    }
    // 3. Document / Verification / Certificate / ID / Proof intent ➔ Document Verification (DOC)
    else if (/document|verification|verify|certificate|proof|passport|id|paper|check|degree|marksheet/.test(lower)) {
      const docDept = departments.find((d) => d.code === "DOC" || d.name.toLowerCase().includes("document"));
      if (docDept) {
        onPickDepartment(docDept.id);
        answer = `For certificate checks or document verification, I have selected ${docDept.name} for you.`;
      } else {
        answer = "For document checks or verification, please select Document Verification.";
      }
    }
    // 4. General / Health / Questions / Info / Enquiry ➔ General Enquiry (GEN)
    else if (/general|enquiry|question|help|info|fever|health|doctor|reception|counter|new|where|first/.test(lower)) {
      const genDept = departments.find((d) => d.code === "GEN" || d.name.toLowerCase().includes("general"));
      if (genDept) {
        onPickDepartment(genDept.id);
        answer = `For general inquiries or help, I have selected ${genDept.name} for you.`;
      } else {
        answer = "For general inquiries or assistance, please select General Enquiry.";
      }
    }
    // 5. Fallback guide
    else {
      answer = `I heard "${text}". Tell me why you're here (for example: "I want to deposit money" or "Verify my documents") and I will select the right department for you!`;
    }

    setReply(answer);
    speak(answer);
  };

  const start = () => {
    setListening(true);
    setReply("");
    setUserSpeech("");
    listen({
      onResult: handleTranscript,
      onEnd: () => setListening(false),
      onError: () => {
        setListening(false);
        setReply("Microphone access is not supported or denied in this browser.");
      },
    });
  };

  return (
    <div className="rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-5 h-fit sticky top-20 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
        <Sparkles size={16} className="text-sky-500" /> Smart AI Booking Guide
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Unsure which department to pick? Tap the mic and tell me why you're visiting (e.g. <em>"I want to deposit cash"</em> or <em>"Verify my certificates"</em>)!
      </p>

      <button
        type="button"
        onClick={start}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm shadow-md transition ${
          listening ? "bg-rose-500 animate-pulse ring-4 ring-rose-300" : "bg-gradient-to-r from-indigo-600 to-sky-500 hover:shadow-lg"
        }`}
      >
        <Mic size={18} /> {listening ? "Listening… Speak now" : "Tap to Speak"}
      </button>

      {userSpeech && (
        <div className="text-xs text-slate-500 dark:text-slate-400 italic">
          🎤 You said: "{userSpeech}"
        </div>
      )}

      {reply && (
        <div className="text-left p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-xs space-y-1 animate-fade-in">
          <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-bold">
            <Volume2 size={14} /> AI Assistant Answer
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{reply}</p>
        </div>
      )}
    </div>
  );
}
