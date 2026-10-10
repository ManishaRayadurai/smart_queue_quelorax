import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

export default function ResetPassword() {
  const { confirmReset, requestReset } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: params.get("email") || "", code: "", password: "" });
  const [err, setErr] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const RESEND_COOLDOWN_SECONDS = 30;
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await confirmReset(form.email, form.code, form.password);
      nav("/app", { replace: true });
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendBusy || !form.email) return;
    setErr("");
    setResendBusy(true);
    try {
      await requestReset(form.email);
      setResendMsg("We've sent a new reset code to your email and phone.");
      setForm((f) => ({ ...f, code: "" }));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setErr(e.message);
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {["email", "code", "password"].map((k) => (
              <div key={k}>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">{k === "code" ? "Reset code" : k}</label>
                {k === "password" ? (
                  <PasswordInput
                    required
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                )}
              </div>
            ))}
            {err && <p className="text-sm text-rose-500">{err}</p>}
            {resendMsg && <p className="text-sm text-emerald-600">{resendMsg}</p>}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendBusy || !form.email}
              className="text-xs font-semibold text-sky-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
            >
              {resendBusy
                ? "Sending…"
                : resendCooldown > 0
                ? `Resend code in 0:${String(resendCooldown).padStart(2, "0")}`
                : "Resend code"}
            </button>
            <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold">Reset & Log in</button>
          </form>
          <p className="mt-4 text-sm">
            <Link to="/login" className="text-sky-600 hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}