import Link from "next/link";
import { logout } from "@/app/actions";

/**
 * The sales module's own shell. Every page under it also calls into salesDal,
 * which re-checks access on each query — this layout is the visible boundary,
 * not the security one.
 */
export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--line)] bg-white/85 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/sales" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f766e] text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M4 19h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                <path d="M7 16V9M12 16V5M17 16v-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight text-[var(--ink)]">
              Sales analysis
            </span>
          </Link>
          <span className="hidden rounded-full bg-[#0f766e]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0f766e] sm:inline">
            Confidential
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[12px] font-medium text-[var(--ink-soft)] transition hover:text-[var(--signal)]"
          >
            Product desk →
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-[12px] font-medium text-[var(--ink-soft)] transition hover:border-red-300 hover:text-red-600"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {children}
    </div>
  );
}
