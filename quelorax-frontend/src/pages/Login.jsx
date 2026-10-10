import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

export default function Login() {
  const { login, requestLoginOtp, loginWithOtp, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("password"); // password | otp
  const [form, setForm] = useState({ email: "", password: "", code: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const RESEND_COOLDOWN_SECONDS = 30;
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const handleGoogleCredential = async (credential) => {
    setErr("");
    setBusy(true);
    try {
      await loginWithGoogle(credential);
      nav("/app", { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "password") {
        await login(form.email, form.password);
      } else if (!otpSent) {
        await requestLoginOtp(form.email);
        setOtpSent(true);
        setOtpNotice("We've sent a login code to your email and phone.");
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setBusy(false);
        return;
      } else {
        await loginWithOtp(form.email, form.code);
      }
      nav("/app", { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendBusy) return;
    setErr("");
    setResendBusy(true);
    try {
      await requestLoginOtp(form.email);
      setOtpNotice("We've sent a new code to your email and phone.");
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
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl animate-fade-in-up">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your Quelorax account.</p>

          <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {["password", "otp"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setOtpSent(false); setErr(""); setResendCooldown(0); }}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  mode === m ? "bg-white dark:bg-slate-900 shadow" : "text-slate-500"
                }`}
              >
                {m === "password" ? "Password" : "OTP"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
              />
            </div>
            {mode === "password" && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
                <PasswordInput
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
                />
              </div>
            )}
            {mode === "otp" && otpSent && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">OTP Code</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400 tracking-widest text-center"
                />
                {otpNotice && <p className="mt-1 text-xs text-emerald-600">{otpNotice}</p>}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendBusy}
                  className="mt-2 text-xs font-semibold text-sky-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resendBusy
                    ? "Sending…"
                    : resendCooldown > 0
                    ? `Resend code in 0:${String(resendCooldown).padStart(2, "0")}`
                    : "Resend code"}
                </button>
              </div>
            )}
            {err && <p className="text-sm text-rose-500">{err}</p>}
            <button
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "otp" && !otpSent ? "Send OTP" : "Log in"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold text-slate-400">OR</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="mt-4">
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={setErr}
              label="Sign in with Google"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-sky-600 hover:underline">Forgot password?</Link>
            <Link to="/register" className="text-slate-600 dark:text-slate-400">Create account</Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}