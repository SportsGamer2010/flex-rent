import { Calendar, CheckCircle2, CreditCard, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, StatCard } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { api, type TenantDashboard } from "../lib/api";
import { formatDate, money } from "../lib/format";

export default function TenantPage() {
  const [data, setData] = useState<TenantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [secondDay, setSecondDay] = useState(15);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const dashboard = await api.tenantDashboard();
    setData(dashboard);
    if (dashboard.tenant.secondPaymentDay) setSecondDay(dashboard.tenant.secondPaymentDay);
  }, []);

  useEffect(() => {
    load()
      .catch((e) => setMessage(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [load]);

  async function handlePay(paymentId: string) {
    setPayingId(paymentId);
    setMessage(null);
    try {
      const res = await api.payInstallment(paymentId);
      setMessage(res.message);
      setTimeout(() => load(), 1500);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPayingId(null);
    }
  }

  async function handleScheduleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await api.updateSchedule(secondDay);
      setMessage(`2nd payment rescheduled to the ${secondDay}th.`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update schedule");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-400">Loading dashboard…</p>;
  if (!data) return <p className="text-rose-300">{message ?? "No data"}</p>;

  const { tenant, landlord, payments, fees, summary } = data;
  const firstPaid = payments.find((p) => p.installment === 1)?.status === "paid";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, {tenant.name}</h1>
        <p className="mt-1 text-slate-400">
          Unit {tenant.unit} · {landlord?.name ?? "Your property"}
        </p>
      </div>

      {message && (
        <p className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          {message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monthly rent" value={money(summary.monthlyRent)} />
        <StatCard label="Split into" value={`${summary.splitCount} payments`} />
        <StatCard
          label="Landlord status"
          value={summary.landlordPaidOnDueDate ? "Paid in full" : "Awaiting 1st payment"}
          hint="Flex pays landlord when you pay installment 1"
        />
        <StatCard label="Monthly fees" value={money(fees.total)} hint="Membership + 1% bill fee" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Payment schedule" subtitle="Your rent is split into two equal installments">
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4"
              >
                <div>
                  <p className="font-medium text-white">{payment.label}</p>
                  <p className="text-sm text-slate-400">
                    Due {formatDate(payment.dueDate)} · {money(payment.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={payment.status} />
                  {payment.status === "scheduled" && (
                    <button
                      onClick={() => handlePay(payment.id)}
                      disabled={payingId === payment.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
                    >
                      <CreditCard className="h-4 w-4" />
                      {payingId === payment.id ? "Processing…" : "Pay now"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="2nd payment date"
          subtitle="Pick a date later in the month that fits your pay schedule"
        >
          <div className="flex items-end gap-4">
            <label className="flex-1">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="h-4 w-4" />
                Day of month
              </span>
              <input
                type="range"
                min={5}
                max={28}
                value={secondDay}
                onChange={(e) => setSecondDay(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <p className="mt-2 text-center text-2xl font-semibold text-white">{secondDay}</p>
            </label>
          </div>
          <button
            onClick={handleScheduleSave}
            disabled={saving}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} />
            Update schedule
          </button>
        </Card>
      </div>

      <Card title="How it works this month">
        <div className="grid gap-4 sm:grid-cols-3">
          <Step
            done={firstPaid}
            step="1"
            title="Pay 1st installment"
            text="Flex uses this to pay your landlord in full on the due date."
          />
          <Step
            done={summary.landlordPaidOnDueDate}
            step="2"
            title="Landlord receives full rent"
            text={`$${tenant.monthlyRent} sent to ${landlord?.name ?? "property"} on the 1st.`}
          />
          <Step
            done={payments.every((p) => p.status === "paid")}
            step="3"
            title="Pay 2nd installment"
            text={`Repay Flex by the ${tenant.secondPaymentDay ?? secondDay}th from bank ••••${tenant.bankLast4}.`}
          />
        </div>
      </Card>
    </div>
  );
}

function Step({
  step,
  title,
  text,
  done,
}: {
  step: string;
  title: string;
  text: string;
  done: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
            {step}
          </span>
        )}
        <p className="font-medium text-white">{title}</p>
      </div>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}
