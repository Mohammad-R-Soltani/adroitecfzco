import LoginForm from "./LoginForm";
import SalesLoginForm from "@/app/sales/login/SalesLoginForm";
import Logomark from "@/components/Logomark";

/**
 * One door with two entrances. Both modules are shown side by side so a user
 * picks the one they need rather than discovering the other exists by
 * accident — but they remain separate sign-ins, and the sales side still
 * refuses an account that holds no grant for it.
 */
export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--mist)] px-5 py-10">
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full opacity-45 blur-3xl"
        style={{ background: "radial-gradient(circle, #5ac8fa, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #2dd4bf, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Logomark size={44} />
          <h1 className="font-display text-xl font-semibold text-[var(--ink)]">adroitecfzco</h1>
          <p className="text-sm text-[var(--ink-soft)]">Choose the module you need</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Product desk */}
          <section className="rounded-3xl border border-[var(--line)] bg-white/90 p-7 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--signal)] text-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <rect x="7" y="7" width="10" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M10 3v2.6M14 3v2.6M10 18.4V21M14 18.4V21M3 10h2.6M3 14h2.6M18.4 10H21M18.4 14H21"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-[var(--ink)]">Product desk</h2>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">
                  Device and chipset specs, benchmarks and comparisons.
                </p>
              </div>
            </div>

            <LoginForm />
          </section>

          {/* Sales analysis */}
          <section className="rounded-3xl border border-[var(--line)] bg-white/90 p-7 shadow-xl shadow-teal-900/5 backdrop-blur-xl">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f766e] text-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M7 16V9M12 16V5M17 16v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 className="flex flex-wrap items-center gap-2 font-display text-base font-bold text-[var(--ink)]">
                  Sales analysis
                  <span className="rounded-full bg-[#0f766e]/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[#0f766e]">
                    Confidential
                  </span>
                </h2>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">
                  Demand, stock movement and forecasting. Needs its own access grant.
                </p>
              </div>
            </div>

            <SalesLoginForm />
          </section>
        </div>
      </div>
    </main>
  );
}
