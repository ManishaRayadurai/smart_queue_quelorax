import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";

export default function ForgotPassword() {
  const { requestReset } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await requestReset(email);
      setMsg("We've sent a reset code to your email and phone.");
      setTimeout(() => nav(`/reset-password?email=${encodeURIComponent(email)}`), 800);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your email and we'll send a code.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}
            {err && <p className="text-sm text-rose-500">{err}</p>}
            <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold">Send code</button>
          </form>
          <p className="mt-4 text-sm">
            <Link to="/login" className="text-sky-600 hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}