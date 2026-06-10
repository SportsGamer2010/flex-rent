import { CreditCard, FileUp, Zap } from "lucide-react";
import { useState } from "react";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { api, type UtilityBill } from "../lib/api";
import { formatDate, money } from "../lib/format";

export function UtilityBillSection({
  bills,
  onUpdate,
}: {
  bills: UtilityBill[];
  onUpdate: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    provider: "",
    amount: "",
    dueDate: "",
    file: null as File | null,
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!form.file) {
      setError("Please upload your utility bill");
      return;
    }
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("provider", form.provider);
      fd.append("amount", form.amount);
      fd.append("dueDate", form.dueDate);
      fd.append("billFile", form.file);
      const res = await api.uploadUtilityBill(fd);
      setMessage(res.message);
      setForm({ provider: "", amount: "", dueDate: "", file: null });
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handlePay(billId: string) {
    setPayingId(billId);
    setError(null);
    try {
      const res = await api.payUtilityBill(billId);
      setMessage(res.message);
      setTimeout(onUpdate, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <Card
      title="Utility bill service"
      subtitle="Upload your utility bills and pay them through FlexRent — one less portal to manage"
    >
      {message && (
        <p className="mb-4 rounded-xl border border-brand-600/30 bg-brand-600/10 px-4 py-3 text-sm text-brand-100">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <form onSubmit={handleUpload} className="mb-6 grid gap-4 rounded-xl border border-brand-600/15 bg-surface-900/50 p-4 sm:grid-cols-2">
        <label className="block text-sm text-neutral-400">
          Utility provider
          <input
            required
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
            className="input-dark"
            placeholder="ConEd, PG&E, etc."
          />
        </label>
        <label className="block text-sm text-neutral-400">
          Amount due ($)
          <input
            required
            type="number"
            min={1}
            step={0.01}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="input-dark"
          />
        </label>
        <label className="block text-sm text-neutral-400">
          Due date
          <input
            required
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="input-dark"
          />
        </label>
        <label className="block text-sm text-neutral-400">
          Upload bill (PDF or image)
          <input
            required
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
            className="mt-1 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600/20 file:px-3 file:py-2 file:text-brand-100"
          />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={uploading} className="btn-gold">
            <FileUp className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload bill"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {bills.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-brand-600/20 p-6 text-neutral-500">
            <Zap className="h-5 w-5 text-brand-600" />
            <p className="text-sm">No utility bills uploaded yet.</p>
          </div>
        )}
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-600/15 bg-surface-900/50 p-4"
          >
            <div>
              <p className="font-medium text-brand-100">{bill.provider}</p>
              <p className="text-sm text-neutral-400">
                {money(bill.amount)} · Due {formatDate(bill.dueDate)} · {bill.fileName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={bill.status} />
              {bill.status === "pending" && (
                <button
                  onClick={() => handlePay(bill.id)}
                  disabled={payingId === bill.id}
                  className="btn-gold px-3 py-2 text-xs"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {payingId === bill.id ? "Processing…" : "Pay bill"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
