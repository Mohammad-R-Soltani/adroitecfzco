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

const WIDTH = 560;
const HEIGHT = 360;
const PAD_LEFT = 54;
const PAD_RIGHT = 18;
const PAD_TOP = 18;
const PAD_BOTTOM = 46;

/**
 * Round tick values that stay inside [min, max]. Ticks outside the plotted
 * range used to be emitted and then drawn beyond the axes, which is what put
 * a stray "4,000" and "€200" outside the frame.
 */
function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min || 1;
  const rawStep = span / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) {
    ticks.push(Math.round(t * 100) / 100);
  }
  return ticks;
}

type View = "map" | "ranking";

export default function ValueMapChart({ points }: { points: ValuePoint[] }) {
  const [brand, setBrand] = useState<string>("all");
  const [view, setView] = useState<View>("map");
  const [showTable, setShowTable] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const brandsPresent = BRAND_CHART_ORDER.filter((b) => points.some((p) => p.brandSlug === b));

  // Numbered hardest-hitting first: the legend beside the chart is read as a
  // ranking, so the numbers follow performance-per-euro rather than an
  // arbitrary plot order.
  const shown = useMemo(() => {
    const filtered = brand === "all" ? points : points.filter((p) => p.brandSlug === brand);
    return [...filtered]
      .sort((a, b) => b.score / b.priceEur - a.score / a.priceEur)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [points, brand]);

  const geometry = useMemo(() => {
    if (shown.length === 0) return null;
    const prices = shown.map((p) => p.priceEur);
    const scores = shown.map((p) => p.score);
    const xMin = Math.min(...prices) * 0.92;
    const xMax = Math.max(...prices) * 1.06;
    const yMin = Math.min(...scores) * 0.94;
    const yMax = Math.max(...scores) * 1.05;
    return {
      xMin,
      xMax,
      yMin,
      yMax,
      plotW: WIDTH - PAD_LEFT - PAD_RIGHT,
      plotH: HEIGHT - PAD_TOP - PAD_BOTTOM,
      xTicks: niceTicks(xMin, xMax, 4),
      yTicks: niceTicks(yMin, yMax, 4),
    };
  }, [shown]);

  if (points.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-faint)]">
        No device yet has both a published price and a verified Geekbench 6 score.
      </p>
    );
  }

  const colorOf = (slug: string) =>
    BRAND_CHART_COLORS[slug as (typeof BRAND_CHART_ORDER)[number]] ?? "var(--ink)";

  return (
    <div>
      {/* controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <FilterButton active={brand === "all"} onClick={() => setBrand("all")}>
            All brands
          </FilterButton>
          {brandsPresent.map((b) => (
            <FilterButton key={b} active={brand === b} onClick={() => setBrand(b)} dot={BRAND_CHART_COLORS[b]}>
              {points.find((p) => p.brandSlug === b)?.brandName ?? b}
            </FilterButton>
          ))}
        </div>

        <div className="flex gap-1.5">
          <FilterButton active={view === "map"} onClick={() => setView("map")}>
            Map
          </FilterButton>
          <FilterButton active={view === "ranking"} onClick={() => setView("ranking")}>
            Ranking
          </FilterButton>
        </div>
      </div>

      {view === "map" && geometry && (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full"
              role="img"
              aria-label="Launch price plotted against verified Geekbench 6 multi-core score"
            >
              <g transform={`translate(${PAD_LEFT},${PAD_TOP})`}>
                {geometry.yTicks.map((t) => {
                  const y = geometry.plotH - ((t - geometry.yMin) / (geometry.yMax - geometry.yMin)) * geometry.plotH;
                  return (
                    <g key={`y${t}`}>
                      <line x1={0} x2={geometry.plotW} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />
                      <text
                        x={-8}
                        y={y}
                        textAnchor="end"
                        dominantBaseline="middle"
                        className="fill-[var(--ink-faint)] text-[10px]"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {t.toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {geometry.xTicks.map((t) => {
                  const x = ((t - geometry.xMin) / (geometry.xMax - geometry.xMin)) * geometry.plotW;
                  return (
                    <text
                      key={`x${t}`}
                      x={x}
                      y={geometry.plotH + 18}
                      textAnchor="middle"
                      className="fill-[var(--ink-faint)] text-[10px]"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      €{t.toLocaleString()}
                    </text>
                  );
                })}

                <text
                  x={geometry.plotW / 2}
                  y={geometry.plotH + 38}
                  textAnchor="middle"
                  className="fill-[var(--ink-soft)] text-[10.5px] font-semibold"
                >
                  Launch price →
                </text>
                <text x={-PAD_LEFT + 2} y={-6} className="fill-[var(--ink-soft)] text-[10.5px] font-semibold">
                  ↑ Geekbench 6 multi-core
                </text>

                {shown.map((p) => {
                  const cx = ((p.priceEur - geometry.xMin) / (geometry.xMax - geometry.xMin)) * geometry.plotW;
                  const cy =
                    geometry.plotH - ((p.score - geometry.yMin) / (geometry.yMax - geometry.yMin)) * geometry.plotH;
                  const isHot = hovered === p.slug;
                  return (
                    <g
                      key={p.slug}
                      onMouseEnter={() => setHovered(p.slug)}
                      onMouseLeave={() => setHovered(null)}
                      className="cursor-pointer"
                    >
                      <circle cx={cx} cy={cy} r={isHot ? 13 : 10} fill="var(--paper)" />
                      <circle cx={cx} cy={cy} r={isHot ? 12 : 9} fill={colorOf(p.brandSlug)} />
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="pointer-events-none text-[9px] font-bold"
                        fill="#fff"
                      >
                        {p.rank}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* numbered key beside the chart — the point of the numbers */}
          <ol className="flex max-h-[360px] shrink-0 flex-col gap-0.5 overflow-y-auto lg:w-[290px]">
            {shown.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/devices/${p.slug}`}
                  onMouseEnter={() => setHovered(p.slug)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 transition ${
                    hovered === p.slug ? "bg-[var(--signal)]/[0.08]" : "hover:bg-[var(--mist)]"
                  }`}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: colorOf(p.brandSlug) }}
                  >
                    {p.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[var(--ink)]">
                    {p.name}
                  </span>
                  <span className="spec-value shrink-0 text-[10.5px] text-[var(--ink-faint)]">
                    €{p.priceEur.toLocaleString()}
                  </span>
                  <span className="spec-value w-[42px] shrink-0 text-right text-[10.5px] font-semibold text-[var(--signal)]">
                    {Math.round(p.score / p.priceEur)}/€
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {view === "ranking" && (
        <div className="flex flex-col gap-1.5">
          {/* One measure only — points per euro. Price and score are never put on
              two axes of one chart; the map view above is where both are shown. */}
          {shown.map((p) => {
            const best = shown[0].score / shown[0].priceEur;
            const ratio = p.score / p.priceEur;
            return (
              <Link
                key={p.slug}
                href={`/devices/${p.slug}`}
                className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition hover:bg-[var(--mist)]"
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: colorOf(p.brandSlug) }}
                >
                  {p.rank}
                </span>
                <span className="w-[150px] shrink-0 truncate text-[11.5px] font-medium text-[var(--ink)]">
                  {p.name}
                </span>
                <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(ratio / best) * 100}%`, background: colorOf(p.brandSlug) }}
                  />
                </span>
                <span className="spec-value w-[54px] shrink-0 text-right text-[11px] font-bold text-[var(--ink)]">
                  {Math.round(ratio)}/€
                </span>
              </Link>
            );
          })}
          <p className="mt-1 text-[10.5px] text-[var(--ink-faint)]">
            Geekbench 6 multi-core points per euro of launch price — higher is better value.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
        <div className="flex flex-wrap items-center gap-4">
          {brandsPresent.map((b) => (
            <div key={b} className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)]">
              <span className="h-2 w-2 rounded-full" style={{ background: BRAND_CHART_COLORS[b] }} />
              {points.find((p) => p.brandSlug === b)?.brandName ?? b}
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
                <th className="px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">Device</th>
                <th className="px-3 py-2 font-semibold">Brand</th>
                <th className="px-3 py-2 text-right font-semibold">Price</th>
                <th className="px-3 py-2 text-right font-semibold">GB6 multi</th>
                <th className="px-3 py-2 text-right font-semibold">Pts per €</th>
              </tr>
            </thead>
            <tbody className="[font-variant-numeric:tabular-nums]">
              {shown.map((p) => (
                <tr key={p.slug} className="border-t border-[var(--line)]">
                  <td className="px-3 py-2 text-[var(--ink-faint)]">{p.rank}</td>
                  <td className="px-3 py-2">
                    <Link href={`/devices/${p.slug}`} className="font-medium text-[var(--ink)] hover:text-[var(--signal)]">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-[var(--ink-soft)]">{p.brandName}</td>
                  <td className="px-3 py-2 text-right text-[var(--ink-soft)]">€{p.priceEur.toLocaleString()}</td>
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

function FilterButton({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
        active
          ? "border-[var(--signal)] bg-[var(--signal)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--signal)]/40"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: active ? "#fff" : dot }} />}
      {children}
    </button>
  );
}
