"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BRAND_CHART_COLORS, BRAND_CHART_ORDER } from "@/lib/brandChartColors";

export type ValuePoint = {
  slug: string;
  name: string;
  brandSlug: string;
  brandName: string;
  priceEur: number;
  score: number;
  releaseYear: number;
};

const WIDTH = 720;
const HEIGHT = 380;
const PAD_LEFT = 52;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 44;

function niceTicks(min: number, max: number, count: number) {
  const span = max - min || 1;
  const rawStep = span / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? magnitude * 10;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= max + step * 0.001; t += step) ticks.push(Math.round(t * 100) / 100);
  return ticks;
}

export default function ValueMapChart({ points }: { points: ValuePoint[] }) {
  const [hover, setHover] = useState<{ x: number; y: number; point: ValuePoint } | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { brands, xTicks, yTicks, xMin, xMax, yMin, yMax, plotW, plotH } = useMemo(() => {
    const prices = points.map((p) => p.priceEur);
    const scores = points.map((p) => p.score);
    const xMin = Math.min(...prices) * 0.9;
    const xMax = Math.max(...prices) * 1.05;
    const yMin = Math.min(...scores) * 0.92;
    const yMax = Math.max(...scores) * 1.04;
    return {
      brands: BRAND_CHART_ORDER.filter((b) => points.some((p) => p.brandSlug === b)),
      xTicks: niceTicks(xMin, xMax, 5),
      yTicks: niceTicks(yMin, yMax, 5),
      xMin,
      xMax,
      yMin,
      yMax,
      plotW: WIDTH - PAD_LEFT - PAD_RIGHT,
      plotH: HEIGHT - PAD_TOP - PAD_BOTTOM,
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-faint)]">
        No device yet has both a published price and a verified Geekbench 6 score.
      </p>
    );
  }

  const xFor = (price: number) => ((price - xMin) / (xMax - xMin)) * plotW;
  const yFor = (score: number) => plotH - ((score - yMin) / (yMax - yMin)) * plotH;

  // The single best score-per-euro device gets a direct label — the one point
  // the chart is really about, rather than labelling every dot.
  const bestValue = points.reduce((best, p) => (p.score / p.priceEur > best.score / best.priceEur ? p : best));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Device price in euros plotted against verified Geekbench 6 multi-core score"
      >
        <g transform={`translate(${PAD_LEFT},${PAD_TOP})`}>
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={0} x2={plotW} y1={yFor(t)} y2={yFor(t)} stroke="var(--line)" strokeWidth={1} />
              <text
                x={-8}
                y={yFor(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-[var(--ink-faint)] text-[10px]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {t.toLocaleString()}
              </text>
            </g>
          ))}

          {xTicks.map((t) => (
            <text
              key={`x${t}`}
              x={xFor(t)}
              y={plotH + 18}
              textAnchor="middle"
              className="fill-[var(--ink-faint)] text-[10px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              €{t.toLocaleString()}
            </text>
          ))}

          <text
            x={plotW / 2}
            y={plotH + 36}
            textAnchor="middle"
            className="fill-[var(--ink-soft)] text-[10.5px] font-semibold"
          >
            Launch price (EUR, as listed by GSMArena)
          </text>

          <text
            x={-PAD_LEFT + 4}
            y={-4}
            className="fill-[var(--ink-soft)] text-[10.5px] font-semibold"
          >
            Geekbench 6 multi-core
          </text>

          {points.map((p) => {
            const cx = xFor(p.priceEur);
            const cy = yFor(p.score);
            const color = BRAND_CHART_COLORS[p.brandSlug as (typeof BRAND_CHART_ORDER)[number]] ?? "var(--ink)";
            return (
              <g key={p.slug}>
                <circle cx={cx} cy={cy} r={7} fill="var(--paper)" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  className="cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    const scale = rect.width / WIDTH;
                    setHover({ x: (PAD_LEFT + cx) * scale, y: (PAD_TOP + cy) * scale, point: p });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}

          {/* One selective direct label: the best score-per-euro on the board.
              It flips to the left of its dot when the dot sits in the right
              half, and carries a surface-coloured halo so it stays readable
              where it crosses other marks. */}
          {(() => {
            const cx = xFor(bestValue.priceEur);
            const onRight = cx > plotW * 0.55;
            return (
              <text
                x={onRight ? cx - 12 : cx + 12}
                y={yFor(bestValue.score) - 10}
                textAnchor={onRight ? "end" : "start"}
                className="fill-[var(--ink)] text-[10.5px] font-semibold"
                stroke="var(--paper)"
                strokeWidth={3.5}
                paintOrder="stroke"
              >
                {bestValue.name} — best score per €
              </text>
            );
          })()}
        </g>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-[11px] shadow-lg"
          style={{ left: hover.x, top: hover.y - 10 }}
        >
          <p className="font-semibold text-[var(--ink)]">{hover.point.name}</p>
          <p className="text-[var(--ink-soft)]">
            €{hover.point.priceEur.toLocaleString()} · {hover.point.score.toLocaleString()} pts ·{" "}
            {Math.round(hover.point.score / hover.point.priceEur)} pts per €
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full" style={{ background: BRAND_CHART_COLORS[brand] }} />
              {points.find((p) => p.brandSlug === brand)?.brandName ?? brand}
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
                <th className="px-3 py-2 font-semibold">Device</th>
                <th className="px-3 py-2 font-semibold">Brand</th>
                <th className="px-3 py-2 text-right font-semibold">Price (EUR)</th>
                <th className="px-3 py-2 text-right font-semibold">GB6 multi</th>
                <th className="px-3 py-2 text-right font-semibold">Pts per €</th>
              </tr>
            </thead>
            <tbody className="[font-variant-numeric:tabular-nums]">
              {[...points]
                .sort((a, b) => b.score / b.priceEur - a.score / a.priceEur)
                .map((p) => (
                  <tr key={p.slug} className="border-t border-[var(--line)]">
                    <td className="px-3 py-2">
                      <Link href={`/devices/${p.slug}`} className="font-medium text-[var(--ink)] hover:text-[var(--signal)]">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-[var(--ink-soft)]">{p.brandName}</td>
                    <td className="px-3 py-2 text-right text-[var(--ink-soft)]">{p.priceEur.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-[var(--ink-soft)]">{p.score.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[var(--ink)]">
                      {Math.round(p.score / p.priceEur)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
