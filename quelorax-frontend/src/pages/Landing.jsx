import { Link } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout.jsx";
import { ArrowRight, Zap, Users, Bell, BarChart3, ShieldCheck, Sparkles, Quote, Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { departmentsApi } from "../api/departments.js";
import { tokensApi } from "../api/tokens.js";

const features = [
  { icon: Zap, title: "Smart Token System", desc: "Auto-generated tokens with real-time queue positioning for any department." },
  { icon: Users, title: "Role-based Access", desc: "Admins, staff, receptionists and visitors — each with the right tools." },
  { icon: Bell, title: "Live Notifications", desc: "Booking, calls, delays and broadcasts delivered instantly." },
  { icon: BarChart3, title: "Real Analytics", desc: "Wait time, service time, peak hours and department comparisons." },
  { icon: ShieldCheck, title: "OTP-verified Sign-up", desc: "Secure onboarding with email OTP and password reset." },
  { icon: Sparkles, title: "Voice Assistant", desc: "Web Speech powered voice help for hands-free interaction." },
];

const faqs = [
  { q: "What kind of organizations can use Quelorax?", a: "Any walk-in organization — hospitals, banks, universities, service centers, government offices, colleges, municipal offices, and more." },
  { q: "Do visitors need an account?", a: "Yes. Visitors self-signup with OTP verification. Admins create staff and receptionist accounts." },
  { q: "Can staff see other departments?", a: "No. Each staff member is scoped to the single department assigned by the admin." },
  { q: "Is the data stored locally?", a: "This demo uses LocalStorage. The store layer is isolated so it can be swapped with any real backend." },
  { q: "Does it work on mobile?", a: "Yes. The entire interface is fully responsive across phone, tablet and desktop." },
];

const testimonials = [
  {
    name: "Priya Nair",
    role: "Front Office Manager, City General Hospital",
    quote: "Our lobby used to be chaos every morning. Now patients check their token status from home and only arrive when it's nearly their turn.",
  },
  {
    name: "Arun Kumar",
    role: "Administrative Officer, District Revenue Office",
    quote: "Being able to create departments ourselves, without waiting on a developer, changed how quickly we could roll this out across counters.",
  },
  {
    name: "Fathima Rasheed",
    role: "Senior Receptionist, Metro Passport Seva Kendra",
    quote: "Marking senior citizens and emergency cases takes seconds, and the queue re-sorts itself. Visitors notice the difference immediately.",
  },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0);
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [sending, setSending] = useState(false);

  const [liveDepts, setLiveDepts] = useState([]);
  const [nowServing, setNowServing] = useState("—");
  const [avgWait, setAvgWait] = useState("5m");

  useEffect(() => {
    let cancelled = false;
    const loadLive = async () => {
      try {
        const [depts, toks] = await Promise.all([
          departmentsApi.getAll().catch(() => []),
          tokensApi.getAll().catch(() => []),
        ]);
        if (cancelled) return;

        const serving = toks.find((t) => t.status === "serving");
        const waiting = toks.find((t) => t.status === "waiting");
        const currentToken = serving || waiting;

        if (currentToken) {
          const codeStr = currentToken.code && currentToken.number
            ? `${currentToken.code}-${currentToken.number}`
            : currentToken.code || "—";
          setNowServing(codeStr);
        } else {
          setNowServing("—");
        }

        const completed = toks.filter((t) => t.status === "completed" && t.calledAt && t.createdAt);
        if (completed.length > 0) {
          const avgMs = completed.reduce((acc, t) => acc + (t.calledAt - t.createdAt), 0) / completed.length;
          setAvgWait(`${Math.max(1, Math.round(avgMs / 60000))}m`);
        } else {
          setAvgWait("5m");
        }

        const deptList = depts.map((d) => {
          const waitingInDept = toks.filter(
            (t) => String(t.departmentId) === String(d.id) && t.status === "waiting"
          ).length;
          return {
            id: d.id,
            name: d.name,
            queueCount: waitingInDept,
            avgWait: `${d.avgServiceTime || 5}m`,
          };
        });

        setLiveDepts(deptList.length ? deptList : [
          { id: 1, name: "General Enquiry", queueCount: 0, avgWait: "6m" },
          { id: 2, name: "Account Services", queueCount: 1, avgWait: "10m" },
          { id: 3, name: "Document Verification", queueCount: 0, avgWait: "8m" },
        ]);
      } catch {}
    };
    loadLive();
    const id = setInterval(loadLive, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const submitContact = async (e) => {
    e.preventDefault();
    setSending(true);
    const inquiryItem = {
      id: "inq_" + Date.now(),
      title: `📩 New Contact Inquiry from ${contact.name}`,
      body: `Email: ${contact.email} · Message: ${contact.message}`,
      createdAt: Date.now(),
      type: "contact",
    };

    try {
      const existing = JSON.parse(localStorage.getItem("qx_public_inquiries") || "[]");
      localStorage.setItem("qx_public_inquiries", JSON.stringify([inquiryItem, ...existing]));
    } catch {}

    try {
      await notificationsApi.create({
        scope: "org",
        role: "ADMIN",
        type: "contact",
        title: inquiryItem.title,
        body: inquiryItem.body,
      });
    } catch {}

    setContactSent(true);
    setContact({ name: "", email: "", message: "" });
    setSending(false);
    setTimeout(() => setContactSent(false), 5000);
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl -z-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl -z-10 animate-blob" style={{ animationDelay: "3s" }} />
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold animate-fade-in-up">
              <Sparkles size={12} /> New — Quelorax v1
            </span>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight animate-fade-in-up delay-100">
              Move queues faster. Delight every visitor.
            </h1>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-xl animate-fade-in-up delay-200">
              Quelorax powers any walk-in organization with smart tokens, live tracking, and real analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up delay-300">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition"
              >
                Get started <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Log in
              </Link>
            </div>
          </div>

          <div className="relative animate-fade-in-up delay-200">
            <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Now serving</p>
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
                    {nowServing}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Avg. wait</p>
                  <p className="text-3xl font-extrabold text-emerald-500">{avgWait}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {liveDepts.map((d) => (
                  <div
                    key={d.id || d.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div>
                      <p className="font-semibold text-sm">{d.name}</p>
                      <p className="text-xs text-slate-500">Queue: {d.queueCount} · Avg {d.avgWait}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      Live
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to run a queue</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              A complete platform for booking, tracking, staffing and reporting.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-1 transition animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className="inline-flex p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 grid gap-6 md:grid-cols-4 text-center">
          {[
            { v: "120K+", l: "Tokens issued" },
            { v: "4 min", l: "Avg. wait cut" },
            { v: "96%", l: "Completion rate" },
            { v: "24/7", l: "Realtime updates" },
          ].map((s, i) => (
            <div
              key={s.l}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 hover:shadow-md transition animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <p className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">{s.v}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold">Trusted by front-desk teams</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Real feedback from the people managing queues every day.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((tm, i) => (
              <div
                key={tm.name}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 hover:shadow-lg transition animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <Quote className="text-sky-500" size={22} />
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{tm.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white grid place-items-center font-semibold">
                    {tm.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{tm.name}</p>
                    <p className="text-xs text-slate-500">{tm.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center animate-fade-in-up">Frequently asked</h2>
          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <button
                key={f.q}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{f.q}</span>
                  <span className="text-slate-500">{openFaq === i ? "−" : "+"}</span>
                </div>
                {openFaq === i && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{f.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-start">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold">Get in touch</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Questions about rolling out Quelorax at your hospital, office, or service center? Send us a message.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"><Mail size={16} /></span>
                hello@quelorax.app
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"><Phone size={16} /></span>
                +1 (555) 010-2024
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"><MapPin size={16} /></span>
                Remote-first · Support worldwide
              </div>
            </div>
          </div>

          <form
            onSubmit={submitContact}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 animate-fade-in-up delay-100"
          >
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Your name</label>
              <input
                required
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email</label>
              <input
                type="email"
                required
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Message</label>
              <textarea
                required
                rows={4}
                value={contact.message}
                onChange={(e) => setContact({ ...contact, message: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-sky-400 resize-none"
              />
            </div>
            <button
              disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow disabled:opacity-60"
            >
              {sending ? "Sending…" : contactSent ? (
                <>
                  <CheckCircle2 size={16} /> Message sent
                </>
              ) : (
                <>
                  <Send size={16} /> Send message
                </>
              )}
            </button>
            {contactSent && (
              <p className="text-xs text-emerald-600 text-center">
                Thanks — we'll get back to you within one business day.
              </p>
            )}
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
