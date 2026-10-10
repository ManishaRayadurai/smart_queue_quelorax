import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, Bell, Palette, Check, Sun, Moon, Info, Camera, Upload, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { usersApi } from "../../api/users.js";
import { authApi } from "../../api/auth.js";
import { setToken } from "../../api/client.js";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function Settings() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your account profile, security, and application preferences.</p>

      <div className="mt-6 grid md:grid-cols-[220px_1fr] gap-6">
        {/* Tabs */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                tab === id
                  ? "bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-fade-in">
          {tab === "profile" && <ProfilePanel />}
          {tab === "security" && <SecurityPanel />}
          {tab === "notifications" && <NotificationsPanel />}
          {tab === "appearance" && <AppearancePanel />}
        </div>
      </div>
    </div>
  );
}

function SavedBadge({ show }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
      <Check size={14} /> Saved
    </span>
  );
}

function getRoleDashboard(role) {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "/admin";
  if (r === "staff") return "/staff";
  if (r === "receptionist") return "/reception";
  return "/visitor";
}

function ProfilePanel() {
  const { user, refresh, updateUser } = useAuth();
  const nav = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [imgErr, setImgErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfileImage(user?.profileImage || null);
    setForm({ name: user?.name || "", phone: user?.phone || "" });
  }, [user?.profileImage, user?.name, user?.phone]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    setImgErr("");
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setImgErr("Invalid image file type. Please select a PNG, JPG, WEBP, or GIF image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

        setProfileImage(compressedDataUrl);
        if (updateUser) {
          updateUser({ profileImage: compressedDataUrl });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setImgErr("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (user?.id) {
      localStorage.removeItem(`qx_avatar_${user.id}`);
    }
    if (updateUser) {
      updateUser({ profileImage: null });
    }
  };

  const save = async () => {
    if (!form.phone || !form.phone.trim()) {
      setErr("Phone number is required for queue notifications.");
      return;
    }
    setErr("");
    setSaving(true);
    try {
      const imgPayload = profileImage && profileImage.trim() !== "" ? profileImage : "";

      if (imgPayload && imgPayload !== "") {
        localStorage.setItem(`qx_avatar_${user.id}`, imgPayload);
      } else {
        localStorage.removeItem(`qx_avatar_${user.id}`);
      }

      const updatedUser = await usersApi.update(user.id, {
        name: form.name,
        phone: form.phone,
        profileImage: imgPayload,
      });

      if (updateUser) {
        updateUser({
          ...user,
          ...updatedUser,
          name: form.name,
          phone: form.phone,
          profileImage: imgPayload !== "" ? imgPayload : null,
        });
      }

      setSaved(true);
      const targetDashboard = getRoleDashboard(user?.role);
      setTimeout(() => {
        nav(targetDashboard);
      }, 700);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Profile</h2>
        <p className="text-sm text-slate-500">Your account details and profile image.</p>
      </div>

      {/* Profile Image Upload & Preview Section */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-700 shrink-0 shadow-sm">
            {profileImage ? (
              <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-400">
                {form.name ? form.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 hover:bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Change photo"
            >
              <Camera size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/png, image/jpeg, image/webp, image/gif"
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition"
              >
                <Upload size={14} /> Upload image
              </button>
              {profileImage && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 text-rose-600 dark:text-rose-400 transition"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Allowed: JPG, PNG, WEBP, GIF (Max size: 5MB).
            </p>
          </div>
        </div>
        {imgErr && <p className="text-xs text-rose-500 font-semibold">{imgErr}</p>}
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500">Full name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">Email</label>
        <input
          value={user.email}
          disabled
          className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">
          Phone number <span className="text-rose-500">*</span>
        </label>
        <input
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
        />
        <p className="mt-1 text-xs text-slate-500">
          Required — used to send queue and token notifications.
        </p>
      </div>
      {err && <p className="text-sm text-rose-500">{err}</p>}
      <div className="flex items-center gap-3 pt-2">
        <button disabled={saving} onClick={save} className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <SavedBadge show={saved} />
      </div>
    </div>
  );
}

function SecurityPanel() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const change = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (form.next.length < 6) return setErr("New password must be at least 6 characters.");
    if (form.next !== form.confirm) return setErr("New passwords do not match.");
    setSaving(true);
    try {
      // The backend never returns the password hash to the client, so we
      // can't compare it locally like before — we verify the current
      // password for real by attempting a login with it.
      const res = await authApi.login(user.email, form.current);
      setToken(res.token);
      await usersApi.update(user.id, { password: form.next });
      setMsg("Password updated successfully.");
      setForm({ current: "", next: "", confirm: "" });
    } catch (e) {
      setErr(e.status === 401 ? "Current password is incorrect." : e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-lg">Security</h2>
        <p className="text-sm text-slate-500">Update your password to keep your account secure.</p>
      </div>
      <form onSubmit={change} className="space-y-4 max-w-sm">
        <div>
          <label className="text-xs font-semibold text-slate-500">Current password</label>
          <input
            type="password"
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">New password</label>
          <input
            type="password"
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Confirm new password</label>
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
          />
        </div>
        {err && <p className="text-sm text-rose-500">{err}</p>}
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        <button disabled={saving} className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm disabled:opacity-60">
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

// The backend's User entity has no field for per-user notification
// preferences yet (name/email/phone/password/role/departmentId only) — so
// these can't be saved server-side without a schema change. Kept as a
// per-browser preference (localStorage) for now, same pattern as theme and
// language, and flagged clearly rather than silently pretending it syncs.
function NotificationsPanel() {
  const { user } = useAuth();
  const storageKey = `qx_notif_prefs_${user.id}`;
  const defaults = { queueUpdates: true, tokenStatus: true, emergencyAlerts: true, email: true, sms: true };
  const [prefs, setPrefs] = useState(() => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch {
      return defaults;
    }
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const items = [
    { key: "queueUpdates", label: "Queue position updates", desc: "People ahead of you, estimated waiting time." },
    { key: "tokenStatus", label: "Token status", desc: "Booking confirmed, called, completed." },
    { key: "emergencyAlerts", label: "Emergency & priority changes", desc: "When priority updates affect your wait." },
    { key: "email", label: "Email notifications", desc: "Receive a copy of important alerts by email." },
    { key: "sms", label: "SMS notifications", desc: "Sent to your registered phone number." },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Notifications</h2>
          <p className="text-sm text-slate-500">Choose what you want to be notified about.</p>
        </div>
        <SavedBadge show={saved} />
      </div>
      <p className="text-xs text-slate-500 flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">
        <Info size={13} className="mt-0.5 shrink-0" />
        These preferences are saved to this browser only for now — the backend doesn't have a field for
        per-user notification settings yet, so they won't follow you to another device.
      </p>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3.5 gap-4">
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
            <Toggle checked={prefs[key]} onChange={() => toggle(key)} />
          </div>
        ))}
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

// Theme/language are already client-side-only (localStorage via
// ThemeContext/LanguageContext) — intentionally not wired to the backend's
// Settings table, since that table is a single global row, not per-user.
// Connecting it here would mean one visitor toggling dark mode changes it
// for every other user in the org.
function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-lg">Appearance</h2>
        <p className="text-sm text-slate-500">Choose how Quelorax looks. Applies on this device only.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {[
          { id: "light", label: "Light", icon: Sun },
          { id: "dark", label: "Dark", icon: Moon },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={`rounded-xl border-2 p-4 text-left transition ${
              theme === id
                ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}
          >
            <div
              className={`w-full h-16 rounded-lg mb-3 grid place-items-center ${
                id === "light" ? "bg-white border border-slate-200" : "bg-slate-900 border border-slate-700"
              }`}
            >
              <Icon size={20} className={id === "light" ? "text-amber-500" : "text-slate-200"} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{label}</span>
              {theme === id && <Check size={16} className="text-sky-600" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
