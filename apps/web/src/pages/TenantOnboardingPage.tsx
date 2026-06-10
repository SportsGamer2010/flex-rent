import { Building2, CheckCircle2, Circle, Home, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { api, type TenantOnboarding } from "../lib/api";
import { SOFT_CREDIT_CHECK_FEE } from "../lib/brand";
import { money } from "../lib/format";

export default function TenantOnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [data, setData] = useState<TenantOnboarding | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [propertyForm, setPropertyForm] = useState({
    landlordId: "",
    unit: "",
    propertyAddress: "",
    monthlyRent: "",
  });

  const [creditForm, setCreditForm] = useState({
    fullLegalName: "",
    dateOfBirth: "",
    ssnLast4: "",
    annualIncome: "",
  });

  const [historyForm, setHistoryForm] = useState({
    previousAddress: "",
    landlordName: "",
    landlordPhone: "",
    landlordEmail: "",
    monthlyRent: "",
    moveInDate: "",
    moveOutDate: "",
    reasonForLeaving: "",
  });

  const load = useCallback(async () => {
    const onboarding = await api.tenantOnboarding();
    setData(onboarding);
    if (onboarding.steps.complete) onComplete();

    if (onboarding.tenant.propertySetupComplete) {
      setPropertyForm({
        landlordId: onboarding.landlord?.id ?? "",
        unit: onboarding.tenant.unit,
        propertyAddress: onboarding.tenant.propertyAddress,
        monthlyRent: String(onboarding.tenant.monthlyRent),
      });
    } else if (onboarding.landlords.length > 0) {
      setPropertyForm((f) => (f.landlordId ? f : { ...f, landlordId: onboarding.landlords[0].id }));
    }

    setCreditForm((f) =>
      f.fullLegalName ? f : { ...f, fullLegalName: onboarding.tenant.name },
    );
  }, [onComplete]);

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [load]);

  async function handlePropertySubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.submitTenantProperty({
        landlordId: propertyForm.landlordId,
        unit: propertyForm.unit,
        propertyAddress: propertyForm.propertyAddress,
        monthlyRent: Number(propertyForm.monthlyRent),
      });
      setMessage("Property saved. Continue with your soft credit check.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save property");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreditCheck(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.submitCreditCheck({
        fullLegalName: creditForm.fullLegalName,
        dateOfBirth: creditForm.dateOfBirth,
        ssnLast4: creditForm.ssnLast4,
        annualIncome: Number(creditForm.annualIncome),
      });
      setMessage(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credit check failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRentalHistory(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.submitRentalHistory({
        previousAddress: historyForm.previousAddress,
        landlordName: historyForm.landlordName,
        landlordPhone: historyForm.landlordPhone,
        landlordEmail: historyForm.landlordEmail,
        monthlyRent: Number(historyForm.monthlyRent),
        moveInDate: historyForm.moveInDate,
        moveOutDate: historyForm.moveOutDate,
        reasonForLeaving: historyForm.reasonForLeaving,
      });
      setMessage("Rental history submitted. Setting up your payment schedule…");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-neutral-400">Loading onboarding…</p>;
  if (!data) return <p className="text-rose-300">{error ?? "No data"}</p>;

  const { tenant, creditCheck, steps, landlords } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-100">Welcome, {tenant.name}</h1>
        <p className="mt-2 text-neutral-400">
          Complete the steps below to set up your property, run a soft credit check, and unlock your
          rent payment plan.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StepIndicator done={steps.property} label="Your property" step={1} />
        <StepIndicator done={steps.creditCheck} label="Soft credit check" step={2} />
        <StepIndicator done={steps.rentalHistory} label="Rental history" step={3} />
        <StepIndicator done={steps.complete} label="Payment schedule" step={4} />
      </div>

      {message && (
        <p className="rounded-xl border border-brand-600/30 bg-brand-600/10 px-4 py-3 text-sm text-brand-100">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!steps.property && (
        <Card
          title="Your property"
          subtitle="Tell us where you rent so we can link you to your landlord and monthly rent amount"
        >
          {landlords.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No landlords are registered yet. Ask your property manager to create a landlord account
              first, then return here to finish setup.
            </p>
          ) : (
            <form onSubmit={handlePropertySubmit} className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-neutral-400 sm:col-span-2">
                Property / landlord
                <select
                  required
                  value={propertyForm.landlordId}
                  onChange={(e) => setPropertyForm({ ...propertyForm, landlordId: e.target.value })}
                  className="input-dark"
                >
                  <option value="">Select your property</option>
                  {landlords.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-neutral-400">
                Unit number
                <input
                  required
                  value={propertyForm.unit}
                  onChange={(e) => setPropertyForm({ ...propertyForm, unit: e.target.value })}
                  className="input-dark"
                  placeholder="4B"
                />
              </label>
              <label className="block text-sm text-neutral-400">
                Monthly rent ($)
                <input
                  required
                  type="number"
                  min={100}
                  step={50}
                  value={propertyForm.monthlyRent}
                  onChange={(e) => setPropertyForm({ ...propertyForm, monthlyRent: e.target.value })}
                  className="input-dark"
                  placeholder="1500"
                />
              </label>
              <label className="block text-sm text-neutral-400 sm:col-span-2">
                Property address
                <input
                  required
                  value={propertyForm.propertyAddress}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, propertyAddress: e.target.value })
                  }
                  className="input-dark"
                  placeholder="100 Main St, City, ST 12345"
                />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" disabled={submitting} className="btn-gold w-full sm:w-auto">
                  <Home className="h-4 w-4" />
                  {submitting ? "Saving…" : "Save property details"}
                </button>
              </div>
            </form>
          )}
        </Card>
      )}

      {steps.property && !steps.creditCheck && (
        <Card
          title="Soft credit check"
          subtitle={`A one-time $${SOFT_CREDIT_CHECK_FEE} soft inquiry fee applies. Results determine your risk profile — high risk splits into 2 payments; low and medium risk split into 4.`}
        >
          <p className="mb-4 rounded-xl border border-brand-600/15 bg-surface-900/50 px-4 py-3 text-sm text-neutral-300">
            <Building2 className="mb-1 inline h-4 w-4 text-brand-400" /> Unit {tenant.unit} ·{" "}
            {money(tenant.monthlyRent)}/mo at {tenant.propertyAddress}
          </p>
          <form onSubmit={handleCreditCheck} className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-neutral-400 sm:col-span-2">
              Full legal name
              <input
                required
                value={creditForm.fullLegalName}
                onChange={(e) => setCreditForm({ ...creditForm, fullLegalName: e.target.value })}
                className="input-dark"
                placeholder="Jane Doe"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Date of birth
              <input
                required
                type="date"
                value={creditForm.dateOfBirth}
                onChange={(e) => setCreditForm({ ...creditForm, dateOfBirth: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              SSN (last 4 digits)
              <input
                required
                maxLength={4}
                pattern="\d{4}"
                value={creditForm.ssnLast4}
                onChange={(e) => setCreditForm({ ...creditForm, ssnLast4: e.target.value })}
                className="input-dark"
                placeholder="1234"
              />
            </label>
            <label className="block text-sm text-neutral-400 sm:col-span-2">
              Annual income ($)
              <input
                required
                type="number"
                min={0}
                value={creditForm.annualIncome}
                onChange={(e) => setCreditForm({ ...creditForm, annualIncome: e.target.value })}
                className="input-dark"
                placeholder="65000"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="mb-3 rounded-xl border border-brand-600/20 bg-brand-600/5 px-4 py-3 text-sm text-neutral-300">
                A <span className="font-medium text-brand-200">{money(SOFT_CREDIT_CHECK_FEE)}</span> one-time
                fee will be charged when you run the soft credit check. This is not a hard inquiry and
                will not affect your credit score.
              </p>
              <button type="submit" disabled={submitting} className="btn-gold w-full sm:w-auto">
                <ShieldCheck className="h-4 w-4" />
                {submitting ? "Processing…" : `Pay ${money(SOFT_CREDIT_CHECK_FEE)} & run soft credit check`}
              </button>
            </div>
          </form>
        </Card>
      )}

      {steps.property && steps.creditCheck && creditCheck && (
        <Card title="Credit profile" subtitle="Your risk tier determines your rent split schedule">
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-brand-600/20 bg-surface-900/60 p-4">
            <div>
              <p className="text-sm text-neutral-400">Credit score</p>
              <p className="text-2xl font-bold text-brand-100">{creditCheck.score}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Risk tier</p>
              <p className="text-lg font-semibold capitalize text-brand-200">{creditCheck.riskTier}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Payment split</p>
              <p className="text-lg font-semibold text-brand-100">{tenant.splitCount} payments</p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Rent payment fee</p>
              <p className="text-lg font-semibold text-brand-100">
                ${tenant.splitCount === 2 ? "10" : "5"}/payment
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Credit check fee</p>
              <p className="text-lg font-semibold text-brand-100">{money(creditCheck.fee)}</p>
            </div>
          </div>
        </Card>
      )}

      {steps.creditCheck && !steps.rentalHistory && (
        <Card title="Rental history" subtitle="Provide your previous rental details for verification">
          <form onSubmit={handleRentalHistory} className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-neutral-400 sm:col-span-2">
              Previous address
              <input
                required
                value={historyForm.previousAddress}
                onChange={(e) => setHistoryForm({ ...historyForm, previousAddress: e.target.value })}
                className="input-dark"
                placeholder="123 Main St, City, ST 12345"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Previous landlord name
              <input
                required
                value={historyForm.landlordName}
                onChange={(e) => setHistoryForm({ ...historyForm, landlordName: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Landlord phone
              <input
                required
                value={historyForm.landlordPhone}
                onChange={(e) => setHistoryForm({ ...historyForm, landlordPhone: e.target.value })}
                className="input-dark"
                placeholder="(555) 555-0100"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Landlord email
              <input
                required
                type="email"
                value={historyForm.landlordEmail}
                onChange={(e) => setHistoryForm({ ...historyForm, landlordEmail: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Monthly rent paid ($)
              <input
                required
                type="number"
                min={0}
                value={historyForm.monthlyRent}
                onChange={(e) => setHistoryForm({ ...historyForm, monthlyRent: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Move-in date
              <input
                required
                type="date"
                value={historyForm.moveInDate}
                onChange={(e) => setHistoryForm({ ...historyForm, moveInDate: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Move-out date
              <input
                required
                type="date"
                value={historyForm.moveOutDate}
                onChange={(e) => setHistoryForm({ ...historyForm, moveOutDate: e.target.value })}
                className="input-dark"
              />
            </label>
            <label className="block text-sm text-neutral-400 sm:col-span-2">
              Reason for leaving
              <textarea
                required
                rows={3}
                value={historyForm.reasonForLeaving}
                onChange={(e) => setHistoryForm({ ...historyForm, reasonForLeaving: e.target.value })}
                className="input-dark resize-none"
                placeholder="Relocated for work, lease ended, etc."
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={submitting} className="btn-gold w-full sm:w-auto">
                {submitting ? "Submitting…" : "Submit rental history"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

function StepIndicator({ done, label, step }: { done: boolean; label: string; step: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-600/20 bg-surface-800/60 p-4">
      {done ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400" />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-neutral-600" />
      )}
      <div>
        <p className="text-xs text-neutral-500">Step {step}</p>
        <p className="text-sm font-medium text-brand-100">{label}</p>
      </div>
    </div>
  );
}