import { Building2, CreditCard, DollarSign, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { api, type PlatformPaymentSettings } from "../lib/api";

const emptySettings: PlatformPaymentSettings = {
  businessName: "The Unleashed",
  bankName: "",
  accountHolderName: "",
  routingNumber: "",
  accountNumber: "",
  cashAppCashtag: "",
  creditCardEnabled: true,
  cashAppEnabled: true,
  configuredAt: null,
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<PlatformPaymentSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .adminPaymentSettings()
      .then((res) => setForm(res.settings))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.saveAdminPaymentSettings(form);
      setForm(res.settings);
      setMessage(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-neutral-400">Loading payment settings…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-bold text-brand-100">Payment receiving settings</h1>
        <p className="mt-2 text-neutral-400">
          Configure where tenant payments are received. This page is publicly accessible for demo
          setup — secure it before production.
        </p>
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

      <form onSubmit={handleSave} className="space-y-6">
        <Card title="Business profile" subtitle="Shown to tenants during Cash App payments">
          <label className="block text-sm text-neutral-400">
            Business name
            <input
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="input-dark"
            />
          </label>
        </Card>

        <Card
          title="Bank deposit details"
          subtitle="Required to accept credit card payments — funds settle to this account"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-neutral-400 sm:col-span-2">
              Account holder name
              <input
                value={form.accountHolderName}
                onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                className="input-dark"
                placeholder="The Unleashed LLC"
              />
            </label>
            <label className="block text-sm text-neutral-400 sm:col-span-2">
              Bank name
              <input
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="input-dark"
                placeholder="Chase, Wells Fargo, etc."
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Routing number
              <input
                inputMode="numeric"
                value={form.routingNumber}
                onChange={(e) => setForm({ ...form, routingNumber: e.target.value })}
                className="input-dark"
                placeholder="021000021"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Account number
              <input
                inputMode="numeric"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="input-dark"
                placeholder="1234567890"
              />
            </label>
          </div>
        </Card>

        <Card title="Cash App receiving" subtitle="Tenants send rent and utility payments to this cashtag">
          <label className="block text-sm text-neutral-400">
            Cash App cashtag
            <input
              value={form.cashAppCashtag}
              onChange={(e) => setForm({ ...form, cashAppCashtag: e.target.value })}
              className="input-dark"
              placeholder="$TheUnleashed"
            />
          </label>
        </Card>

        <Card title="Enabled payment methods" subtitle="Choose which options tenants see at checkout">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-brand-600/15 bg-surface-900/50 p-4">
              <input
                type="checkbox"
                checked={form.creditCardEnabled}
                onChange={(e) => setForm({ ...form, creditCardEnabled: e.target.checked })}
                className="h-4 w-4 accent-brand-500"
              />
              <div>
                <p className="flex items-center gap-2 font-medium text-brand-100">
                  <CreditCard className="h-4 w-4" />
                  Credit card
                </p>
                <p className="text-xs text-neutral-400">Requires bank deposit details above</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-brand-600/15 bg-surface-900/50 p-4">
              <input
                type="checkbox"
                checked={form.cashAppEnabled}
                onChange={(e) => setForm({ ...form, cashAppEnabled: e.target.checked })}
                className="h-4 w-4 accent-brand-500"
              />
              <div>
                <p className="flex items-center gap-2 font-medium text-brand-100">
                  <DollarSign className="h-4 w-4" />
                  Cash App
                </p>
                <p className="text-xs text-neutral-400">Requires cashtag above</p>
              </div>
            </label>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            {form.configuredAt
              ? `Last saved ${new Date(form.configuredAt).toLocaleString()}`
              : "Not saved yet"}
          </p>
          <button type="submit" disabled={saving} className="btn-gold">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save receiving settings"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-brand-600/15 bg-surface-900/40 p-4 text-sm text-neutral-400">
        <p className="flex items-center gap-2 font-medium text-brand-100">
          <Building2 className="h-4 w-4" />
          Demo note
        </p>
        <p className="mt-2">
          Card and Cash App flows are simulated for presentations. No real charges are processed, but
          tenants must pick a method and complete the form to mark a payment as paid.
        </p>
      </div>
    </div>
  );
}
