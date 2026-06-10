import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandTagline, Wordmark } from "../components/BrandLogo";
import { LANDLORD_FEE_PER_PAYMENT } from "../lib/brand";

const features = [
  {
    icon: Building2,
    title: "Full rent, every due date",
    text: "You receive 100% of rent on the 1st. We collect tenant installments behind the scenes.",
  },
  {
    icon: ShieldCheck,
    title: "Smart risk-based splits",
    text: "Soft credit checks place tenants into plans — high risk pays in 2, low/medium in 4.",
  },
  {
    icon: Users,
    title: "Verified rental history",
    text: "Every tenant submits prior landlord references before they're approved to enroll.",
  },
  {
    icon: Zap,
    title: "Utility bill payments",
    text: "Residents upload and pay utilities in the same portal — less chasing, fewer delinquencies.",
  },
  {
    icon: Wallet,
    title: "Zero integration lift",
    text: "Works with your existing rent workflow. No portal swap required to get started.",
  },
  {
    icon: Sparkles,
    title: "Premium resident experience",
    text: "Flexible pay schedules improve satisfaction, renewals, and word-of-mouth referrals.",
  },
];

const steps = [
  {
    step: "01",
    title: "Enroll your property",
    text: "Create a landlord account, add your units, and invite tenants to apply through the platform.",
  },
  {
    step: "02",
    title: "Tenant signs up & verifies",
    text: "Tenants register, enter their property details, and complete a soft credit check plus rental history.",
  },
  {
    step: "03",
    title: "You get paid in full",
    text: "Rent hits your account on the due date. Tenants repay The Unleashed on their split schedule.",
  },
];

const highlights = [
  "Free landlord signup — no monthly minimum",
  `$${LANDLORD_FEE_PER_PAYMENT} per tenant payment processed`,
  "Guaranteed full rent on the 1st",
  "2 or 4 payment splits by risk tier",
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(184,134,11,0.12),_transparent_50%)]" />
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-brand-600/5 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Wordmark className="text-3xl sm:text-4xl" />
            <div className="mt-4">
              <BrandTagline className="max-w-xs" />
            </div>
            <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Let tenants split rent.
              <span className="mt-1 block gold-gradient-text">You still get paid in full.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-400">
              The Unleashed gives landlords predictable cash flow while residents pay on a schedule
              that fits their paycheck — with verified credit, rental history, and utility bill
              management built in.
            </p>
            <ul className="mt-8 grid gap-2 sm:grid-cols-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-400" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/login" className="btn-gold px-8 py-3.5 text-base">
                Sign up as landlord
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-outline-gold px-8 py-3.5 text-base">
                Sign up as tenant
              </Link>
            </div>
          </div>

          {/* Hero visual — mock dashboard card */}
          <div className="relative hidden lg:block">
            <div className="card-surface absolute -right-4 -top-4 z-10 w-48 p-4">
              <p className="text-xs text-neutral-500">On-time payout rate</p>
              <p className="mt-1 text-3xl font-bold text-brand-400">100%</p>
            </div>
            <div className="card-surface p-6">
              <div className="mb-6 flex items-center justify-between border-b border-brand-600/15 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-500">
                    Landlord dashboard
                  </p>
                  <p className="mt-1 text-lg font-semibold text-brand-100">Sunset Apartments</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                  Active
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { unit: "4B", tenant: "Jane Doe", rent: "$2,000", split: "4 payments", risk: "Low" },
                  { unit: "2A", tenant: "Marcus Lee", rent: "$1,600", split: "2 payments", risk: "High" },
                ].map((row) => (
                  <div
                    key={row.unit}
                    className="flex items-center justify-between rounded-xl border border-brand-600/15 bg-black/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        Unit {row.unit} · {row.tenant}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {row.rent}/mo · {row.split}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.risk === "Low"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-200"
                      }`}
                    >
                      {row.risk} risk
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand-600/15 bg-black/30 p-3">
                  <p className="text-xs text-neutral-500">Monthly volume</p>
                  <p className="mt-1 text-lg font-bold text-brand-100">$3,600</p>
                </div>
                <div className="rounded-xl border border-brand-600/15 bg-black/30 p-3">
                  <p className="text-xs text-neutral-500">Platform fees</p>
                  <p className="mt-1 text-lg font-bold text-brand-100">$300/mo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-brand-600/15 bg-surface-800/50 px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          {[
            { value: `$${LANDLORD_FEE_PER_PAYMENT}`, label: "Per payment — landlord pricing" },
            { value: "100%", label: "Rent to landlords on due date" },
            { value: "Free", label: "Landlord account signup" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-brand-400">{stat.value}</p>
              <p className="mt-1 text-sm text-neutral-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-brand-100 sm:text-3xl">
              Everything landlords need in one platform
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-400">
              From risk assessment to utility payments — manage flexible rent without sacrificing
              your bottom line.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="card-surface p-6 transition hover:border-brand-500/40"
              >
                <f.icon className="h-8 w-8 text-brand-400" />
                <h3 className="mt-4 text-lg font-semibold text-brand-100">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-brand-600/15 bg-surface-800/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-brand-100 sm:text-3xl">How it works</h2>
            <p className="mt-3 text-neutral-400">Three steps to flexible rent with guaranteed payouts.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="card-surface relative p-6">
                <span className="text-4xl font-bold text-brand-600/30">{s.step}</span>
                <h3 className="mt-2 text-lg font-semibold text-brand-100">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="card-surface border-brand-500/30 bg-gradient-to-br from-brand-600/10 to-transparent p-10 sm:p-14">
            <BrandTagline className="mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to offer flexible rent?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-neutral-400">
              Create a landlord account in seconds, or explore the demo with pre-built tenant profiles.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/login" className="btn-gold px-8 py-3.5">
                Create landlord account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-outline-gold px-8 py-3.5">
                Try demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
