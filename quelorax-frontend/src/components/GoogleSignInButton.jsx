import { useEffect, useRef, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * A fully custom-styled "Continue with Google" button (matches the app's
 * own pill/dark theme) that triggers Google's real, official OAuth flow
 * underneath — same technique apps like Zomato use.
 *
 * The button is ALWAYS visible, even before VITE_GOOGLE_CLIENT_ID is set,
 * so the UI looks finished while the backend is still being built. Until
 * a real Client ID is added, clicking it just surfaces a friendly notice
 * via onError instead of opening Google's popup.
 *
 * How it works once configured: Google's real button is rendered into a
 * 1x1 invisible box, then a click on our pretty button is forwarded to it.
 * The popup that opens is Google's genuine consent screen; nothing fake.
 *
 * Props:
 *  - onCredential(credential): raw Google ID token (JWT) once the person
 *    picks an account. AuthContext.loginWithGoogle sends this to
 *    POST /api/auth/google, which verifies it server-side before trusting it.
 *  - onError(message)
 *  - label: button text, e.g. "Continue with Google" | "Sign in with Google"
 */
export default function GoogleSignInButton({ onCredential, onError, label = "Continue with Google" }) {
  const hiddenBtnRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return; // not configured yet — button stays visible but inert

    let cancelled = false;

    const setup = () => {
      if (cancelled || !window.google?.accounts?.id || !hiddenBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          if (response?.credential) onCredential?.(response.credential);
          else onError?.("Google sign-in did not return a credential");
        },
      });
      // Rendered at a real (non-zero) size so Google will actually show its
      // popup when clicked, then visually hidden and stacked under our button.
      window.google.accounts.id.renderButton(hiddenBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 300,
      });
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      setup();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          setup();
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 10000);
      return () => clearInterval(interval);
    }

    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  const handleClick = () => {
    if (!CLIENT_ID) {
      onError?.("Google sign-in isn't connected yet — add VITE_GOOGLE_CLIENT_ID to .env to enable it.");
      return;
    }
    if (!ready) return;
    // Forward the click to Google's real (hidden) button so its native
    // popup opens — our visible button is just the styling layer.
    hiddenBtnRef.current?.querySelector("div[role='button']")?.click();
  };

  return (
    <div className="relative">
      {/* Hidden real Google button — kept in the DOM and functional once configured */}
      <div
        ref={hiddenBtnRef}
        className="absolute inset-0 opacity-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={handleClick}
        className="w-full inline-flex items-center justify-center gap-2.5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition"
      >
        <GoogleLogo />
        {label}
      </button>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.71A5.4 5.4 0 0 1 3.67 9c0-.6.1-1.18.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z" />
    </svg>
  );
}
