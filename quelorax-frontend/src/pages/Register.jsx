import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, User, Mail, Phone, Lock, KeyRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

// Normalizes phone input toward E.164 format as the user types:
// strips spaces/dashes/parens, and prepends +91 if no country code was given.
// (Change the default country code below if most of your users aren't in India.)
const DEFAULT_COUNTRY_CODE = "+91";
function normalizePhoneInput(raw) {
  let v = raw.replace(/[\s\-()]/g, ""); // strip spaces, dashes, parens as you type
  if (v === "" || v === "+") return v; // let the user clear the field or start typing "+"
  if (!v.startsWith("+")) {
    // strip a leading 0 some people type out of habit (e.g. "09876543210")
    v = v.replace(/^0+/, "");
    v = DEFAULT_COUNTRY_CODE + v;
  }
  return v;
}

export default function Register() {
  const { register, resendRegistrationOtp, verifyRegistration, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  // Form data persists across steps so going back never loses what was typed.
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", code: "" });
  const [otpNotice, setOtpNotice] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  // Seconds left before "Resend code" becomes clickable — starts counting
  // the moment step 2 loads (a code was just sent), and again after every
  // resend, so people can't hammer the resend button.
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
      // A Google sign-up doesn't need email OTP verification since Google
      // already verified the address, so this signs the person straight in.
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
      if (step === 1) {
        await register(form);
        setOtpNotice("We've sent a 6-digit code to your email and phone.");
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setStep(2);
      } else {
        await verifyRegistration(form.email, form.code);
        nav("/app", { replace: true });
      }
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
      await resendRegistrationOtp(form.email);
      setOtpNotice("We've sent a new code to your email and phone.");
      setForm((f) => ({ ...f, code: "" })); // clear the old (now-invalid) code so it's not re-submitted by mistake
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setErr(e.message);
    } finally {
      setResendBusy(false);
    }
  };

  const handleBack = () => {
    setErr("");
    if (step === 2) {
      // Return to step 1 without losing any of the entered details.
      setStep(1);
    } else {
      nav(-1);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl animate-fade-in-up">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="mt-4 flex items-center gap-2">
            <StepDot active={step >= 1} done={step > 1} label="1" />
            <div className={`h-0.5 flex-1 rounded ${step > 1 ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"}`} />
            <StepDot active={step >= 2} done={false} label="2" />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">Step {step} of 2</p>

          <h1 className="mt-3 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 1
              ? "Sign up as a visitor. Staff and admin accounts are created by administrators."
              : "Enter the verification code sent to your email."}
          </p>

          {step === 1 && (
            <>
              <div className="mt-6">
                <GoogleSignInButton
                  onCredential={handleGoogleCredential}
                  onError={setErr}
                  label="Sign up with Google"
                />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs font-semibold text-slate-400">OR</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="mt-4 space-y-4">
            {step === 1 && (
              <>
                <Field icon={User} label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field icon={Phone} label="Phone number" type="tel" placeholder="+919876543210" value={form.phone} onChange={(v) => setForm({ ...form, phone: normalizePhoneInput(v) })} />
                <Field icon={Lock} label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              </>
            )}
            {step === 2 && (
              <>
                <Field icon={KeyRound} label="6-digit code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} center />
                {otpNotice && <p className="text-xs text-emerald-600">{otpNotice}</p>}
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resendBusy}
                    className="font-semibold text-sky-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {resendBusy
                      ? "Sending…"
                      : resendCooldown > 0
                      ? `Resend code in 0:${String(resendCooldown).padStart(2, "0")}`
                      : "Resend code"}
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="text-sky-600 hover:underline font-semibold">
                    Wrong email or phone? Go back
                  </button>
                </div>
              </>
            )}
            {err && <p className="text-sm text-rose-500">{err}</p>}
            <button
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-60"
            >
              {busy ? "Please wait…" : step === 1 ? "Send verification code" : "Verify & Continue"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-sky-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

function StepDot({ active, done, label }) {
  return (
    <div
      className={`w-7 h-7 shrink-0 rounded-full grid place-items-center text-xs font-bold transition ${
        active
          ? "bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow"
          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
      }`}
    >
      {label}
    </div>
  );
}

function Field({ label, type = "text", value, onChange, icon: Icon, center = false, placeholder }) {
  const baseClass = `w-full py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400 transition ${
    Icon ? "pl-9 pr-3" : "px-3"
  } ${center ? "text-center tracking-widest" : ""}`;

  if (type === "password") {
    return (
      <div>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
        <div className="mt-1">
          <PasswordInput
            icon={Icon}
            required
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
      <div className="mt-1 relative">
        {Icon && (
          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        )}
        <input
          type={type}
          required
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      </div>
    </div>
  );
}
