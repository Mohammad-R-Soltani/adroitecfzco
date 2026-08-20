import Link from "next/link";

export type PerfChipset = {
  id: string;
  slug: string;
  name: string;
  releaseYear: number;
  geekbenchMultiCore: number | null;
  brand: { name: string; accent: string };
};

export default function ChipsetPerformanceChart({
  chipsets,
  highlightSlug,
  title = "Relative CPU power",
}: {
  chipsets: PerfChipset[];
  highlightSlug?: string;
  title?: string;
}) {
  const ranked = chipsets
    .filter((c) => c.geekbenchMultiCore != null)
    .sort((a, b) => (b.geekbenchMultiCore ?? 0) - (a.geekbenchMultiCore ?? 0));

  if (ranked.length === 0) return null;

  const max = Math.max(...ranked.map((c) => c.geekbenchMultiCore ?? 0));
  const brands = Array.from(new Map(ranked.map((c) => [c.brand.name, c.brand.accent])).entries());

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
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
          const score = chipset.geekbenchMultiCore ?? 0;
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

      <p className="mt-4 text-[11px] leading-relaxed text-[var(--ink-faint)]">
        Approximate Geekbench 6 multi-core scores, for relative comparison only — actual
        results vary by device, cooling and software version.
      </p>
    </div>
  );
}
