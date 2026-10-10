export default function StatCard({ icon: Icon, label, value, hint, tone = "sky" }) {
  const tones = {
    sky: "from-sky-500 to-indigo-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
    violet: "from-violet-500 to-purple-500",
  };
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <span className={`p-3 rounded-xl bg-gradient-to-br text-white ${tones[tone]}`}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </div>
  );
}