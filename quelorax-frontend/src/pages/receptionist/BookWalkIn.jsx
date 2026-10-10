import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { departmentsApi } from "../../api/departments.js";
import { tokensApi } from "../../api/tokens.js";
import { useNotifications } from "../../contexts/NotificationContext.jsx";
import { buildSlots, formatSlot } from "../../utils/slots.js";
import { ArrowLeft, Ticket, User, Phone, Building2, MessageSquare, Clock, AlertCircle, Accessibility, Siren, Star } from "lucide-react";

const PRIORITY_OPTIONS = [
  { id: "normal", label: "Normal", icon: User, tone: "border-slate-200 dark:border-slate-700 hover:border-slate-300" },
  { id: "senior", label: "Senior citizen", icon: Accessibility, tone: "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300" },
  { id: "emergency", label: "Emergency", icon: Siren, tone: "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300" },
  { id: "vip", label: "VIP", icon: Star, tone: "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300" },
];

export default function BookWalkIn() {
  const nav = useNavigate();
  const { push } = useNotifications();
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", deptId: "", purpose: "", priority: "normal" });
  const [slotTime, setSlotTime] = useState(null); // null = arriving now / as soon as possible
  const slots = useMemo(() => buildSlots(), []);
  const [created, setCreated] = useState(null);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await departmentsApi.getAll();
        const active = data.filter((d) => d.active);
        setDepartments(active);
        setForm((f) => ({ ...f, deptId: active[0]?.id || "" }));
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoadingDepts(false);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) {
      setErr("Phone number is required — it's used to send queue and token updates.");
      return;
    }
    setErr("");
    setSubmitting(true);
    try {
      const t = await tokensApi.create({
        userId: null,
        visitorName: form.name,
        phone: form.phone,
        departmentId: form.deptId,
        purpose: form.purpose,
        walkIn: true,
        slotTime,
        priority: form.priority,
      });
      // In-app notification only for now (not yet wired to the real
      // backend notification system - that's a separate step).
      push({
        scope: "department",
        departmentId: form.deptId,
        type: "booking",
        title: "New walk-in booking",
        body: `${form.name} — token ${t.code}`,
      });
      setCreated(t);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="max-w-md mx-auto text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-lg animate-scale-in">
        <span className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white"><Ticket size={28} /></span>
        <p className="mt-4 text-sm text-slate-500">Token issued</p>
        <p className="text-5xl font-extrabold">{created.code}</p>
        <p className="mt-2 text-slate-500">{created.visitorName}</p>
        {created.priority !== "normal" && (
          <span className="inline-flex mt-2 items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold capitalize">
            <AlertCircle size={12} /> {PRIORITY_OPTIONS.find((p) => p.id === created.priority)?.label}
          </span>
        )}
        <p className="mt-1 text-sm text-slate-500 flex items-center justify-center gap-1.5">
          <Clock size={13} />
          {created.status === "delayed"
            ? <>Expected around <span className="font-semibold">{formatSlot(created.slotTime)}</span> — check them in from Queue tracking when they arrive</>
            : "Arriving now"}
        </p>
        <button onClick={() => { setCreated(null); setSlotTime(null); setForm({ ...form, name: "", phone: "", purpose: "", priority: "normal" }); }}
          className="mt-6 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold">
          Book another
        </button>
      </div>
    );
  }

  if (loadingDepts) {
    return <div className="text-sm text-slate-500">Loading departments…</div>;
  }

  if (!departments.length) {
    return (
      <div className="max-w-2xl">
        <BackButton nav={nav} />
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
          <p className="font-semibold">No active departments yet</p>
          <p className="text-sm text-slate-500 mt-1">Ask an admin to create a department before booking walk-ins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <BackButton nav={nav} />
      <h1 className="mt-3 text-2xl font-bold">Book walk-in visitor</h1>
      <p className="text-sm text-slate-500">Issue a token for a visitor standing at your desk.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <Field icon={User} label="Visitor name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field icon={Phone} label="Phone number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required note="Required — used for queue and token notifications." />
        <div>
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Building2 size={13} /> Department</label>
          <select value={form.deptId} onChange={(e) => setForm({ ...form, deptId: e.target.value })}
            className="mt-1 w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400">
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Clock size={13} /> Visiting time</label>
          <p className="mt-1 text-xs text-slate-500">If the visitor is walking in right now, leave this as-is. If they said they'd come back later, pick a time. Greyed-out times have already passed today.</p>
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
              Arriving now
            </button>
            {slots.map((s) => (
              <button
                type="button"
                key={s.time}
                disabled={s.disabled}
                onClick={() => setSlotTime(s.time)}
                title={s.disabled ? "This time has already passed today" : undefined}
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
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><AlertCircle size={13} /> Priority</label>
          <p className="mt-1 text-xs text-slate-500">Mark senior citizens or emergencies so they're placed ahead in the live queue.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((p) => {
              const Icon = p.icon;
              const active = form.priority === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setForm({ ...form, priority: p.id })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition ${
                    active ? p.tone : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon size={13} /> {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><MessageSquare size={13} /> Purpose (optional)</label>
          <textarea rows={3} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400 resize-none" />
        </div>
        {err && <p className="text-sm text-rose-500">{err}</p>}
        <button disabled={submitting} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-60">
          {submitting ? "Issuing…" : "Issue token"}
        </button>
      </form>
    </div>
  );
}

function BackButton({ nav }) {
  return (
    <button
      type="button"
      onClick={() => nav(-1)}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
    >
      <ArrowLeft size={16} /> Back
    </button>
  );
}

function Field({ label, value, onChange, required = true, icon: Icon, note }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
        {Icon && <Icon size={13} />} {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input value={value} required={required} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400" />
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}
