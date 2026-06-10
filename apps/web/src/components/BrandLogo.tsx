import { Link } from "react-router-dom";
import { APP_DOMAIN, APP_TAGLINE, LOGO_MARK_PATH, LOGO_PATH } from "../lib/brand";

type LogoSize = "sm" | "md" | "lg" | "hero";

const imageHeights: Record<LogoSize, string> = {
  sm: "h-12",
  md: "h-16",
  lg: "h-28 sm:h-32",
  hero: "h-44 sm:h-56",
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
      className={`${imageHeights[size]} w-auto max-w-full object-contain [image-rendering:auto] ${className}`}
      decoding="async"
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
    <Link
      to={to}
      className="group inline-flex min-w-0 items-center gap-3 transition hover:opacity-95 sm:gap-3.5"
    >
      <img
        src={LOGO_MARK_PATH}
        alt=""
        aria-hidden
        width={262}
        height={175}
        decoding="async"
        className="h-12 w-auto shrink-0 object-contain drop-shadow-[0_0_14px_rgba(212,175,55,0.3)] sm:h-14 md:h-16"
      />
      <Wordmark className="truncate text-base leading-none sm:text-lg md:text-xl" />
    </Link>
  );
}
