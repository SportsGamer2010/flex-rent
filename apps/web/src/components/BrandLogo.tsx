import { Link } from "react-router-dom";
import { APP_DOMAIN, APP_TAGLINE, LOGO_PATH } from "../lib/brand";

type LogoSize = "sm" | "md" | "lg" | "hero";

const imageHeights: Record<LogoSize, string> = {
  sm: "h-8",
  md: "h-12",
  lg: "h-20",
  hero: "h-40 sm:h-52",
};

export function BrandLogo({
  size = "md",
  to,
  className = "",
}: {
  size?: LogoSize;
  to?: string;
  className?: string;
}) {
  const content = (
    <img
      src={LOGO_PATH}
      alt={APP_DOMAIN}
      className={`${imageHeights[size]} w-auto object-contain ${className}`}
    />
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex transition opacity-95 hover:opacity-100">
        {content}
      </Link>
    );
  }

  return content;
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <p className={`font-display lowercase tracking-tight ${className}`}>
      <span className="text-white">the</span>
      <span className="gold-gradient-text font-semibold">unleashed</span>
      <span className="text-white">.org</span>
    </p>
  );
}

export function BrandTagline({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-full max-w-md items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-500/70" />
      <p className="shrink-0 text-[0.65rem] font-semibold tracking-[0.35em] text-brand-400 sm:text-xs">
        {APP_TAGLINE}
      </p>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-500/70" />
    </div>
  );
}

export function HeaderLogo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="group inline-flex items-center transition hover:opacity-95">
      <img src={LOGO_PATH} alt={APP_DOMAIN} className="h-10 w-auto object-contain sm:h-11" />
    </Link>
  );
}
