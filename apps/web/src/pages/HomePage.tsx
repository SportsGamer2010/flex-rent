import { ArrowRight, Building2, Calendar, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_NAME } from "../lib/brand";

const features = [
  {
    icon: Calendar,
    title: "Split rent into 2 payments",
    text: "Align rent with your paycheck. Pick your 2nd payment date later in the month.",
  },
  {
    icon: Building2,
    title: "Landlord paid on time",
    text: "Your property gets the full rent on the due date — you repay The Unleashed in installments.",
  },
  {
    icon: ShieldCheck,
    title: "Clear, predictable pricing",
    text: "Membership fee plus a small bill payment fee. No surprise late fees in this demo.",
  },
  {
    icon: Wallet,
    title: "Works with any portal",
    text: "Integrated properties or virtual pay-in methods for existing rent portals.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-20 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.35),_transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300">
            <Sparkles className="h-4 w-4 text-accent-400" />
            {APP_NAME} — no API keys required
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Split rent into
            <span className="block bg-gradient-to-r from-brand-100 to-accent-400 bg-clip-text text-transparent">
              2 smaller payments
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            A flexible rent experience for tenants and landlords. Create your own account or use
            the demo profiles to test split payments remotely.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 px-6 py-3 text-slate-300 transition hover:bg-white/5"
            >
              API health check
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-20 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-brand-500/30"
          >
            <f.icon className="h-8 w-8 text-accent-400" />
            <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-white/10 bg-white/[0.02] px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold text-white">How the demo works</h2>
          <ol className="mt-8 space-y-4 text-left text-slate-400">
            <li className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <span className="font-medium text-white">1. Create or sign in as a tenant</span> —
              view your split schedule and make a mock payment.
            </li>
            <li className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <span className="font-medium text-white">2. Create or sign in as a landlord</span> —
              see guaranteed full rent payout on the due date.
            </li>
            <li className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <span className="font-medium text-white">3. Open admin</span> — platform stats and
              activity feed.
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
