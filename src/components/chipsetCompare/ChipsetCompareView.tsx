"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SLOT_COLORS } from "@/lib/compareColors";
import ChipsetPicker, { type PickerChipset } from "./ChipsetPicker";

const KIND_LABEL: Record<string, string> = {
  MOBILE_SOC: "Mobile SoC",
  LAPTOP_SOC: "Laptop SoC",
  WEARABLE_SOC: "Wearable SoC",
  AUDIO_CHIP: "Audio chip",
};

export type CompareSpecSource = {
  sourceName: string;
  sourceUrl: string;
  summary: string;
};

export type CompareChipset = PickerChipset & {
  brandAccent: string;
  kind: string;
  processNode: string;
  cpuSummary: string;
  gpuSummary: string;
  npuSummary: string | null;
  maxRam: string | null;
  highlight: string;
  competitiveEdge: string | null;
  competitiveEdgeSourceName: string | null;
  competitiveEdgeSourceUrl: string | null;
  strengthTag: string | null;
  bestBenchmark: { value: number; deviceName: string; sourceName: string; sourceUrl: string } | null;
  specSources: CompareSpecSource[];
};

const MAX_SLOTS = 3;

const SPEC_ROWS: { label: string; key: keyof CompareChipset }[] = [
  { label: "Process node", key: "processNode" },
  { label: "CPU", key: "cpuSummary" },
  { label: "GPU", key: "gpuSummary" },
  { label: "Neural engine / NPU", key: "npuSummary" },
  { label: "Max memory", key: "maxRam" },
];

export default function ChipsetCompareView({
  allChipsets,
  selected,
}: {
  allChipsets: PickerChipset[];
  selected: CompareChipset[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);

  const setSlugs = useCallback(
    (slugs: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slugs.length) params.set("c", slugs.join(","));
      else params.delete("c");
      router.replace(`/chipsets/compare?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const addChipset = (chipset: PickerChipset) => {
    const next = [...selected.map((c) => c.slug), chipset.slug].slice(0, MAX_SLOTS);
    setPickerOpen(false);
    setSlugs(next);
  };

  const removeChipset = (slug: string) => {
    setSlugs(selected.filter((c) => c.slug !== slug).map((c) => c.slug));
  };

  const availableChipsets = useMemo(
    () => allChipsets.filter((c) => !selected.some((s) => s.slug === c.slug)),
    [allChipsets, selected],
  );

  const columns = selected.length || 1;

  if (selected.length === 0) {
    return (
      <>
        <EmptyState onAdd={() => setPickerOpen(true)} />
        <AnimatePresence>
          {pickerOpen && (
            <ChipsetPicker chipsets={availableChipsets} onPick={addChipset} onClose={() => setPickerOpen(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  const benchmarkValues = selected.map((c) => c.bestBenchmark?.value ?? null);
  const presentBenchmarks = benchmarkValues.filter((v): v is number => v != null);
  const maxBenchmark = presentBenchmarks.length ? Math.max(...presentBenchmarks) : 0;
  const bestBenchmark = presentBenchmarks.length ? Math.max(...presentBenchmarks) : null;
  const benchmarksAllSame = new Set(presentBenchmarks).size === 1;

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 border-b border-[var(--line)] bg-white/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div
          className="grid gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(columns + (selected.length < MAX_SLOTS ? 1 : 0), MAX_SLOTS)}, minmax(0, 1fr))`,
          }}
        >
          {selected.map((chipset, i) => (
            <motion.div
              key={chipset.slug}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface-card relative flex flex-col items-center rounded-2xl border border-[var(--line)] p-2.5 text-center shadow-sm"
            >
              <span
                className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                style={{ background: SLOT_COLORS[i % SLOT_COLORS.length] }}
              />
              <button
                type="button"
                onClick={() => removeChipset(chipset.slug)}
                aria-label={`Remove ${chipset.name}`}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--ink-faint)] transition hover:bg-red-50 hover:text-red-500"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>

              <div
                className="mt-1.5 flex h-16 w-16 items-center justify-center rounded-xl text-xl font-bold text-white sm:h-20 sm:w-20"
                style={{ background: `linear-gradient(150deg, ${chipset.gradientFrom}, ${chipset.gradientTo})` }}
              >
                {chipset.name.charAt(0)}
              </div>

              <Link
                href={`/chipsets/${chipset.slug}`}
                className="mt-2 line-clamp-2 text-[12.5px] font-bold leading-tight text-[var(--ink)] hover:text-[var(--signal)] sm:text-sm"
              >
                {chipset.name}
              </Link>
              <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-[var(--ink-faint)]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: chipset.brandAccent }} />
                <span className="line-clamp-1">
                  {chipset.brandName} · {chipset.series} · {chipset.releaseYear}
                </span>
              </p>
            </motion.div>
          ))}

          {selected.length < MAX_SLOTS && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--line)] text-[var(--ink-faint)] transition hover:border-[var(--signal)]/50 hover:bg-[var(--signal)]/5 hover:text-[var(--signal)]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] font-semibold">Add chipset</span>
            </button>
          )}
        </div>
      </div>

      {/* Verified performance — the one quantifiable, sourced comparison */}
      <section className="mt-6">
        <h2 className="font-display mb-3 text-sm font-bold text-[var(--ink)]">Verified performance</h2>
        <div className="surface-card rounded-2xl border border-[var(--line)] p-3 shadow-sm">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            Geekbench 6 · multi-core
          </p>
          <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {selected.map((chipset, i) => {
              const value = chipset.bestBenchmark?.value ?? null;
              const isBest = value != null && value === bestBenchmark && !benchmarksAllSame && selected.length > 1;
              const pct = value != null && maxBenchmark > 0 ? Math.max(6, Math.round((value / maxBenchmark) * 100)) : 0;
              const color = SLOT_COLORS[i % SLOT_COLORS.length];
              return (
                <div key={chipset.slug}>
                  <div className="mb-1 flex items-baseline gap-1.5">
                    <span className="spec-value text-sm font-bold" style={{ color: isBest ? color : "var(--ink)" }}>
                      {value != null ? value.toLocaleString() : "—"}
                    </span>
                    {isBest && (
                      <span
                        className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white"
                        style={{ background: color }}
                      >
                        Best
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--mist)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                  {chipset.bestBenchmark ? (
                    <a
                      href={chipset.bestBenchmark.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-1 block truncate text-[10px] text-[var(--ink-faint)] hover:text-[var(--signal)]"
                    >
                      {chipset.bestBenchmark.deviceName} · {chipset.bestBenchmark.sourceName}
                    </a>
                  ) : (
                    <p className="mt-1 text-[10px] text-[var(--ink-faint)]">Not yet benchmarked</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Competitive edge — the plain-language "why this one's leading" the trade actually asks for */}
      <section className="mt-8">
        <h2 className="font-display mb-3 text-sm font-bold text-[var(--ink)]">Competitive edge</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {selected.map((chipset) => (
            <div key={chipset.slug} className="surface-card rounded-2xl border border-[var(--line)] p-3.5 shadow-sm">
              <p className="mb-1.5 text-[11px] font-bold text-[var(--ink)]">{chipset.name}</p>
              {chipset.strengthTag && (
                <span className="mb-2 inline-block rounded-full bg-[var(--signal)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--signal)]">
                  Leads in: {chipset.strengthTag}
                </span>
              )}
              {chipset.competitiveEdge ? (
                <>
                  <p className="text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{chipset.competitiveEdge}</p>
                  {chipset.competitiveEdgeSourceUrl && (
                    <a
                      href={chipset.competitiveEdgeSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-2 inline-block text-[10.5px] font-medium text-[var(--signal)] hover:underline"
                    >
                      Source: {chipset.competitiveEdgeSourceName ?? "link"}
                    </a>
                  )}
                </>
              ) : (
                <p className="text-[12px] italic text-[var(--ink-faint)]">
                  Not documented yet — no sourced competitive-edge note on file for this chip.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Technical specification */}
      <section className="mt-8">
        <h2 className="font-display mb-3 text-sm font-bold text-[var(--ink)]">Technical specification</h2>
        <div className="surface-card overflow-hidden rounded-2xl border border-[var(--line)] shadow-sm">
          <div className="divide-y divide-[var(--line)]">
            <div className="px-3 py-2.5">
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                Category
              </p>
              <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                {selected.map((chipset) => (
                  <p key={chipset.slug} className="text-[12px] leading-relaxed text-[var(--ink)]">
                    {KIND_LABEL[chipset.kind] ?? chipset.kind}
                  </p>
                ))}
              </div>
            </div>
            {SPEC_ROWS.map((row) => {
              const anyPresent = selected.some((c) => c[row.key]);
              if (!anyPresent) return null;
              return (
                <div key={row.label} className="px-3 py-2.5">
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                    {row.label}
                  </p>
                  <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                    {selected.map((chipset) => (
                      <p key={chipset.slug} className="text-[12px] leading-relaxed text-[var(--ink)]">
                        {chipset[row.key] ? String(chipset[row.key]) : <span className="text-[var(--ink-faint)]">—</span>}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cross-outlet sourcing — what independent sites/vendor pages actually say */}
      <section className="mt-8">
        <h2 className="font-display mb-3 text-sm font-bold text-[var(--ink)]">What each source says</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {selected.map((chipset) => (
            <div key={chipset.slug} className="surface-card rounded-2xl border border-[var(--line)] p-3.5 shadow-sm">
              <p className="mb-2 text-[11px] font-bold text-[var(--ink)]">{chipset.name}</p>
              {chipset.specSources.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                  {chipset.specSources.map((s) => (
                    <li key={s.sourceUrl} className="text-[12px] leading-relaxed text-[var(--ink-soft)]">
                      <p>{s.summary}</p>
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-[10.5px] font-medium text-[var(--signal)] hover:underline"
                      >
                        {s.sourceName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] italic text-[var(--ink-faint)]">No independent sources logged yet.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {pickerOpen && (
          <ChipsetPicker chipsets={availableChipsets} onPick={addChipset} onClose={() => setPickerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-[var(--line)] bg-white/60 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--signal)]/10 text-[var(--signal)]">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <rect x="7" y="7" width="10" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2 className="font-display text-lg font-bold text-[var(--ink)]">Compare up to three chipsets</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[var(--ink-soft)]">
        Put the silicon itself side by side — verified performance, the technical spec sheet,
        and why each one leads, every claim traceable to a named source.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--signal)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--signal-deep)]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Add the first chipset
      </button>
    </div>
  );
}
