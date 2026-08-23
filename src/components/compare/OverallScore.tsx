"use client";

import { motion } from "framer-motion";
import { SLOT_COLORS } from "@/lib/compareColors";
import type { WinTally } from "@/lib/compareWins";

export default function OverallScore({
  devices,
  tally,
  totalCategories,
}: {
  devices: { slug: string; name: string }[];
  tally: WinTally[];
  totalCategories: number;
}) {
  if (totalCategories === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/60 p-6 text-center">
        <p className="text-sm font-semibold text-[var(--ink)]">Not enough overlapping data yet</p>
        <p className="mt-1 text-[12px] text-[var(--ink-soft)]">
          Add a device with matching specs or benchmarks to see who wins where.
        </p>
      </div>
    );
  }

  const bySlug = new Map(tally.map((t) => [t.slug, t]));
  const maxWins = Math.max(...tally.map((t) => t.wins));
  const ranked = [...devices].sort((a, b) => (bySlug.get(b.slug)?.wins ?? 0) - (bySlug.get(a.slug)?.wins ?? 0));

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-gradient-to-br from-white to-[var(--signal)]/[0.04] p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="font-display text-sm font-bold text-[var(--ink)]">Overall — category wins</p>
        <span className="text-[10.5px] text-[var(--ink-faint)]">{totalCategories} comparable categories</span>
      </div>

      <div className="flex flex-col gap-3">
        {ranked.map((device) => {
          const t = bySlug.get(device.slug);
          const wins = t?.wins ?? 0;
          const i = devices.findIndex((d) => d.slug === device.slug);
          const color = SLOT_COLORS[i % SLOT_COLORS.length];
          const isTop = wins > 0 && wins === maxWins;
          const pct = Math.max(4, Math.round((wins / totalCategories) * 100));

          return (
            <div key={device.slug}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink)]">
                  {isTop && <span aria-hidden>🏆</span>}
                  {device.name}
                </span>
                <span className="spec-value text-[12.5px] font-bold" style={{ color: isTop ? color : "var(--ink-soft)" }}>
                  {wins} / {totalCategories}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--mist)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-[var(--ink-faint)]">
        One point per category where a device has the single best real value (specs and
        benchmarks combined) — ties and categories with only one reading don&apos;t count.
        Not a weighted score, just who actually won what.
      </p>
    </div>
  );
}
