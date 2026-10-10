import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * A password <input> with a built-in show/hide eye icon.
 * Drop-in replacement for <input type="password" .../> — pass through
 * any extra props (value, onChange, required, className, etc).
 *
 * `icon` (optional): a lucide icon component to render on the left side,
 * matching the style used on the Register page fields.
 */
export default function PasswordInput({ icon: Icon, className = "", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {Icon && (
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      )}
      <input
        type={visible ? "text" : "password"}
        {...props}
        className={`${className} ${Icon ? "pl-9" : ""} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
