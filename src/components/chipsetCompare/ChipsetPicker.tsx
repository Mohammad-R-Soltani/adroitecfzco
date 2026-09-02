"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export type PickerChipset = {
  id: string;
  slug: string;
  name: string;
  series: string;
  releaseYear: number;
  gradientFrom: string;
  gradientTo: string;
  brandName: string;
};

export default function ChipsetPicker({
  chipsets,
  onPick,
  onClose,
}: {
  chipsets: PickerChipset[];
  onPick: (chipset: PickerChipset) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = chipsets.filter(
      (c) => !q || `${c.name} ${c.series} ${c.brandName}`.toLowerCase().includes(q),
    );
    const byBrand = new Map<string, PickerChipset[]>();
    for (const c of matches) {
      const list = byBrand.get(c.brandName) ?? [];
      list.push(c);
      byBrand.set(c.brandName, list);
    }
    return [...byBrand.entries()];
  }, [chipsets, query]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add a chipset to compare"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
    >
      <motion.button
        type="button"
        aria-label="Close chipset picker"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[var(--ink)]/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: "100%", opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        className="relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[80dvh] sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--line)] sm:hidden" />

        <div className="shrink-0 border-b border-[var(--line)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[var(--ink)]">Add a chipset</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chipset picker"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-faint)] transition hover:bg-[var(--mist)] hover:text-[var(--ink)]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chipsets…"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--mist)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none transition focus:border-[var(--signal)] focus:bg-white focus:ring-2 focus:ring-[var(--signal)]/15"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {grouped.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-[var(--ink-soft)]">
              No chipset matches &ldquo;{query}&rdquo;.
            </p>
          )}
          {grouped.map(([brand, list]) => (
            <div key={brand} className="mb-4 last:mb-0">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
                {brand}
              </p>
              <div className="flex flex-col gap-1">
                {list.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onPick(c)}
                    className="flex items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[var(--mist)]"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                      style={{ background: `linear-gradient(150deg, ${c.gradientFrom}, ${c.gradientTo})` }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">{c.name}</p>
                      <p className="truncate text-[11px] text-[var(--ink-faint)]">
                        {c.series} · {c.releaseYear}
                      </p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[var(--ink-faint)]">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
