import { useEffect, useState } from "react";
import { organizationsApi } from "../../api/organizations.js";
import { Building, Check, ShieldCheck, Ticket, Info } from "lucide-react";

// Local-only feature flags. The backend's Settings table currently only
// stores a global theme + language (see /api/settings) — there's no field
// for these booking/security toggles, so they live in this browser's
// localStorage until the backend adds support. Labeled in the UI below so
// it's clear these aren't syncing across devices/users.
const FLAGS_KEY = "quelorax_feature_flags";
const defaultFlags = { requireOtpLogin: false, allowWalkIns: true, autoVerifyDocuments: false };
const loadFlags = () => {
  try {
    return { ...defaultFlags, ...JSON.parse(localStorage.getItem(FLAGS_KEY) || "{}") };
  } catch {
    return defaultFlags;
  }
};

export default function SystemSettings() {
  const [org, setOrg] = useState({ name: "", tagline: "" });
  const [settings, setSettingsState] = useState(loadFlags());
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    organizationsApi
      .get()
      .then((data) => setOrg({ name: data?.name || "", tagline: data?.tagline || "" }))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const saveOrg = async () => {
    try {
      await organizationsApi.update({ name: org.name, tagline: org.tagline });
      setSaved(true);
      setErr("");
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setErr(e.message);
    }
  };

  const toggleSetting = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettingsState(next);
    localStorage.setItem(FLAGS_KEY, JSON.stringify(next));
  };

  const flags = [
    { key: "requireOtpLogin", label: "Require OTP for visitor login", desc: "Adds a verification step beyond password login." },
    { key: "allowWalkIns", label: "Allow receptionist walk-in bookings", desc: "Turn off to require all visitors to self-book." },
    { key: "autoVerifyDocuments", label: "Auto-mark new documents as pending review", desc: "Staff must manually verify uploads (default, recommended)." },
  ];

  if (loading) return <div className="text-sm text-slate-500">Loading settings…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">System settings</h1>
        <p className="text-sm text-slate-500">Organization-wide configuration for Quelorax.</p>
      </div>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Building size={16} /> Organization</h2>
        <div>
          <label className="text-xs font-semibold text-slate-500">Organization name</label>
          <input
            value={org.name}
            onChange={(e) => setOrg({ ...org, name: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Tagline</label>
          <input
            value={org.tagline}
            onChange={(e) => setOrg({ ...org, tagline: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveOrg} className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm">
            Save
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-semibold">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-1">
        <h2 className="font-semibold flex items-center gap-2 mb-1"><ShieldCheck size={16} /> Booking & security</h2>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
          <Info size={12} /> These toggles are stored on this browser only — the backend doesn't have fields for them yet.
        </p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {flags.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3.5 gap-4">
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <Toggle checked={!!settings[key]} onChange={() => toggleSetting(key)} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-2"><Ticket size={16} /> Token numbering</h2>
        <p className="text-sm text-slate-500">
          Tokens are auto-generated using each department's code, e.g. <span className="font-mono font-semibold">GEN-004</span>.
          Set department codes on the Departments page.
        </p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-sky-600" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
