import { useRef } from "react";
import { Download, QrCode, Ticket, Building2, Clock, ShieldCheck, X } from "lucide-react";
import { exportPDF } from "../utils/Export.js";

export default function TokenTicketModal({ token, department, onClose }) {
  const ticketRef = useRef(null);

  if (!token) return null;

  const tokenCode = token.code && token.number ? `${token.code}-${token.number}` : token.code || "TOKEN";
  const deptName = department?.name || token.departmentName || "Department";
  const counterNum = department?.counter || token.counter || 1;
  const qrData = JSON.stringify({
    token: tokenCode,
    department: deptName,
    counter: counterNum,
    user: token.visitorName || `User #${token.userId || "—"}`,
    bookedAt: new Date(token.createdAt || Date.now()).toISOString(),
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  const handleDownloadPDF = () => {
    const ticketData = [
      { Field: "Token Number", Value: tokenCode },
      { Field: "Department", Value: deptName },
      { Field: "Counter Location", Value: `Counter ${counterNum}` },
      { Field: "Priority", Value: (token.priority || "normal").toUpperCase() },
      { Field: "Visitor Name", Value: token.visitorName || `User #${token.userId || "—"}` },
      { Field: "Booking Date & Time", Value: new Date(token.createdAt || Date.now()).toLocaleString() },
      { Field: "Verification Status", Value: "VERIFIED & SCANNABLE" },
    ];
    exportPDF(`Quelorax_Token_Ticket_${tokenCode}`, ticketData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={ticketRef}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 relative animate-scale-up"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        {/* Ticket Header */}
        <div className="text-center space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <ShieldCheck size={13} /> Official Digital Pass
          </span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Quelorax Token Pass
          </h2>
          <p className="text-xs text-slate-500">Show this QR Code at the counter when called.</p>
        </div>

        {/* Digital Ticket Card */}
        <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-5 text-center space-y-4 shadow-sm">
          {/* QR Code Container */}
          <div className="inline-block p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md">
            <img src={qrImageUrl} alt="QR Code Ticket" className="w-44 h-44 mx-auto rounded-lg" />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Your Token Number</p>
            <p className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
              {tokenCode}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Building2 size={10} /> Department
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">{deptName}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Ticket size={10} /> Counter
              </p>
              <p className="text-xs font-bold text-sky-600 dark:text-sky-400 truncate mt-0.5">Counter {counterNum}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition"
          >
            <Download size={16} /> Download PDF Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
