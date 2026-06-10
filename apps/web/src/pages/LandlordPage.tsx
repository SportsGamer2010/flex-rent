import { useEffect, useState } from "react";
import { Card, RiskBadge, StatCard } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { LANDLORD_FEE_PER_PAYMENT } from "../lib/brand";
import { api, type LandlordDashboard } from "../lib/api";
import { formatDate, money } from "../lib/format";

export default function LandlordPage() {
  const [data, setData] = useState<LandlordDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .landlordDashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) return <p className="text-rose-300">{error}</p>;
  if (!data) return <p className="text-neutral-400">Loading portfolio…</p>;

  const { landlord, tenants, payouts, stats, fees } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-100">{landlord.name}</h1>
        <p className="mt-1 text-neutral-400">
          Payout account ••••{landlord.payoutAccountLast4} · The Unleashed pays you in full on every rent due date
        </p>
        <p className="mt-2 text-sm text-brand-300/80">
          Platform fee: {money(LANDLORD_FEE_PER_PAYMENT)} per tenant payment processed
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Enrolled tenants" value={String(stats.enrolledTenants)} />
        <StatCard label="Pending onboarding" value={String(stats.pendingOnboarding)} />
        <StatCard label="Monthly rent volume" value={money(stats.totalMonthlyRent)} />
        <StatCard
          label="Platform fees"
          value={money(fees.monthlyTotal)}
          hint={`${money(fees.perPayment)} × ${fees.totalPayments} payments/mo`}
        />
        <StatCard label="On-time payout rate" value={`${stats.onTimePayoutRate}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Tenants" subtitle="Risk-based payment plans and platform fees per unit">
          <div className="space-y-3">
            {tenants.length === 0 && (
              <p className="text-sm text-neutral-500">No tenants yet. Share your property link to invite residents.</p>
            )}
            {tenants.map((tenant) => (
              <div
                key={tenant.unit}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-600/15 bg-surface-900/50 p-4"
              >
                <div>
                  <p className="font-medium text-brand-100">
                    {tenant.name} · Unit {tenant.unit}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {money(tenant.monthlyRent)}/mo
                    {tenant.onboardingComplete
                      ? ` · ${tenant.splitCount}-payment split`
                      : " · Onboarding in progress"}
                    {tenant.creditScore ? ` · Score ${tenant.creditScore}` : ""}
                  </p>
                  {tenant.fees.paymentCount > 0 && (
                    <p className="mt-1 text-xs text-brand-400/90">
                      Platform fee: {money(tenant.fees.perPayment)}/payment × {tenant.fees.paymentCount} ={" "}
                      {money(tenant.fees.total)}/mo
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {tenant.riskTier && <RiskBadge tier={tenant.riskTier} />}
                  <StatusBadge
                    status={tenant.onboardingComplete ? (tenant.enrolled ? "completed" : "pending") : "processing"}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent payouts" subtitle="Full rent deposited on the due date">
          <div className="space-y-3">
            {payouts.map((payout, i) => (
              <div
                key={`${payout.unit}-${i}`}
                className="flex items-center justify-between rounded-xl border border-brand-600/15 bg-surface-900/50 p-4"
              >
                <div>
                  <p className="font-medium text-brand-100">
                    {payout.tenantName} · Unit {payout.unit}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {money(payout.amount)} · {formatDate(payout.paidOn)}
                  </p>
                </div>
                <StatusBadge status={payout.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Landlord pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-600/15 p-4">
            <p className="text-2xl font-bold text-brand-400">{money(LANDLORD_FEE_PER_PAYMENT)}</p>
            <p className="mt-1 text-sm font-medium text-brand-100">Per payment processed</p>
            <p className="mt-2 text-xs text-neutral-500">
              Charged for each tenant installment collected through the platform.
            </p>
          </div>
          <div className="rounded-xl border border-brand-600/15 p-4">
            <p className="text-2xl font-bold text-brand-400">{money(fees.monthlyTotal)}</p>
            <p className="mt-1 text-sm font-medium text-brand-100">Your monthly total</p>
            <p className="mt-2 text-xs text-neutral-500">
              Based on {fees.totalPayments} active payment{fees.totalPayments === 1 ? "" : "s"} across enrolled tenants.
            </p>
          </div>
          <div className="rounded-xl border border-brand-600/15 p-4">
            <p className="text-2xl font-bold text-brand-400">$0</p>
            <p className="mt-1 text-sm font-medium text-brand-100">Signup fee</p>
            <p className="mt-2 text-xs text-neutral-500">
              Create your landlord account free — pay only when tenant payments are processed.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Why landlords choose The Unleashed">
        <ul className="grid gap-3 text-sm text-neutral-400 sm:grid-cols-3">
          <li className="rounded-xl border border-brand-600/15 p-4">
            <span className="font-medium text-brand-100">Guaranteed full rent</span>
            <p className="mt-1">Receive 100% of rent on the 1st — we handle tenant installment collection.</p>
          </li>
          <li className="rounded-xl border border-brand-600/15 p-4">
            <span className="font-medium text-brand-100">Smart risk assessment</span>
            <p className="mt-1">Soft credit checks and rental history verify each tenant before enrollment.</p>
          </li>
          <li className="rounded-xl border border-brand-600/15 p-4">
            <span className="font-medium text-brand-100">Simple pricing</span>
            <p className="mt-1">{money(LANDLORD_FEE_PER_PAYMENT)} per payment — no hidden fees, no monthly minimum.</p>
          </li>
        </ul>
      </Card>
    </div>
  );
}
