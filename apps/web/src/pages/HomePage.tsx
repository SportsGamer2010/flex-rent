import { ArrowRight, Building2, Crown, ShieldCheck, Users, Wallet, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_NAME, APP_TAGLINE } from "../lib/brand";

const features = [
  {
    icon: Building2,
    title: "Landlords paid in full, on time",
    text: "Receive complete rent on the due date while tenants repay FlexRent in flexible installments.",
  },
  {
    icon: ShieldCheck,
    title: "Risk-based payment plans",
    text: "Soft credit checks assign each tenant a risk tier — high risk splits into 2 payments, low/medium into 4.",
  },
  {
    icon: Users,
    title: "Verified rental history",
    text: "Tenants submit prior landlord references and rental records before enrollment is approved.",
  },
  {
    icon: Zap,
    title: "Utility bill service",
    text: "Tenants upload and pay utility bills through the platform — fewer missed payments, less admin.",
  },
  {
    icon: Wallet,
    title: "Predictable cash flow",
    text: "No partial rent to chase. FlexRent guarantees full payout regardless of tenant split schedule.",
  },
  {
    icon: Crown,
    title: "Professional tenant experience",
    text: "A modern portal that keeps residents satisfied and renewals strong.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-24 pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(184,134,11,0.18),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-600/50 to-transparent" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-600/30 bg-brand-600/10 px-4 py-1.5 text-sm text-brand-200">
            <Crown className="h-4 w-4 text-brand-400" />
            Built for property owners
          </div>
          <h1 className="font-serif-display text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {APP_NAME}
            <span className="mt-2 block text-2xl font-normal sm:text-3xl">
              <span className="gold-gradient-text">{APP_TAGLINE}</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400">
            Offer your tenants flexible rent payments while you receive full rent on time, every time.
            Risk-based splits, verified rental history, and utility bill management — all in one platform.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login" className="btn-gold px-8 py-3.5 text-base">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-outline-gold px-8 py-3.5 text-base">
              View demo
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-brand-600/15 bg-surface-800/40 px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          <div className="text-center">
            <p className="font-serif-display text-3xl font-bold text-brand-400">2 or 4</p>
            <p className="mt-1 text-sm text-neutral-400">Payment splits based on risk tier</p>
          </div>
          <div className="text-center">
            <p className="font-serif-display text-3xl font-bold text-brand-400">100%</p>
            <p className="mt-1 text-sm text-neutral-400">Rent paid to landlords on due date</p>
          </div>
          <div className="text-center">
            <p className="font-serif-display text-3xl font-bold text-brand-400">Soft</p>
            <p className="mt-1 text-sm text-neutral-400">Credit check — no hard inquiry</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-20 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="card-surface p-6 transition hover:border-brand-500/40"
          >
            <f.icon className="h-8 w-8 text-brand-400" />
            <h3 className="mt-4 font-serif-display text-lg font-semibold text-brand-100">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-brand-600/15 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif-display text-2xl font-semibold text-brand-100">How it works</h2>
          <ol className="mt-8 space-y-4 text-left text-neutral-400">
            <li className="card-surface p-4">
              <span className="font-medium text-brand-100">1. Landlord enrolls property</span> —
              create your account and invite tenants to apply.
            </li>
            <li className="card-surface p-4">
              <span className="font-medium text-brand-100">2. Tenant completes verification</span> —
              soft credit check and rental history determine their payment plan.
            </li>
            <li className="card-surface p-4">
              <span className="font-medium text-brand-100">3. You receive full rent on the 1st</span> —
              tenants repay FlexRent in 2 or 4 installments throughout the month.
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
