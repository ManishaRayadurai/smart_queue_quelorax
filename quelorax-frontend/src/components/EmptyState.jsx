import { Inbox } from "lucide-react";
export default function EmptyState({ title = "Nothing here yet", message = "", icon: Icon = Inbox }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
        <Icon size={20} />
      </div>
      <h3 className="mt-3 font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
    </div>
  );
}