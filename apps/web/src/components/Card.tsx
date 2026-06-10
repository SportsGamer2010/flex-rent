export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-surface p-5 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h2 className="text-lg font-semibold text-brand-100">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card-surface bg-gradient-to-br from-brand-600/15 via-surface-800 to-surface-900 p-5">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-brand-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export function RiskBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  const styles: Record<string, string> = {
    low: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    medium: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
    high: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${
        styles[tier] ?? "bg-neutral-500/15 text-neutral-300"
      }`}
    >
      {tier} risk
    </span>
  );
}
