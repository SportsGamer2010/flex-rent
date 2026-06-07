import { useEffect, useState } from "react";
import { Card, StatCard } from "../components/Card";
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
  if (!data) return <p className="text-slate-400">Loading properties…</p>;

  const { landlord, tenants, payouts, stats } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{landlord.name}</h1>
        <p className="mt-1 text-slate-400">
          Payout account ••••{landlord.payoutAccountLast4} · Flex pays you in full on rent due dates
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Enrolled tenants" value={String(stats.enrolledTenants)} />
        <StatCard label="Monthly rent volume" value={money(stats.totalMonthlyRent)} />
        <StatCard label="On-time payout rate" value={`${stats.onTimePayoutRate}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Tenants using Flex" subtitle="Residents who split rent through the platform">
          <div className="space-y-3">
            {tenants.map((tenant) => (
              <div
                key={tenant.unit}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-4"
              >
                <div>
                  <p className="font-medium text-white">
                    {tenant.name} · Unit {tenant.unit}
                  </p>
                  <p className="text-sm text-slate-400">
                    {money(tenant.monthlyRent)}/mo
                    {tenant.secondPaymentDay
                      ? ` · 2nd payment on the ${tenant.secondPaymentDay}th`
                      : ""}
                  </p>
                </div>
                <StatusBadge status={tenant.enrolled ? "completed" : "pending"} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent payouts" subtitle="Full rent deposited on the due date">
          <div className="space-y-3">
            {payouts.map((payout, i) => (
              <div
                key={`${payout.unit}-${i}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-4"
              >
                <div>
                  <p className="font-medium text-white">
                    {payout.tenantName} · Unit {payout.unit}
                  </p>
                  <p className="text-sm text-slate-400">
                    {money(payout.amount)} · {formatDate(payout.paidOn)}
                  </p>
                </div>
                <StatusBadge status={payout.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Why property managers use Flex">
        <ul className="grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
          <li className="rounded-xl border border-white/10 p-4">
            <span className="font-medium text-white">Predictable cash flow</span>
            <p className="mt-1">Receive full rent on the 1st — no partial payments to track.</p>
          </li>
          <li className="rounded-xl border border-white/10 p-4">
            <span className="font-medium text-white">Happier residents</span>
            <p className="mt-1">Flexible pay schedules can improve renewals and satisfaction.</p>
          </li>
          <li className="rounded-xl border border-white/10 p-4">
            <span className="font-medium text-white">Zero integration lift</span>
            <p className="mt-1">Demo mode shows how non-integrated portals still work.</p>
          </li>
        </ul>
      </Card>
    </div>
  );
}
