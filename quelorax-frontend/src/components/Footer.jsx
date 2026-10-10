import AnimatedLogo from "./AnimatedLogo.jsx";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <AnimatedLogo size={32} />
            <span className="font-bold text-slate-900 dark:text-white">Quelorax</span>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Smart crowd & queue management for every walk-in organization.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><a href="/#features">Features</a></li>
            <li><a href="/#stats">Stats</a></li>
            <li><a href="/#faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Resources</h4>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><a href="/register">Get started</a></li>
            <li><a href="/login">Log in</a></li>
            <li><a href="/#contact">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Contact</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">hello@quelorax.app</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">+1 (555) 010-2024</p>
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Quelorax. All rights reserved.
      </div>
    </footer>
  );
}