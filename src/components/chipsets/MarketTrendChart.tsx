"use client";

import { useMemo, useState } from "react";
import { SERIES_CHART_ORDER, colorForSeries } from "@/lib/seriesChartColors";

export type TrendPoint = { year: number; series: string; count: number };

const WIDTH = 720;
const HEIGHT = 300;
const PAD_LEFT = 34;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 34;
const BAR_MAX_W = 64;
const SEGMENT_GAP = 2;

export default function MarketTrendChart({ points }: { points: TrendPoint[] }) {
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);

  const { years, seriesOrder, maxTotal, plotW, plotH } = useMemo(() => {
    const years = Array.from(new Set(points.map((p) => p.year))).sort((a, b) => a - b);

    const present = new Set(points.map((p) => p.series));
    const knownSet = new Set<string>(SERIES_CHART_ORDER);
    const known = SERIES_CHART_ORDER.filter((s) => present.has(s));
    const unknown = Array.from(present).filter((s) => !knownSet.has(s)).sort();
    const seriesOrder = [...known, ...unknown];

    const totalsByYear = new Map<number, number>();
    for (const p of points) totalsByYear.set(p.year, (totalsByYear.get(p.year) ?? 0) + p.count);
    const maxTotal = Math.max(1, ...Array.from(totalsByYear.values()));

    return {
      years,
      seriesOrder,
      maxTotal,
      plotW: WIDTH - PAD_LEFT - PAD_RIGHT,
      plotH: HEIGHT - PAD_TOP - PAD_BOTTOM,
    };
  }, [points]);

  if (years.length === 0) {
    return <p className="text-sm text-[var(--ink-faint)]">Not enough dated devices yet to chart a trend.</p>;
  }

  const yTickCount = Math.min(maxTotal, 5);
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => Math.round((i * maxTotal) / yTickCount));

  const groupW = plotW / years.length;
  const barW = Math.min(BAR_MAX_W, groupW * 0.55);

  const yFor = (count: number) => plotH - (count / maxTotal) * plotH;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Devices released per year, by chipset series"
      >
        <g transform={`translate(${PAD_LEFT},${PAD_TOP})`}>
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={yFor(t)} y2={yFor(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={-8} y={yFor(t)} textAnchor="end" dominantBaseline="middle" className="fill-[var(--ink-faint)] text-[10px]">
                {t}
              </text>
            </g>
          ))}

          {years.map((year, yi) => {
            const barX = yi * groupW + (groupW - barW) / 2;
            let cursor = plotH;
            return (
              <g key={year}>
                <text
                  x={yi * groupW + groupW / 2}
                  y={plotH + 20}
                  textAnchor="middle"
                  className="spec-value fill-[var(--ink-soft)] text-[11px] font-semibold"
                >
                  {year}
                </text>
                {seriesOrder.map((series, si) => {
                  const point = points.find((p) => p.year === year && p.series === series);
                  const count = point?.count ?? 0;
                  if (count === 0) return null;
                  const segH = (count / maxTotal) * plotH;
                  const segY = cursor - segH;
                  cursor = segY - SEGMENT_GAP;
                  return (
                    <rect
                      key={series}
                      x={barX}
                      y={segY}
                      width={barW}
                      height={Math.max(segH - 0, 2)}
                      rx={4}
                      fill={colorForSeries(series, si)}
                      onMouseEnter={(e) => {
                        const svg = e.currentTarget.ownerSVGElement;
                        const rect = svg?.getBoundingClientRect();
                        if (!rect) return;
                        const scale = rect.width / WIDTH;
                        setHover({
                          x: (PAD_LEFT + barX + barW / 2) * scale,
                          y: (PAD_TOP + segY) * scale,
                          label: `${series} · ${year} · ${count} device${count === 1 ? "" : "s"}`,
                        });
                      }}
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[var(--ink)] shadow-lg"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          {hover.label}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {seriesOrder.map((series, si) => (
          <div key={series} className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)]">
            <span className="h-2 w-2 rounded-full" style={{ background: colorForSeries(series, si) }} />
            {series}
          </div>
        ))}
      </div>
    </div>
  );
}
