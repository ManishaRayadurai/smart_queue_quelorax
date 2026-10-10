import { useState } from "react";
import { QrCode, ShieldCheck, CheckCircle2, AlertCircle, X, Search } from "lucide-react";
import { tokensApi } from "../api/tokens.js";

export default function QrScannerModal({ onClose, onVerified }) {
  const [tokenInput, setTokenInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setVerifying(true);
    setErr("");
    setResult(null);

    try {
      const allTokens = await tokensApi.getAll();
      const match = allTokens.find(
        (t) =>
          `${t.code}-${t.number}`.toLowerCase() === tokenInput.trim().toLowerCase() ||
          t.code.toLowerCase() === tokenInput.trim().toLowerCase()
      );

      if (match) {
        setResult({
          tokenCode: `${match.code}-${match.number}`,
          status: match.status,
          visitor: match.visitorName || `User #${match.userId || "—"}`,
          priority: match.priority,
          bookingDate: match.bookingDate || new Date(match.createdAt).toLocaleDateString(),
        });
        if (onVerified) onVerified(match);
      } else {
        setErr(`Token "${tokenInput}" not found in database.`);
      }
    } catch (e) {
      setErr("Verification failed: " + e.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <span className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <QrCode size={22} />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              QR Ticket Verification Scanner
            </h3>
            <p className="text-xs text-slate-500">Scan or enter visitor token QR code payload to verify check-in.</p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Token Code / Scanned QR Text</label>
            <div className="mt-1 flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="e.g. ACC-201 or GEN-101"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none text-slate-800 dark:text-slate-200 font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow transition disabled:opacity-60"
              >
                {verifying ? "Verifying…" : "Verify QR"}
              </button>
            </div>
          </div>
        </form>

        {err && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {err}
          </div>
        )}

        {result && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2 text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={18} /> Verified Valid Token Pass!
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200 dark:border-emerald-900/40 text-left">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Token Code:</span>
                <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">{result.tokenCode}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Status:</span>
                <p className="font-bold capitalize text-slate-900 dark:text-white">{result.status}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Visitor:</span>
                <p className="font-bold text-slate-900 dark:text-white">{result.visitor}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Priority:</span>
                <p className="font-bold capitalize text-slate-900 dark:text-white">{result.priority}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
