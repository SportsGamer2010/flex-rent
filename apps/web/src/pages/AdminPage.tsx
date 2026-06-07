import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, StatCard } from "../components/Card";
import { api, type AdminOverview } from "../lib/api";
import { formatDateTime, money } from "../lib/format";

export default function AdminPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setData(await api.adminOverview());
  }, []);

  useEffect(() => {
    load().catch((e) => setMessage(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  async function handleReset() {
    setResetting(true);
    setMessage(null);
    try {
      const res = await api.resetDemo();
      setMessage(res.message);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  if (!data) return <p className="text-slate-400">Loading admin overview…</p>;

  const { stats, activity } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Platform overview</h1>
          <p className="mt-1 text-slate-400">Demo admin console for client presentations</p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-60"
        >
          <RotateCcw className={`h-4 w-4 ${resetting ? "animate-spin" : ""}`} />
          Reset demo data
        </button>
      </div>

      {message && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Tenants" value={String(stats.tenants)} />
        <StatCard label="Landlords" value={String(stats.landlords)} />
        <StatCard label="Enrolled" value={String(stats.enrolledTenants)} />
        <StatCard label="Payments completed" value={String(stats.paymentsCompleted)} />
        <StatCard label="Payments scheduled" value={String(stats.paymentsScheduled)} />
        <StatCard label="Volume processed" value={money(stats.volumeProcessed)} />
      </div>

      <Card title="Activity feed" subtitle="Recent events across the demo platform">
        <div className="space-y-3">
          {activity.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
          {activity.map((item, i) => (
            <div
              key={`${item.at}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0"
            >
              <p className="text-sm text-slate-300">{item.message}</p>
              <p className="text-xs text-slate-500">{formatDateTime(item.at)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
