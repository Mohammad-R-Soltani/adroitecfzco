import Link from "next/link";
import SalesLoginForm from "./SalesLoginForm";

export default function SalesLoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--mist)] px-6">
      {/* Deliberately a different colour from the catalog sign-in, so it is
          obvious at a glance which module you are entering. */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, #2dd4bf, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #0f766e, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-[var(--line)] bg-white/90 p-8 shadow-xl shadow-teal-900/5 backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f766e] text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M7 16V9M12 16V5M17 16v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="font-display text-xl font-semibold text-[var(--ink)]">Sales analysis</h1>
          <p className="text-sm text-[var(--ink-soft)]">Demand, stock movement and forecasting</p>
        </div>

        <SalesLoginForm />

        <p className="mt-6 border-t border-[var(--line)] pt-4 text-center text-[12px] text-[var(--ink-faint)]">
          Looking for device and chipset specs?{" "}
          <Link href="/login" className="font-medium text-[var(--signal)] hover:underline">
            Product desk sign-in
          </Link>
        </p>
      </div>
    </main>
  );
}
