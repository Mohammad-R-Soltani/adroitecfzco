"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type DomainCell = {
  domain: string;
  level: "LEADING" | "STRONG";
  evidence: string;
  sourceName: string;
  sourceUrl: string;
};

export type MatrixChipset = {
  slug: string;
  name: string;
  brandName: string;
  releaseYear: number;
  cells: DomainCell[];
};

// Fixed column order, roughly the order a buyer asks about them.
const DOMAINS = [
  { key: "ON_DEVICE_AI", short: "AI", label: "On-device AI" },
  { key: "GAMING_GPU", short: "GPU", label: "Gaming / GPU" },
  { key: "RAY_TRACING", short: "RT", label: "Ray tracing" },
  { key: "CAMERA_ISP", short: "Cam", label: "Camera / ISP" },
  { key: "POWER_EFFICIENCY", short: "Eff", label: "Power efficiency" },
  { key: "SUSTAINED_PERFORMANCE", short: "Sust", label: "Sustained performance" },
  { key: "RAW_CPU", short: "CPU", label: "Raw CPU" },
  { key: "CONNECTIVITY", short: "Conn", label: "Connectivity" },
] as const;

// Ordinal ramp: one blue hue, darker means stronger evidence. Both steps are
// validated as an ordinal pair against this surface — the lighter step is 250
// (2.06:1), the lightest that still clears the floor. An empty cell is left as
// plain surface: "nothing published", deliberately not a third colour that
// would read as a low score.
const LEVEL_STYLE = {
  LEADING: { bg: "#256abf", fg: "#ffffff", label: "Leads" },
  STRONG: { bg: "#86b6ef", fg: "#0b1220", label: "Strong" },
} as const;

export default function DomainMatrix({ chipsets }: { chipsets: MatrixChipset[] }) {
  const [active, setActive] = useState<{ chipset: MatrixChipset; cell: DomainCell } | null>(null);

  // Only columns that some chip actually has evidence for, and only chips with
  // at least one — an all-blank row or column is noise.
  const { rows, columns } = useMemo(() => {
    const rows = chipsets.filter((c) => c.cells.length > 0);
    const used = new Set(rows.flatMap((c) => c.cells.map((cell) => cell.domain)));
    return { rows, columns: DOMAINS.filter((d) => used.has(d.key)) };
  }, [chipsets]);

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--ink-faint)]">No sourced domain strengths recorded yet.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="w-[168px] px-1 pb-1 text-left align-bottom text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                Chipset
              </th>
              {columns.map((d) => (
                <th
                  key={d.key}
                  title={d.label}
                  className="px-1 pb-1 text-center align-bottom text-[10px] font-semibold text-[var(--ink-soft)]"
                >
                  {d.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((chipset) => (
              <tr key={chipset.slug}>
                <td className="w-[168px] max-w-[168px] px-1">
                  <Link
                    href={`/chipsets/${chipset.slug}`}
                    className="block truncate text-[11.5px] font-semibold text-[var(--ink)] hover:text-[var(--signal)]"
                    title={`${chipset.name} · ${chipset.brandName} · ${chipset.releaseYear}`}
                  >
                    {chipset.name}
                  </Link>
                </td>
                {columns.map((d) => {
                  const cell = chipset.cells.find((c) => c.domain === d.key);
                  if (!cell) {
                    return (
                      <td key={d.key} className="h-8 rounded-md bg-[var(--mist)]/50" aria-label="not documented" />
                    );
                  }
                  const style = LEVEL_STYLE[cell.level];
                  const isActive = active?.chipset.slug === chipset.slug && active?.cell.domain === d.key;
                  return (
                    <td key={d.key} className="p-0">
                      <button
                        type="button"
                        onClick={() => setActive(isActive ? null : { chipset, cell })}
                        title={`${chipset.name} — ${d.label}: ${style.label}`}
                        className="flex h-8 w-full items-center justify-center rounded-md text-[9.5px] font-bold uppercase tracking-wide transition hover:opacity-85"
                        style={{
                          background: style.bg,
                          color: style.fg,
                          outline: isActive ? "2px solid var(--ink)" : "none",
                          outlineOffset: "-2px",
                        }}
                      >
                        {style.label}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {Object.entries(LEVEL_STYLE).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-soft)]">
            <span className="h-2.5 w-4 rounded" style={{ background: style.bg }} />
            {style.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-faint)]">
          <span className="h-2.5 w-4 rounded bg-[var(--mist)]/50" />
          Nothing published
        </div>
        <span className="text-[11px] text-[var(--ink-faint)]">· Tap any cell for the evidence</span>
      </div>

      {active && (
        <div className="mt-3 rounded-xl border border-[var(--signal)]/30 bg-[var(--signal)]/[0.04] p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
            {active.chipset.name} · {DOMAINS.find((d) => d.key === active.cell.domain)?.label}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{active.cell.evidence}</p>
          <a
            href={active.cell.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-1.5 inline-block text-[10.5px] font-medium text-[var(--signal)] hover:underline"
          >
            Source: {active.cell.sourceName}
          </a>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {columns.map((d) => (
          <span key={d.key} className="text-[10.5px] text-[var(--ink-faint)]">
            <span className="font-semibold text-[var(--ink-soft)]">{d.short}</span> — {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
