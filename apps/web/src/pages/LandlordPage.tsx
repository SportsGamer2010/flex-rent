import { useEffect, useState } from "react";
import { Card, RiskBadge, StatCard } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
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

  const { landlord, tenants, payouts, stats } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-display text-3xl font-bold text-brand-100">{landlord.name}</h1>
        <p className="mt-1 text-neutral-400">
          Payout account ••••{landlord.payoutAccountLast4} · FlexRent pays you in full on every rent due date
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled tenants" value={String(stats.enrolledTenants)} />
        <StatCard label="Pending onboarding" value={String(stats.pendingOnboarding)} />
        <StatCard label="Monthly rent volume" value={money(stats.totalMonthlyRent)} />
        <StatCard label="On-time payout rate" value={`${stats.onTimePayoutRate}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Tenants" subtitle="Risk-based payment plans for each resident">
          <div className="space-y-3">
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

      <Card title="Why landlords choose FlexRent">
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
            <span className="font-medium text-brand-100">Utility bill management</span>
            <p className="mt-1">Tenants pay utilities through the platform — fewer delinquencies for you.</p>
          </li>
        </ul>
      </Card>
    </div>
  );
}
