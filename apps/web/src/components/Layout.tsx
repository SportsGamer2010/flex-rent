import { Building2, Crown, LogOut, ShieldCheck } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { APP_NAME, APP_TAGLINE } from "../lib/brand";

const navByRole = {
  tenant: [{ to: "/app", label: "Dashboard" }],
  landlord: [{ to: "/app", label: "Portfolio" }],
  admin: [{ to: "/app", label: "Overview" }],
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-900">
        <header className="border-b border-brand-600/20 bg-surface-900/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-600/40 bg-brand-600/10">
                <Crown className="h-5 w-5 text-brand-400" />
              </span>
              <div>
                <p className="font-serif-display text-lg font-semibold text-brand-100">{APP_NAME}</p>
                <p className="text-xs text-neutral-500">{APP_TAGLINE}</p>
              </div>
            </Link>
            <Link to="/login" className="btn-outline-gold text-sm">
              Sign in
            </Link>
          </div>
        </header>
        {children}
      </div>
    );
  }

  const nav = navByRole[user.role];

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="sticky top-0 z-50 border-b border-brand-600/20 bg-surface-900/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/app" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-600/40 bg-brand-600/10">
              {user.role === "landlord" ? (
                <Building2 className="h-5 w-5 text-brand-400" />
              ) : user.role === "admin" ? (
                <ShieldCheck className="h-5 w-5 text-brand-400" />
              ) : (
                <Crown className="h-5 w-5 text-brand-400" />
              )}
            </span>
            <div className="hidden sm:block">
              <p className="font-serif-display font-semibold text-brand-100">{APP_NAME}</p>
              <p className="text-xs capitalize text-neutral-500">{user.role} portal</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-brand-600/20 text-brand-100"
                      : "text-neutral-400 hover:text-brand-200"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-brand-50">{user.name}</p>
              <p className="text-xs capitalize text-neutral-500">{user.role}</p>
            </div>
            <button
              onClick={() => logout()}
              className="btn-outline-gold px-3 py-2 text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
