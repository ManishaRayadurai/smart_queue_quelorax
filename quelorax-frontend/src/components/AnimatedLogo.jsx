export default function AnimatedLogo({ size = 36 }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 text-white font-bold shadow-lg"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-xl animate-ping bg-sky-400/40" />
      <span className="relative">Q</span>
    </span>
  );
}