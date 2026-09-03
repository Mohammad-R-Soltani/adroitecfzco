"use client";

import { useMemo, useState } from "react";

export type TrendSeries = {
  family: string;
  total: number;
  months: { month: string; qty: number }[];
};

const WIDTH = 760;
const HEIGHT = 340;
const PAD_LEFT = 54;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 42;

// Fixed hue order from the validated categorical theme — assigned by rank and
// never recycled, so a line keeps its colour as the selection changes.
const SERIES_COLORS = [
  "#2a78d6", "#eb6834", "#1baf7a", "#eda100",
  "#e87ba4", "#008300", "#4a3aa7", "#e34948",
];

type Mode = "calendar" | "sinceLaunch";

export default function DemandTrendChart({ series }: { series: TrendSeries[] }) {
  const [selected, setSelected] = useState<string[]>(() => series.slice(0, 4).map((s) => s.family));
  const [mode, setMode] = useState<Mode>("calendar");
  const [monthsBack, setMonthsBack] = useState<number | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);

  const colorFor = (family: string) =>
    SERIES_COLORS[series.findIndex((s) => s.family === family) % SERIES_COLORS.length];

  const chart = useMemo(() => {
    const chosen = series.filter((s) => selected.includes(s.family));
    if (chosen.length === 0) return null;

    // Calendar mode shares one real time axis. "Since launch" re-bases every
    // product to its own first month with trade, which is the only way to
    // compare products that launched at different times — the same reason a
    // stock chart indexes from IPO rather than by date.
    const lines = chosen.map((s) => {
      const active = s.months.filter((m) => m.qty > 0);
      const firstActive = active.length ? active[0].month : s.months[0]?.month;
      const points = s.months
        .filter((m) => (mode === "sinceLaunch" ? m.month >= (firstActive ?? m.month) : true))
        .map((m, i, arr) => ({
          key: mode === "calendar" ? m.month : String(i),
          label: mode === "calendar" ? m.month.slice(0, 7) : `month ${i + 1}`,
          qty: m.qty,
          index: i,
          total: arr.length,
        }));
      return { family: s.family, points };
    });

    const trimmed = lines.map((l) => ({
      ...l,
      points: monthsBack != null ? l.points.slice(-monthsBack) : l.points,
    }));

    const allKeys = [...new Set(trimmed.flatMap((l) => l.points.map((p) => p.key)))].sort((a, b) =>
      mode === "calendar" ? a.localeCompare(b) : Number(a) - Number(b),
    );
    const maxQty = Math.max(1, ...trimmed.flatMap((l) => l.points.map((p) => p.qty)));

    return { lines: trimmed, allKeys, maxQty };
  }, [series, selected, mode, monthsBack]);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  function toggle(family: string) {
    setSelected((prev) =>
      prev.includes(family) ? prev.filter((f) => f !== family) : [...prev, family],
    );
  }

  const yTicks = useMemo(() => {
    if (!chart) return [];
    const step = Math.pow(10, Math.floor(Math.log10(chart.maxQty / 4)));
    const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => s >= chart.maxQty / 4) ?? step * 10;
    const out: number[] = [];
    for (let t = 0; t <= chart.maxQty; t += nice) out.push(t);
    return out;
  }, [chart]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <Toggle active={mode === "calendar"} onClick={() => setMode("calendar")}>
            By calendar month
          </Toggle>
          <Toggle active={mode === "sinceLaunch"} onClick={() => setMode("sinceLaunch")}>
            Months since first sale
          </Toggle>
        </div>
        <div className="flex gap-1.5">
          {[3, 6, 12, null].map((n) => (
            <Toggle key={String(n)} active={monthsBack === n} onClick={() => setMonthsBack(n)}>
              {n ? `Last ${n}` : "All"}
            </Toggle>
          ))}
        </div>
      </div>

      {chart ? (
        <div className="relative">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Units sold per month by product line">
            <g transform={`translate(${PAD_LEFT},${PAD_TOP})`}>
              {yTicks.map((t) => {
                const y = plotH - (t / chart.maxQty) * plotH;
                return (
                  <g key={t}>
                    <line x1={0} x2={plotW} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />
                    <text x={-8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-[var(--ink-faint)] text-[10px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {t.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {chart.allKeys.map((key, i) => {
                if (chart.allKeys.length > 12 && i % 2 !== 0) return null;
                const x = (i / Math.max(1, chart.allKeys.length - 1)) * plotW;
                const line = chart.lines.find((l) => l.points.some((p) => p.key === key));
                const label = line?.points.find((p) => p.key === key)?.label ?? key;
                return (
                  <text key={key} x={x} y={plotH + 18} textAnchor="middle" className="fill-[var(--ink-faint)] text-[9.5px]">
                    {label}
                  </text>
                );
              })}

              {chart.lines.map((line) => {
                const color = colorFor(line.family);
                const d = line.points
                  .map((p, i) => {
                    const x = (chart.allKeys.indexOf(p.key) / Math.max(1, chart.allKeys.length - 1)) * plotW;
                    const y = plotH - (p.qty / chart.maxQty) * plotH;
                    return `${i === 0 ? "M" : "L"}${x},${y}`;
                  })
                  .join(" ");
                return (
                  <g key={line.family}>
                    <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                    {line.points.map((p) => {
                      const x = (chart.allKeys.indexOf(p.key) / Math.max(1, chart.allKeys.length - 1)) * plotW;
                      const y = plotH - (p.qty / chart.maxQty) * plotH;
                      return (
                        <circle
                          key={p.key}
                          cx={x}
                          cy={y}
                          r={4}
                          fill={color}
                          stroke="var(--paper)"
                          strokeWidth={2}
                          className="cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                            if (!rect) return;
                            const scale = rect.width / WIDTH;
                            setHover({
                              x: (PAD_LEFT + x) * scale,
                              y: (PAD_TOP + y) * scale,
                              label: `${line.family} · ${p.label} · ${p.qty.toLocaleString()} units`,
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
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-[var(--ink-faint)]">
          Pick at least one product line below.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-3">
        {series.map((s) => {
          const on = selected.includes(s.family);
          const color = colorFor(s.family);
          return (
            <button
              key={s.family}
              type="button"
              onClick={() => toggle(s.family)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                on ? "text-white" : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
              }`}
              style={on ? { background: color, borderColor: color } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: on ? "#fff" : color }} />
              {s.family}
              <span className={on ? "text-white/70" : "text-[var(--ink-faint)]"}>
                {s.total.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
        active
          ? "border-[#0f766e] bg-[#0f766e] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[#0f766e]/40"
      }`}
    >
      {children}
    </button>
  );
}
