"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { groupBenchmarksForCompare, benchmarkLabel, type BenchmarkRow } from "@/lib/benchmarks";
import { SLOT_COLORS } from "@/lib/compareColors";

export type BattleDevice = {
  slug: string;
  name: string;
  brandAccent: string;
  benchmarks: BenchmarkRow[];
};

export default function BenchmarkBattle({ devices }: { devices: BattleDevice[] }) {
  const groups = groupBenchmarksForCompare(devices);
  const untested = devices.filter((d) => d.benchmarks.length === 0);

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/60 p-6 text-center">
        <p className="text-sm font-semibold text-[var(--ink)]">No verified benchmarks yet</p>
        <p className="mt-1 text-[12px] text-[var(--ink-soft)]">
          None of the selected devices have a sourced Geekbench, AnTuTu or 3DMark result on file.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <BattleGroup
          key={group.key}
          familyMetricLabel={benchmarkLabel(group.family, group.metric)}
          entries={group.entries}
          devices={devices}
        />
      ))}

      {untested.length > 0 && (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--mist)]/60 px-3.5 py-2.5">
          <p className="text-[11.5px] text-[var(--ink-faint)]">
            <span className="font-semibold text-[var(--ink-soft)]">Not tested / verified: </span>
            {untested.map((d) => d.name).join(", ")} — no sourced benchmark on file yet.
          </p>
        </div>
      )}
    </div>
  );
}

function BattleGroup({
  familyMetricLabel,
  entries,
  devices,
}: {
  familyMetricLabel: string;
  entries: { deviceSlug: string; row: BenchmarkRow }[];
  devices: BattleDevice[];
}) {
  const max = Math.max(...entries.map((e) => e.row.value));
  const [openSource, setOpenSource] = useState<string | null>(null);

  // Render one bar per SELECTED device, in slot order, so the same device
  // always lines up in the same row across every group.
  const bySlug = new Map(entries.map((e) => [e.deviceSlug, e.row]));

  return (
    <div className="surface-card rounded-2xl border border-[var(--line)] p-3.5 shadow-sm sm:p-4">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
        {familyMetricLabel}
      </p>

      <div className="flex flex-col gap-2">
        {devices.map((device, i) => {
          const row = bySlug.get(device.slug);
          const color = SLOT_COLORS[i % SLOT_COLORS.length];
          const pct = row ? Math.max(4, Math.round((row.value / max) * 100)) : 0;
          const isBest = row && row.value === max && entries.length > 1;
          const sourceKey = `${familyMetricLabel}-${device.slug}`;

          return (
            <div key={device.slug}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-medium text-[var(--ink)]">{device.name}</span>
                {row ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="spec-value text-[13px] font-bold text-[var(--ink)]">
                      {row.value.toLocaleString()}
                    </span>
                    {isBest && (
                      <span
                        className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white"
                        style={{ background: color }}
                      >
                        Best
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenSource(openSource === sourceKey ? null : sourceKey)}
                      aria-label={`Source for ${device.name} ${familyMetricLabel}`}
                      aria-expanded={openSource === sourceKey}
                      className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--line)] text-[9px] font-bold text-[var(--ink-faint)] transition hover:border-[var(--signal)] hover:text-[var(--signal)]"
                    >
                      i
                    </button>
                  </div>
                ) : (
                  <span className="shrink-0 text-[11px] font-medium text-[var(--ink-faint)]">Not tested</span>
                )}
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--mist)]">
                {row && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                )}
              </div>

              {row && openSource === sourceKey && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-1.5 rounded-lg bg-[var(--mist)] px-2.5 py-2 text-[11px] leading-relaxed text-[var(--ink-soft)]"
                >
                  <p>
                    <span className="font-semibold text-[var(--ink)]">{row.sourceName}</span>
                    {row.sourceDate && <> · tested {row.sourceDate}</>}
                    {row.testedVariant && <> · {row.testedVariant}</>}
                  </p>
                  {row.notes && <p className="mt-0.5 text-[var(--ink-faint)]">{row.notes}</p>}
                  <a
                    href={row.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-1 inline-flex items-center gap-1 font-semibold text-[var(--signal)] hover:underline"
                  >
                    View source
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                      <path
                        d="M7 17L17 7M17 7H9M17 7v8"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
