const styles: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  scheduled: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  processing: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  failed: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${
        styles[status] ?? "bg-slate-500/15 text-slate-300 ring-slate-500/30"
      }`}
    >
      {status}
    </span>
  );
}
