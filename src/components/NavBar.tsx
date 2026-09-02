"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/actions";
import Logomark from "./Logomark";

const NAV_ITEMS = [
  { href: "/", label: "Feed", hint: "Newest chipsets", icon: "feed", color: "#0071e3" },
  { href: "/devices", label: "Devices", hint: "Every device", icon: "catalog", color: "#7c5cfc" },
  { href: "/chipsets", label: "Chipsets", hint: "Market trends & specs", icon: "chip", color: "#0891b2" },
  { href: "/insights", label: "Insights", hint: "Value & uplift charts", icon: "insights", color: "#d4553f" },
  { href: "/compare", label: "Compare", hint: "Power rankings", icon: "compare", color: "#1baf7a" },
  { href: "/learn", label: "Learn", hint: "Chip basics & talking points", icon: "learn", color: "#6b7f3a" },
  { href: "/me", label: "Profile", hint: "Your saved chips", icon: "profile", color: "#ec4a8a" },
] as const;

const ADMIN_ITEM = { href: "/admin", label: "Admin", hint: "Users & content", icon: "admin", color: "#e39400" } as const;

export default function NavBar({
  displayName,
  role,
  jobTitle,
}: {
  displayName: string;
  role: "ADMIN" | "STAFF";
  jobTitle?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const items = role === "ADMIN" ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--line)] bg-white/80 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ink-soft)] transition hover:bg-[var(--mist)] hover:text-[var(--ink)]"
          >
            <Icon name="menu" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Logomark size={28} />
            <span className="font-display hidden text-[15px] font-bold tracking-tight text-[var(--ink)] sm:inline">
              adroitecfzco
            </span>
          </Link>
        </div>

        <Link
          href="/me"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--signal)] to-[var(--glow)] text-xs font-bold text-white transition hover:opacity-90"
        >
          {displayName.charAt(0).toUpperCase()}
        </Link>
      </header>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Main menu" className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="drawer-scrim absolute inset-0 bg-[var(--ink)]/45 backdrop-blur-[3px]"
          />

          <nav className="drawer-panel absolute inset-y-0 left-0 flex w-[280px] flex-col overflow-hidden bg-white shadow-2xl">
            {/* Graphic header — silicon die motif */}
            <div className="relative shrink-0 overflow-hidden bg-[#0b1220] px-5 pb-5 pt-5 text-white">
              <div
                className="mesh-drift pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-70 blur-2xl"
                style={{ background: "radial-gradient(circle, #0071e3, transparent 70%)" }}
              />
              <div
                className="mesh-drift pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full opacity-50 blur-2xl"
                style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)", animationDelay: "-6s" }}
              />
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
                aria-hidden
              >
                <defs>
                  <pattern id="drawer-grid" width="26" height="26" patternUnits="userSpaceOnUse">
                    <path d="M26 0H0v26" fill="none" stroke="white" strokeWidth="0.6" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#drawer-grid)" />
              </svg>

              <div className="relative flex items-start justify-between">
                <div>
                  <Logomark size={34} />
                  <p className="font-display mt-2.5 text-[17px] font-bold leading-none">adroitecfzco</p>
                  <p className="mt-1.5 text-[11px] font-medium text-white/55">
                    Apple &amp; Xiaomi product desk
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 transition hover:bg-[var(--mist)]"
                    style={active ? { background: `${item.color}12` } : undefined}
                  >
                    {active && (
                      <span
                        className="absolute inset-y-2 left-0 w-[3px] rounded-r-full"
                        style={{ background: item.color }}
                      />
                    )}
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-105"
                      style={
                        active
                          ? { background: item.color, color: "#fff" }
                          : { background: `${item.color}14`, color: item.color }
                      }
                    >
                      <Icon name={item.icon} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block text-sm font-semibold"
                        style={{ color: active ? item.color : "var(--ink)" }}
                      >
                        {item.label}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--ink-faint)]">{item.hint}</span>
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="shrink-0 border-t border-[var(--line)] p-3">
              <div className="mb-1 flex items-center gap-3 rounded-xl bg-[var(--mist)] px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--signal)] to-[var(--glow)] text-xs font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">{displayName}</p>
                  <p className="truncate text-[11px] text-[var(--ink-faint)]">
                    {jobTitle || (role === "ADMIN" ? "Administrator" : "Team member")}
                  </p>
                </div>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ink-soft)] transition hover:bg-[var(--mist)] hover:text-[var(--ink)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--mist)]">
                    <Icon name="logout" />
                  </span>
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function Icon({ name }: { name: string }) {
  const common = "h-[18px] w-[18px] shrink-0";
  switch (name) {
    case "menu":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "close":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "feed":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <path d="M4 6h10M4 12h16M4 18h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="19" cy="6" r="1.6" fill="currentColor" />
        </svg>
      );
    case "catalog":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <rect x="4" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
          <rect x="13" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
          <rect x="4" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
          <rect x="13" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "learn":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <path
            d="M4 5.5A1.5 1.5 0 015.5 4H10a2 2 0 012 2v13a2 2 0 00-2-1.6H4V5.5z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M20 5.5A1.5 1.5 0 0018.5 4H14a2 2 0 00-2 2v13a2 2 0 012-1.6h6V5.5z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "insights":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <path d="M4 19h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path
            d="M5 15l4.5-5 3.5 3 5.5-7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9.5" cy="10" r="1.5" fill="currentColor" />
          <circle cx="18.5" cy="6" r="1.5" fill="currentColor" />
        </svg>
      );
    case "chip":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <rect x="7" y="7" width="10" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M9 3v2.4M12 3v2.4M15 3v2.4M9 18.6V21M12 18.6V21M15 18.6V21M3 9h2.4M3 12h2.4M3 15h2.4M18.6 9H21M18.6 12H21M18.6 15H21"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "compare":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <path d="M6 20V10M12 20V4M18 20v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4.8 19.5a7.2 7.2 0 0114.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <path
            d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "logout":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common}>
          <path
            d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 00-2 2v12a2 2 0 002 2h6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
