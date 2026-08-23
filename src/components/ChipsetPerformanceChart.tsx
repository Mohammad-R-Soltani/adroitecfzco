import Link from "next/link";

export type PerfChipset = {
  id: string;
  slug: string;
  name: string;
  releaseYear: number;
  brand: { name: string; accent: string };
};

type RealBenchmark = { value: number; deviceName: string; sourceName: string; sourceUrl: string };

export default function ChipsetPerformanceChart({
  chipsets,
  rollup,
  highlightSlug,
  title = "Relative CPU power",
}: {
  chipsets: PerfChipset[];
  rollup: Record<string, RealBenchmark>;
  highlightSlug?: string;
  title?: string;
}) {
  const ranked = chipsets
    .map((c) => ({ ...c, real: rollup[c.id] ?? null }))
    .filter((c) => c.real)
    .sort((a, b) => b.real!.value - a.real!.value);

  const untested = chipsets.filter((c) => !rollup[c.id]);

  if (ranked.length === 0) return null;

  const max = ranked[0].real!.value;
  const brands = Array.from(new Map(ranked.map((c) => [c.brand.name, c.brand.accent])).entries());

  return (
    <div className="surface-card rounded-2xl border border-[var(--line)] p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-[var(--ink)]">{title}</h2>
        <div className="flex items-center gap-3">
          {brands.map(([name, accent]) => (
            <span key={name} className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {ranked.map((chipset) => {
          const score = chipset.real!.value;
          const widthPct = Math.max(6, Math.round((score / max) * 100));
          const isHighlighted = chipset.slug === highlightSlug;
          return (
            <Link
              key={chipset.id}
              href={`/chipsets/${chipset.slug}`}
              className={`group block rounded-lg px-1.5 py-1 transition ${
                isHighlighted ? "bg-[var(--signal)]/8 ring-1 ring-[var(--signal)]/30" : "hover:bg-[var(--mist)]"
              }`}
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span
                  className={`truncate text-xs font-medium ${
                    isHighlighted ? "text-[var(--signal)]" : "text-[var(--ink-soft)] group-hover:text-[var(--ink)]"
                  }`}
                >
                  {chipset.name}
                  <span className="ml-1.5 text-[10px] font-normal text-[var(--ink-faint)]">{chipset.releaseYear}</span>
                </span>
                <span className="spec-value shrink-0 text-[11px] font-semibold text-[var(--ink-soft)]">
                  {score.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--mist)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${widthPct}%`, background: chipset.brand.accent }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {untested.length > 0 && (
        <p className="mt-4 text-[11px] leading-relaxed text-[var(--ink-faint)]">
          <span className="font-semibold text-[var(--ink-soft)]">Not yet benchmarked: </span>
          {untested.map((c) => c.name).join(", ")}
        </p>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-faint)]">
        Best verified Geekbench 6 multi-core result among each chipset&apos;s devices in the
        catalog — sourced, not estimated.
      </p>
    </div>
  );
}
