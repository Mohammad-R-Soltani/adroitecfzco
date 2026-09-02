"use client";

import { Fragment } from "react";
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
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="w-full min-w-[600px] text-left">
          <thead className="bg-[var(--mist)]">
            <tr className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
              <th className="px-3 py-2">Old model</th>
              <th className="px-3 py-2">New model</th>
              <th className="px-3 py-2 text-right">Score before</th>
              <th className="px-3 py-2 text-right">Score after</th>
              <th className="px-3 py-2">How much faster</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const color =
                BRAND_CHART_COLORS[line.brandSlug as (typeof BRAND_CHART_ORDER)[number]] ?? "var(--ink)";
              return (
                <Fragment key={line.id}>
                  <tr style={{ background: `${color}12` }}>
                    <td colSpan={5} className="px-3 py-1.5">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                        {line.label}
                      </span>
                    </td>
                  </tr>
                  {line.steps.map((step) => (
                    <tr key={`${line.id}-${step.toName}`} className="border-t border-[var(--line)]">
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[var(--ink-soft)]">
                        {step.fromName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold text-[var(--ink)]">
                        {step.toName}
                      </td>
                      <td className="spec-value whitespace-nowrap px-3 py-2.5 text-right text-[12.5px] text-[var(--ink-soft)]">
                        {step.fromScore.toLocaleString()}
                      </td>
                      <td className="spec-value whitespace-nowrap px-3 py-2.5 text-right text-[12.5px] font-semibold text-[var(--ink)]">
                        {step.toScore.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-[110px] shrink-0 overflow-hidden rounded-full bg-[var(--mist)]">
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${(step.percent / maxPercent) * 100}%`, background: color }}
                            />
                          </span>
                          <span
                            className="spec-value shrink-0 text-[15px] font-bold"
                            style={{ color }}
                          >
                            +{step.percent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {brandsShown.map((brand) => (
          <div key={brand} className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)]">
            <span className="h-2 w-2 rounded-full" style={{ background: BRAND_CHART_COLORS[brand] }} />
            {brand.charAt(0).toUpperCase() + brand.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}
