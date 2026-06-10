import { CheckCircle2, CreditCard } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, RiskBadge, StatCard } from "../components/Card";
import { PaymentMethodModal } from "../components/PaymentMethodModal";
import { StatusBadge } from "../components/StatusBadge";
import { UtilityBillSection } from "../components/UtilityBillSection";
import TenantOnboardingPage from "../pages/TenantOnboardingPage";
import { api, type TenantDashboard } from "../lib/api";
import { formatDate, money } from "../lib/format";

export default function TenantPage() {
  const [data, setData] = useState<TenantDashboard | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<{
    id: string;
    label: string;
    amount: number;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const dashboard = await api.tenantDashboard();
      setData(dashboard);
      setNeedsOnboarding(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      if (msg.includes("Onboarding")) {
        setNeedsOnboarding(true);
      } else {
        setMessage(msg);
      }
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handlePaySubmit(payload: {
    method: "credit_card" | "cash_app";
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
    nameOnCard?: string;
  }) {
    if (!paymentTarget) return;
    setPayingId(paymentTarget.id);
    setMessage(null);
    try {
      const res = await api.payInstallment(paymentTarget.id, payload);
      setMessage(res.message);
      setPaymentTarget(null);
      setTimeout(() => load(), 1500);
    } catch (e) {
      throw e;
    } finally {
      setPayingId(null);
    }
  }

  if (loading) return <p className="text-neutral-400">Loading dashboard…</p>;
  if (needsOnboarding) {
    return <TenantOnboardingPage onComplete={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;
  }
  if (!data) return <p className="text-rose-300">{message ?? "No data"}</p>;

  const { tenant, landlord, payments, fees, summary, utilityBills } = data;
  const firstPaid = payments.find((p) => p.installment === 1)?.status === "paid";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-100">
            Welcome back, {tenant.name}
          </h1>
          <p className="mt-1 text-neutral-400">
            Unit {tenant.unit} · {landlord?.name ?? "Your property"}
          </p>
        </div>
        <RiskBadge tier={summary.riskTier} />
      </div>

      {message && (
        <p className="rounded-xl border border-brand-600/30 bg-brand-600/10 px-4 py-3 text-sm text-brand-100">
          {message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monthly rent" value={money(summary.monthlyRent)} />
        <StatCard label="Split into" value={`${summary.splitCount} payments`} hint={`Credit score: ${summary.creditScore ?? "—"}`} />
        <StatCard
          label="Landlord status"
          value={summary.landlordPaidOnDueDate ? "Paid in full" : "Awaiting 1st payment"}
          hint="The Unleashed pays your landlord when you pay installment 1"
        />
        <StatCard
          label="Fees"
          value={money(fees.monthlyPaymentFees)}
          hint={
            fees.creditCheckFee > 0
              ? `${money(fees.perPayment)}/payment × ${fees.paymentCount} + ${money(fees.creditCheckFee)} credit check`
              : `${money(fees.perPayment)} per payment × ${fees.paymentCount}`
          }
        />
      </div>

      <Card
        title="Payment schedule"
        subtitle={
          summary.splitCount === 2
            ? "High-risk profile: rent split into 2 installments"
            : "Low/medium risk profile: rent split into 4 installments"
        }
      >
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-600/15 bg-surface-900/50 p-4"
            >
              <div>
                <p className="font-medium text-brand-100">{payment.label}</p>
                <p className="text-sm text-neutral-400">
                  Due {formatDate(payment.dueDate)} · {money(payment.amount)} rent + {money(fees.perPayment)} fee
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={payment.status} />
                {payment.status === "scheduled" && (
                  <button
                    onClick={() =>
                      setPaymentTarget({
                        id: payment.id,
                        label: payment.label,
                        amount: payment.amount,
                      })
                    }
                    disabled={payingId === payment.id}
                    className="btn-gold px-3 py-2 text-xs"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {payingId === payment.id ? "Processing…" : "Pay now"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <UtilityBillSection bills={utilityBills} onUpdate={load} />

      <PaymentMethodModal
        open={paymentTarget !== null}
        title={paymentTarget?.label ?? "Pay installment"}
        amount={paymentTarget?.amount ?? 0}
        fee={fees.perPayment}
        onClose={() => setPaymentTarget(null)}
        onSubmit={handlePaySubmit}
      />

      <Card title="How it works this month">
        <div className="grid gap-4 sm:grid-cols-3">
          <Step
            done={firstPaid}
            step="1"
            title="Pay 1st installment"
            text="The Unleashed uses this to pay your landlord in full on the due date."
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
            title={`Pay remaining ${summary.splitCount - 1} installment${summary.splitCount > 2 ? "s" : ""}`}
            text={`Repay The Unleashed from bank ••••${tenant.bankLast4} per your schedule.`}
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
    <div className="rounded-xl border border-brand-600/15 p-4">
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-brand-400" />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-600/30 text-xs font-bold text-brand-400">
            {step}
          </span>
        )}
        <p className="font-medium text-brand-100">{title}</p>
      </div>
      <p className="mt-2 text-sm text-neutral-400">{text}</p>
    </div>
  );
}
