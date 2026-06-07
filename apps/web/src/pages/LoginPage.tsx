import { Building2, Shield, User } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../lib/api";

const demoAccounts: Array<{
  role: UserRole;
  email: string;
  title: string;
  description: string;
  icon: typeof User;
}> = [
  {
    role: "tenant",
    email: "jane@demo.com",
    title: "Tenant",
    description: "Split $2,000 rent, pay installments, reschedule 2nd payment.",
    icon: User,
  },
  {
    role: "landlord",
    email: "owner@sunset.com",
    title: "Landlord",
    description: "See enrolled tenants and guaranteed on-time payouts.",
    icon: Building2,
  },
  {
    role: "admin",
    email: "admin@flex.local",
    title: "Admin",
    description: "Platform overview, activity feed, and demo reset.",
    icon: Shield,
  },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/app" replace />;

  async function handleLogin(role: UserRole, email: string) {
    setLoading(role);
    setError(null);
    try {
      await login(role, email);
      navigate("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Demo sign-in</h1>
        <p className="mt-2 text-slate-400">
          Choose a role to explore the app. No password needed for local demos.
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-4">
        {demoAccounts.map((account) => (
          <button
            key={account.role}
            onClick={() => handleLogin(account.role, account.email)}
            disabled={loading !== null}
            className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-brand-500/40 hover:bg-white/[0.05] disabled:opacity-60"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/20 text-brand-100">
              <account.icon className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-lg font-semibold text-white">{account.title}</span>
                <span className="text-xs text-slate-500">{account.email}</span>
              </span>
              <span className="mt-1 block text-sm text-slate-400">{account.description}</span>
              {loading === account.role && (
                <span className="mt-2 block text-sm text-accent-400">Signing in…</span>
              )}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Demo mode — no password required
      </p>
    </div>
  );
}
