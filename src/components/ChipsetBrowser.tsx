"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ChipsetListCard, { type ListChipset } from "./ChipsetListCard";

const BRAND_FILTERS = ["All", "Apple", "Xiaomi"] as const;

type RealBenchmark = { value: number; deviceName: string; sourceName: string; sourceUrl: string };

export default function ChipsetBrowser({
  chipsets,
  bookmarkedIds,
  rollup,
}: {
  chipsets: ListChipset[];
  bookmarkedIds: string[];
  rollup: Record<string, RealBenchmark>;
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<(typeof BRAND_FILTERS)[number]>("All");
  const bookmarked = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chipsets.filter((c) => {
      if (brand !== "All" && c.brand.name !== brand) return false;
      if (!q) return true;
      const haystack = [
        c.name,
        c.series,
        c.processNode,
        c.cpuSummary,
        c.gpuSummary,
        c.highlight,
        String(c.releaseYear),
        ...c.devices.map((d) => d.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [chipsets, query, brand]);

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-[var(--line)] bg-[var(--mist)]/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]"
            >
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a chipset, phone or spec…"
              className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-9 pr-9 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] shadow-sm outline-none transition focus:border-[var(--signal)] focus:ring-2 focus:ring-[var(--signal)]/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink-faint)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex shrink-0 gap-1 rounded-xl border border-[var(--line)] bg-white p-1 shadow-sm">
            {BRAND_FILTERS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBrand(b)}
                className={`relative rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  brand === b ? "text-white" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {brand === b && (
                  <motion.span
                    layoutId="brand-filter-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background:
                        b === "Xiaomi"
                          ? "var(--ember)"
                          : b === "Apple"
                            ? "var(--signal)"
                            : "var(--ink)",
                    }}
                    transition={{ type: "spring", damping: 26, stiffness: 340 }}
                  />
                )}
                <span className="relative">{b}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold text-[var(--ink)]">
          {query || brand !== "All" ? "Results" : "All chipsets"}
        </h2>
        <span className="spec-value text-xs text-[var(--ink-faint)]">
          {results.length} of {chipsets.length}
        </span>
      </div>

      {results.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-white/60 p-12 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold text-[var(--ink)]">No chipset matches &ldquo;{query}&rdquo;</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Try a device name, a series like &ldquo;A-series&rdquo;, or a year.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {results.map((chipset, i) => (
            <ChipsetListCard
              key={chipset.id}
              chipset={chipset}
              index={i}
              isBookmarked={bookmarked.has(chipset.id)}
              realBenchmark={rollup[chipset.id] ?? null}
            />
          ))}
        </div>
      )}
    </>
  );
}
