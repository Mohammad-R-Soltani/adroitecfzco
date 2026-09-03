import LoginForm from "./LoginForm";
import SalesLoginForm from "./SalesLoginForm";
import Logomark from "@/components/Logomark";

/**
 * One door with two entrances. Both modules are shown side by side so a user
 * picks the one they need rather than discovering the other exists by
 * accident — but they remain separate sign-ins, and the sales side still
 * refuses an account that holds no grant for it.
 *
 * The backdrop is a silicon die: concentric rings for the package, a grid of
 * cores, and contact pads down the edges. It is drawn rather than an image so
 * it stays crisp at any size and costs nothing to load.
 */
export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0b1220] px-5 py-12">
      <DieBackdrop />

      {/* Warm the two module colours into the corners so each side of the page
          belongs to the card in front of it. */}
      <div
        className="pointer-events-none absolute -left-48 top-1/4 h-[34rem] w-[34rem] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #0071e3, transparent 68%)" }}
      />
      <div
        className="pointer-events-none absolute -right-48 bottom-0 h-[34rem] w-[34rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #14b8a6, transparent 68%)" }}
      />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-10 flex flex-col items-center gap-2.5 text-center">
          <Logomark size={46} />
          <h1 className="font-display text-2xl font-semibold text-white">adroitecfzco</h1>
          <p className="text-sm text-white/55">Choose the module you need</p>
        </div>

        {/* items-stretch + h-full makes both cards the height of the taller
            one, so an error message on one side cannot leave them ragged. */}
        <div className="grid grid-cols-1 items-stretch gap-7 md:grid-cols-2 lg:gap-10">
          <ModuleCard
            accent="#0071e3"
            title="Product desk"
            description="Device and chipset specs, benchmarks and comparisons."
            icon={
              <>
                <rect x="7" y="7" width="10" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M10 3v2.6M14 3v2.6M10 18.4V21M14 18.4V21M3 10h2.6M3 14h2.6M18.4 10H21M18.4 14H21"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </>
            }
          >
            <LoginForm />
          </ModuleCard>

          <ModuleCard
            accent="#0f766e"
            title="Sales analysis"
            badge="Confidential"
            description="Demand, stock movement and forecasting. Needs its own access grant."
            icon={
              <>
                <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M7 16V9M12 16V5M17 16v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </>
            }
          >
            <SalesLoginForm />
          </ModuleCard>
        </div>
      </div>
    </main>
  );
}

function ModuleCard({
  accent,
  title,
  description,
  badge,
  icon,
  children,
}: {
  accent: string;
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-8">
      <span className="mb-5 block h-1 w-12 rounded-full" style={{ background: accent }} />

      <div className="mb-6 flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: accent }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            {icon}
          </svg>
        </span>
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 font-display text-base font-bold text-[var(--ink)]">
            {title}
            {badge && (
              <span
                className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
                style={{ background: `${accent}1a`, color: accent }}
              >
                {badge}
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{description}</p>
        </div>
      </div>

      {/* Pushes the form to the bottom so both cards' buttons line up even
          when one description wraps to more lines than the other. */}
      <div className="mt-auto">{children}</div>
    </section>
  );
}

function DieBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 h-[130vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.16]"
      viewBox="0 0 400 400"
      fill="none"
    >
      <defs>
        <linearGradient id="die-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5ac8fa" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>

      {/* package rings */}
      {[190, 160, 130].map((size, i) => (
        <rect
          key={size}
          x={200 - size / 2}
          y={200 - size / 2}
          width={size}
          height={size}
          rx={8 + i * 2}
          stroke="url(#die-edge)"
          strokeWidth={0.8}
        />
      ))}

      {/* core grid on the die */}
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 6 }).map((__, col) => (
          <rect
            key={`${row}-${col}`}
            x={143 + col * 19}
            y={143 + row * 19}
            width={13}
            height={13}
            rx={2}
            stroke="url(#die-edge)"
            strokeWidth={0.6}
          />
        )),
      )}

      {/* contact pads running off each edge */}
      {Array.from({ length: 14 }).map((_, i) => {
        const p = 108 + i * 14;
        return (
          <g key={p} stroke="url(#die-edge)" strokeWidth={0.7} strokeLinecap="round">
            <path d={`M${p} 105 V 60`} />
            <path d={`M${p} 295 V 340`} />
            <path d={`M105 ${p} H 60`} />
            <path d={`M295 ${p} H 340`} />
          </g>
        );
      })}
    </svg>
  );
}
