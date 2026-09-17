"use client";

import { Fragment } from "react";
import { BRAND_CHART_COLORS, BRAND_CHART_ORDER } from "@/lib/brandChartColors";
import ChartVerdict, { type Finding } from "./ChartVerdict";

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


const UPLIFT_BANDS = [
  { min: 25, label: "big jump", bg: "#0f766e18", fg: "#0f766e" },
  { min: 10, label: "worth it", bg: "#8a610018", fg: "#8a6100" },
  { min: -Infinity, label: "barely different", bg: "#5b647218", fg: "#5b6472" },
] as const;

const bandFor = (percent: number) => UPLIFT_BANDS.find((b) => percent >= b.min)!;

export default function GenerationalUpliftChart({ lines }: { lines: UpliftLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-faint)]">
        Not enough same-line devices with verified Geekbench 6 scores to compare generations yet.
      </p>
    );
  }

  const allSteps = lines.flatMap((l) => l.steps);
  const maxPercent = Math.max(...allSteps.map((s) => s.percent));
  const brandsShown = BRAND_CHART_ORDER.filter((b) => lines.some((l) => l.brandSlug === b));

  const biggest = allSteps.reduce((a, b) => (b.percent > a.percent ? b : a));
  const smallest = allSteps.reduce((a, b) => (b.percent < a.percent ? b : a));
  const sorted = [...allSteps].map((s) => s.percent).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const weak = allSteps.filter((s) => s.percent < 10).length;

  const findings: Finding[] = [
    {
      label: "Biggest gain",
      headline: biggest.toName,
      detail: `+${biggest.percent.toFixed(1)}% over the ${biggest.fromName}`,
      color: "#0f766e",
    },
    {
      label: "Smallest gain",
      headline: smallest.toName,
      detail: `+${smallest.percent.toFixed(1)}% over the ${smallest.fromName}`,
      color: "#5b6472",
    },
    {
      label: `Typical upgrade (${allSteps.length} compared)`,
      headline: `+${median.toFixed(0)}%`,
      detail: "median gain per generation",
    },
  ];

  // The median alone hides the upgrades that are not upgrades, which is the
  // one thing a buyer replacing stock needs to be told.
  const note =
    weak > 0
      ? `${weak} of the ${allSteps.length} upgrades here gain under 10% — close enough that a buyer would not feel the difference. The rest are real gains.`
      : `Every upgrade here gains at least 10% — all of them are real generational steps.`;

  return (
    <div>
      <ChartVerdict findings={findings} note={note} />

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="w-full min-w-[600px] text-left">
          <thead className="bg-[var(--mist)]">
            <tr className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
              <th className="px-3 py-2">Old model</th>
              <th className="px-3 py-2">New model</th>
              <th className="px-3 py-2 text-right">Score before</th>
              <th className="px-3 py-2 text-right">Score after</th>
              <th className="px-3 py-2">How much faster</th>
              <th className="px-3 py-2">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const color =
                BRAND_CHART_COLORS[line.brandSlug as (typeof BRAND_CHART_ORDER)[number]] ?? "var(--ink)";
              return (
                <Fragment key={line.id}>
                  <tr style={{ background: `${color}12` }}>
                    <td colSpan={6} className="px-3 py-1.5">
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
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {(() => {
                          const band = bandFor(step.percent);
                          return (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                              style={{ background: band.bg, color: band.fg }}
                            >
                              {band.label}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2.5 text-[11px] leading-snug text-[var(--ink-faint)]">
        Verdict is a reading aid, not a benchmark result: <strong>big jump</strong> is 25% or more,{" "}
        <strong>worth it</strong> is 10–25%, <strong>barely different</strong> is under 10% — around the
        point a difference stops being noticeable in normal use.
      </p>

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
