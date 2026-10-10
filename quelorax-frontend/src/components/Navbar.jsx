import { Link, NavLink, useLocation } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import AnimatedLogo from "./AnimatedLogo.jsx";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash || "");
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    const handleScroll = () => {
      if (location.pathname !== "/") {
        setActiveHash("");
        return;
      }
      const sections = ["features", "testimonials", "faq", "contact"];
      const scrollPos = window.scrollY + 120;
      let current = "";
      for (const s of sections) {
        const el = document.getElementById(s);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            current = `#${s}`;
            break;
          }
        }
      }
      setActiveHash(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  const getNavCls = (targetHash, isHome = false) => {
    const isLandingPage = location.pathname === "/";
    const isActive = isHome
      ? isLandingPage && !activeHash
      : isLandingPage && activeHash === targetHash;

    return `text-sm font-semibold transition-all duration-200 px-2.5 py-1.5 rounded-lg ${
      isActive
        ? "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 shadow-sm border border-sky-200 dark:border-sky-800/60"
        : "text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/70 dark:hover:bg-sky-950/40"
    }`;
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <AnimatedLogo />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Quelorax
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" end className={() => getNavCls("", true)}>
            Home
          </NavLink>
          <a href="/#features" className={getNavCls("#features")}>
            Features
          </a>
          <a href="/#testimonials" className={getNavCls("#testimonials")}>
            Testimonials
          </a>
          <a href="/#faq" className={getNavCls("#faq")}>
            FAQ
          </a>
          <a href="/#contact" className={getNavCls("#contact")}>
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user ? (
            <Link
              to="/app"
              className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow transition"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-semibold shadow hover:shadow-md transition"
              >
                Sign up
              </Link>
            </>
          )}
          <button className="md:hidden p-2" onClick={() => setOpen((v) => !v)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-col gap-2 bg-white dark:bg-slate-950">
          <a href="/#features" onClick={() => setOpen(false)} className={getNavCls("#features")}>Features</a>
          <a href="/#testimonials" onClick={() => setOpen(false)} className={getNavCls("#testimonials")}>Testimonials</a>
          <a href="/#faq" onClick={() => setOpen(false)} className={getNavCls("#faq")}>FAQ</a>
          <a href="/#contact" onClick={() => setOpen(false)} className={getNavCls("#contact")}>Contact</a>
          {!user && (
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg border text-sm font-semibold">Log in</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}