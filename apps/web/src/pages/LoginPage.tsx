import { Building2, Shield, User, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type UserRole } from "../lib/api";
import { APP_NAME } from "../lib/brand";

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
    email: "admin@theunleashed.app",
    title: "Admin",
    description: "Platform overview, activity feed, and demo reset.",
    icon: Shield,
  },
];

type SignupTab = "landlord" | "tenant";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500/50";

export default function LoginPage() {
  const { user, login, registerLandlord, registerTenant } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [signupTab, setSignupTab] = useState<SignupTab>("tenant");
  const [signupLoading, setSignupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landlords, setLandlords] = useState<Array<{ id: string; name: string }>>([]);

  const [landlordForm, setLandlordForm] = useState({ name: "", email: "" });
  const [tenantForm, setTenantForm] = useState({
    name: "",
    email: "",
    landlordId: "",
    unit: "",
    monthlyRent: "1500",
    secondPaymentDay: "15",
  });

  useEffect(() => {
    api
      .listLandlords()
      .then(({ landlords: list }) => {
        setLandlords(list);
        if (list.length > 0) {
          setTenantForm((f) => (f.landlordId ? f : { ...f, landlordId: list[0].id }));
        }
      })
      .catch(() => setLandlords([]));
  }, []);

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

  async function handleLandlordSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupLoading(true);
    setError(null);
    try {
      await registerLandlord(landlordForm.name, landlordForm.email);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setSignupLoading(false);
    }
  }

  async function handleTenantSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupLoading(true);
    setError(null);
    try {
      await registerTenant({
        name: tenantForm.name,
        email: tenantForm.email,
        landlordId: tenantForm.landlordId,
        unit: tenantForm.unit,
        monthlyRent: Number(tenantForm.monthlyRent),
        secondPaymentDay: Number(tenantForm.secondPaymentDay),
      });
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">{APP_NAME}</h1>
        <p className="mt-2 text-slate-400">
          Try the demo accounts below, or create your own tenant or landlord account.
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
            disabled={loading !== null || signupLoading}
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

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-accent-400" />
          <h2 className="text-lg font-semibold text-white">Create your own account</h2>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          No password needed — sign in instantly after creating an account.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSignupTab("tenant")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              signupTab === "tenant"
                ? "bg-brand-600 text-white"
                : "border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            Tenant
          </button>
          <button
            type="button"
            onClick={() => setSignupTab("landlord")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              signupTab === "landlord"
                ? "bg-brand-600 text-white"
                : "border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            Landlord
          </button>
        </div>

        {signupTab === "landlord" ? (
          <form onSubmit={handleLandlordSignup} className="mt-6 space-y-4">
            <label className="block text-sm text-slate-400">
              Property / business name
              <input
                required
                value={landlordForm.name}
                onChange={(e) => setLandlordForm({ ...landlordForm, name: e.target.value })}
                placeholder="Sunset Apartments"
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-slate-400">
              Email
              <input
                required
                type="email"
                value={landlordForm.email}
                onChange={(e) => setLandlordForm({ ...landlordForm, email: e.target.value })}
                placeholder="owner@example.com"
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={signupLoading}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {signupLoading ? "Creating account…" : "Create landlord account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTenantSignup} className="mt-6 space-y-4">
            <label className="block text-sm text-slate-400">
              Your name
              <input
                required
                value={tenantForm.name}
                onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-slate-400">
              Email
              <input
                required
                type="email"
                value={tenantForm.email}
                onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                placeholder="jane@example.com"
                className={inputClass}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-400">
                Unit
                <input
                  required
                  value={tenantForm.unit}
                  onChange={(e) => setTenantForm({ ...tenantForm, unit: e.target.value })}
                  placeholder="4B"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm text-slate-400">
                Monthly rent ($)
                <input
                  required
                  type="number"
                  min={100}
                  step={50}
                  value={tenantForm.monthlyRent}
                  onChange={(e) => setTenantForm({ ...tenantForm, monthlyRent: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block text-sm text-slate-400">
              Landlord / property
              <select
                required
                value={tenantForm.landlordId}
                onChange={(e) => setTenantForm({ ...tenantForm, landlordId: e.target.value })}
                className={inputClass}
              >
                {landlords.length === 0 && (
                  <option value="">Create a landlord account first</option>
                )}
                {landlords.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-400">
              2nd payment day of month
              <input
                type="number"
                min={5}
                max={28}
                value={tenantForm.secondPaymentDay}
                onChange={(e) => setTenantForm({ ...tenantForm, secondPaymentDay: e.target.value })}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={signupLoading || landlords.length === 0}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {signupLoading ? "Creating account…" : "Create tenant account"}
            </button>
            {landlords.length === 0 && (
              <p className="text-center text-xs text-slate-500">
                Switch to the Landlord tab and create a property first.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
