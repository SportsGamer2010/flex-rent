import { CreditCard, DollarSign, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type PaymentMethodType, type PublicPaymentOptions } from "../lib/api";
import { money } from "../lib/format";

type PaymentPayload = {
  method: PaymentMethodType;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  nameOnCard?: string;
};

export function PaymentMethodModal({
  open,
  title,
  amount,
  fee,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  amount: number;
  fee?: number;
  onClose: () => void;
  onSubmit: (payload: PaymentPayload) => Promise<void>;
}) {
  const [options, setOptions] = useState<PublicPaymentOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [method, setMethod] = useState<PaymentMethodType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    setError(null);
    setMethod(null);
    setCard({ nameOnCard: "", cardNumber: "", expiry: "", cvc: "" });
    api
      .paymentOptions()
      .then(setOptions)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load payment options"))
      .finally(() => setLoadingOptions(false));
  }, [open]);

  if (!open) return null;

  const total = amount + (fee ?? 0);
  const noMethods = options && !options.creditCardEnabled && !options.cashAppEnabled;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!method) {
      setError("Select a payment method.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (method === "credit_card") {
        await onSubmit({
          method,
          nameOnCard: card.nameOnCard,
          cardNumber: card.cardNumber,
          expiry: card.expiry,
          cvc: card.cvc,
        });
      } else {
        await onSubmit({ method });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card-surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-brand-100">{title}</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {money(amount)}
              {fee ? ` + ${money(fee)} fee` : ""} · Total {money(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-600/20 p-2 text-neutral-400 transition hover:text-brand-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loadingOptions && <p className="text-sm text-neutral-400">Loading payment options…</p>}

        {noMethods && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Payments are not configured yet. An admin must add receiving details at{" "}
            <a href="/admin/settings" className="underline">
              /admin/settings
            </a>
            .
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {options?.creditCardEnabled && (
              <button
                type="button"
                onClick={() => setMethod("credit_card")}
                className={`rounded-xl border p-4 text-left transition ${
                  method === "credit_card"
                    ? "border-brand-400 bg-brand-600/15"
                    : "border-brand-600/20 hover:border-brand-500/40"
                }`}
              >
                <CreditCard className="h-5 w-5 text-brand-400" />
                <p className="mt-2 font-medium text-brand-100">Credit card</p>
                <p className="mt-1 text-xs text-neutral-400">Pay securely with Visa, Mastercard, or Amex</p>
              </button>
            )}
            {options?.cashAppEnabled && (
              <button
                type="button"
                onClick={() => setMethod("cash_app")}
                className={`rounded-xl border p-4 text-left transition ${
                  method === "cash_app"
                    ? "border-brand-400 bg-brand-600/15"
                    : "border-brand-600/20 hover:border-brand-500/40"
                }`}
              >
                <DollarSign className="h-5 w-5 text-brand-400" />
                <p className="mt-2 font-medium text-brand-100">Cash App</p>
                <p className="mt-1 text-xs text-neutral-400">Send payment to {options.cashAppCashtag}</p>
              </button>
            )}
          </div>

          {method === "credit_card" && (
            <div className="grid gap-3 rounded-xl border border-brand-600/15 bg-surface-900/50 p-4">
              <label className="block text-sm text-neutral-400">
                Name on card
                <input
                  required
                  value={card.nameOnCard}
                  onChange={(e) => setCard({ ...card, nameOnCard: e.target.value })}
                  className="input-dark"
                  placeholder="Jane Doe"
                />
              </label>
              <label className="block text-sm text-neutral-400">
                Card number
                <input
                  required
                  inputMode="numeric"
                  value={card.cardNumber}
                  onChange={(e) => setCard({ ...card, cardNumber: e.target.value })}
                  className="input-dark"
                  placeholder="4242 4242 4242 4242"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-neutral-400">
                  Expiry
                  <input
                    required
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    className="input-dark"
                    placeholder="MM/YY"
                  />
                </label>
                <label className="block text-sm text-neutral-400">
                  Security code
                  <input
                    required
                    inputMode="numeric"
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                    className="input-dark"
                    placeholder="123"
                  />
                </label>
              </div>
            </div>
          )}

          {method === "cash_app" && options && (
            <div className="rounded-xl border border-brand-600/15 bg-surface-900/50 p-4 text-sm text-neutral-300">
              <p>
                Send <span className="font-semibold text-brand-100">{money(total)}</span> to{" "}
                <span className="font-semibold text-brand-100">{options.cashAppCashtag}</span> in Cash App, then
                confirm below.
              </p>
              <a
                href={`https://cash.app/${options.cashAppCashtag.replace(/^\$/, "")}/${total}`}
                target="_blank"
                rel="noreferrer"
                className="btn-outline-gold mt-4 w-full text-sm"
              >
                Open Cash App
              </a>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline-gold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !method || Boolean(noMethods)}
              className="btn-gold flex-1"
            >
              {submitting ? "Processing…" : method === "cash_app" ? "Confirm Cash App payment" : "Pay now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
