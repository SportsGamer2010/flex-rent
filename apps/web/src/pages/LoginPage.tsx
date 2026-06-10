import { Building2, Shield, User, UserPlus } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import { LANDLORD_FEE_PER_PAYMENT } from "../lib/brand";
import { type UserRole } from "../lib/api";

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
    title: "Tenant (low risk)",
    description: "4-payment split, utility bills, completed onboarding.",
    icon: User,
  },
  {
    role: "tenant",
    email: "marcus@demo.com",
    title: "Tenant (high risk)",
    description: "2-payment split — see how risk tier affects schedule.",
    icon: User,
  },
  {
    role: "landlord",
    email: "owner@sunset.com",
    title: "Landlord",
    description: "View enrolled tenants, risk profiles, and guaranteed payouts.",
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

export default function LoginPage() {
  const { user, login, registerLandlord, registerTenant } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [signupTab, setSignupTab] = useState<SignupTab>("tenant");
  const [signupLoading, setSignupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [landlordForm, setLandlordForm] = useState({ name: "", email: "" });
  const [tenantForm, setTenantForm] = useState({ name: "", email: "" });

  if (user) return <Navigate to="/app" replace />;

  async function handleLogin(role: UserRole, email: string) {
    setLoading(email);
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
        <BrandLogo size="lg" to="/" className="mx-auto" />
        <p className="mt-6 text-sm text-neutral-500">
          Try demo accounts or create your own landlord or tenant profile.
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
            key={account.email}
            onClick={() => handleLogin(account.role, account.email)}
            disabled={loading !== null || signupLoading}
            className="flex items-start gap-4 rounded-2xl border border-brand-600/20 bg-surface-800/60 p-5 text-left transition hover:border-brand-500/40 hover:bg-surface-800 disabled:opacity-60"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-600/30 bg-brand-600/10 text-brand-200">
              <account.icon className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-lg font-semibold text-brand-100">{account.title}</span>
                <span className="text-xs text-neutral-500">{account.email}</span>
              </span>
              <span className="mt-1 block text-sm text-neutral-400">{account.description}</span>
              {loading === account.email && (
                <span className="mt-2 block text-sm text-brand-400">Signing in…</span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-10 card-surface p-6">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-brand-100">Create your account</h2>
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          Sign up as a tenant or landlord. Tenants enter property details and complete a soft credit
          check after registering.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSignupTab("tenant")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              signupTab === "tenant"
                ? "bg-brand-600 text-black"
                : "border border-brand-600/20 text-neutral-400 hover:text-brand-200"
            }`}
          >
            Tenant
          </button>
          <button
            type="button"
            onClick={() => setSignupTab("landlord")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              signupTab === "landlord"
                ? "bg-brand-600 text-black"
                : "border border-brand-600/20 text-neutral-400 hover:text-brand-200"
            }`}
          >
            Landlord
          </button>
        </div>

        {signupTab === "tenant" ? (
          <form onSubmit={handleTenantSignup} className="mt-6 space-y-4">
            <p className="rounded-xl border border-brand-600/20 bg-brand-600/5 px-4 py-3 text-sm text-neutral-300">
              After signing up, you&apos;ll enter your property details and pay a one-time $5 fee for
              the soft credit check to get your personalized payment plan.
            </p>
            <label className="block text-sm text-neutral-400">
              Your name
              <input
                required
                value={tenantForm.name}
                onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                placeholder="Jane Doe"
                className="input-dark"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Email
              <input
                required
                type="email"
                value={tenantForm.email}
                onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                placeholder="jane@example.com"
                className="input-dark"
              />
            </label>
            <button type="submit" disabled={signupLoading} className="btn-gold w-full">
              {signupLoading ? "Creating account…" : "Sign up as tenant"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLandlordSignup} className="mt-6 space-y-4">
            <label className="block text-sm text-neutral-400">
              Property / business name
              <input
                required
                value={landlordForm.name}
                onChange={(e) => setLandlordForm({ ...landlordForm, name: e.target.value })}
                placeholder="Sunset Apartments"
                className="input-dark"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              Email
              <input
                required
                type="email"
                value={landlordForm.email}
                onChange={(e) => setLandlordForm({ ...landlordForm, email: e.target.value })}
                placeholder="owner@example.com"
                className="input-dark"
              />
            </label>
            <p className="rounded-xl border border-brand-600/20 bg-brand-600/5 px-4 py-3 text-sm text-neutral-300">
              <span className="font-medium text-brand-200">Landlord pricing:</span> ${LANDLORD_FEE_PER_PAYMENT}{" "}
              per tenant payment — no signup fee, no monthly minimum.
            </p>
            <button type="submit" disabled={signupLoading} className="btn-gold w-full">
              {signupLoading ? "Creating account…" : "Create landlord account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
