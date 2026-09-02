"use client";

import { useState } from "react";
import { BRAND_CHART_COLORS, BRAND_CHART_ORDER } from "@/lib/brandChartColors";

export type UpliftStep = {
  fromName: string;
  toName: string;
  fromScore: number;
  toScore: number;
  percent: number;
};

export type UpliftLine = {
  id: string;
  label: string;
  brandSlug: string;
  steps: UpliftStep[];
};

export default function GenerationalUpliftChart({ lines }: { lines: UpliftLine[] }) {
  const [showTable, setShowTable] = useState(false);

  if (lines.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-faint)]">
        Not enough same-line devices with verified Geekbench 6 scores to compare generations yet.
      </p>
    );
  }

  const maxPercent = Math.max(...lines.flatMap((l) => l.steps.map((s) => s.percent)));
  const brandsShown = BRAND_CHART_ORDER.filter((b) => lines.some((l) => l.brandSlug === b));

  return (
    <div>
      <div className="flex flex-col gap-5">
        {lines.map((line) => {
          const color =
            BRAND_CHART_COLORS[line.brandSlug as (typeof BRAND_CHART_ORDER)[number]] ?? "var(--ink)";
          return (
            <div key={line.id}>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {line.label}
              </p>
              <div className="flex flex-col gap-2">
                {line.steps.map((step) => (
                  <div key={`${step.fromName}-${step.toName}`} className="flex items-center gap-3">
                    <span className="w-[132px] shrink-0 truncate text-[11px] text-[var(--ink-faint)]">
                      {step.fromName} → {step.toName}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(3, (step.percent / maxPercent) * 100)}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <span
                      className="spec-value w-[52px] shrink-0 text-right text-[12px] font-bold"
                      style={{ color }}
                    >
                      +{step.percent.toFixed(0)}%
                    </span>
                    <span className="spec-value hidden w-[104px] shrink-0 text-right text-[10.5px] text-[var(--ink-faint)] sm:block">
                      {step.fromScore.toLocaleString()} → {step.toScore.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {brandsShown.map((brand) => (
            <div key={brand} className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full" style={{ background: BRAND_CHART_COLORS[brand] }} />
              {brand.charAt(0).toUpperCase() + brand.slice(1)}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-soft)] transition hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
        >
          {showTable ? "Hide table" : "Show as table"}
        </button>
      </div>

      {showTable && (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[var(--mist)] text-[var(--ink-soft)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Line</th>
                <th className="px-3 py-2 font-semibold">Step</th>
                <th className="px-3 py-2 text-right font-semibold">From</th>
                <th className="px-3 py-2 text-right font-semibold">To</th>
                <th className="px-3 py-2 text-right font-semibold">Uplift</th>
              </tr>
            </thead>
            <tbody className="[font-variant-numeric:tabular-nums]">
              {lines.flatMap((line) =>
                line.steps.map((step) => (
                  <tr key={`${line.id}-${step.toName}`} className="border-t border-[var(--line)]">
                    <td className="px-3 py-2 text-[var(--ink-soft)]">{line.label}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">
                      {step.fromName} → {step.toName}
                    </td>
                    <td className="px-3 py-2 text-right text-[var(--ink-soft)]">
                      {step.fromScore.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-[var(--ink-soft)]">
                      {step.toScore.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-[var(--ink)]">
                      +{step.percent.toFixed(1)}%
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
