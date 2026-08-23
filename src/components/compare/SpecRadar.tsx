"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SLOT_COLORS } from "@/lib/compareColors";

export type RadarDevice = {
  slug: string;
  name: string;
  displayInches: number | null;
  batteryMah: number | null;
  chargingWatts: number | null;
  mainCameraMp: number | null;
  refreshRateHz: number | null;
  weightGrams: number | null;
  geekbenchMulti: number | null;
};

type Axis = {
  key: keyof Omit<RadarDevice, "slug" | "name">;
  label: string;
  unit: string;
  higherIsBetter: boolean;
};

const AXES: Axis[] = [
  { key: "displayInches", label: "Display", unit: '"', higherIsBetter: true },
  { key: "batteryMah", label: "Battery", unit: "mAh", higherIsBetter: true },
  { key: "chargingWatts", label: "Charging", unit: "W", higherIsBetter: true },
  { key: "mainCameraMp", label: "Main cam", unit: "MP", higherIsBetter: true },
  { key: "refreshRateHz", label: "Refresh", unit: "Hz", higherIsBetter: true },
  { key: "geekbenchMulti", label: "CPU (GB6)", unit: "", higherIsBetter: true },
  { key: "weightGrams", label: "Lightness", unit: "g", higherIsBetter: false },
];

// Generous margin between the plot and the viewBox edge so every label —
// even the longest ("CPU (GB6)"), which extends purely rightward from its
// anchor point — renders fully inside the SVG's own (clipping) bounds at
// every screen size, since the box just scales.
const SIZE = 560;
const CENTER = SIZE / 2;
const RADIUS = SIZE * 0.24;
const LABEL_RADIUS = RADIUS + 50;

function pointOn(angle: number, r: number) {
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)] as const;
}

export default function SpecRadar({ devices }: { devices: RadarDevice[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Only keep axes where at least two devices have a real value to compare —
  // a single lonely reading can't be "compared" and would mislead the shape.
  const axes = useMemo(
    () => AXES.filter((axis) => devices.filter((d) => d[axis.key] != null).length >= 2),
    [devices]
  );

  const omitted = AXES.filter((a) => !axes.includes(a));

  if (devices.length < 2 || axes.length < 3) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/60 p-6 text-center">
        <p className="text-sm font-semibold text-[var(--ink)]">Add another device to see the fingerprint</p>
        <p className="mt-1 text-[12px] text-[var(--ink-soft)]">
          The silhouette needs at least two devices sharing at least three comparable specs.
        </p>
      </div>
    );
  }

  const angleStep = (Math.PI * 2) / axes.length;
  const startAngle = -Math.PI / 2;

  const maxByAxis = axes.map((axis) => {
    const values = devices.map((d) => d[axis.key]).filter((v): v is number => v != null);
    return Math.max(...values);
  });

  const shapes = devices.map((device, di) => {
    const pts = axes.map((axis, ai) => {
      const raw = device[axis.key];
      const max = maxByAxis[ai];
      let ratio: number;
      if (raw == null || max === 0) {
        ratio = 0;
      } else if (!axis.higherIsBetter) {
        // "Lightness" axis: lighter device should reach further out.
        ratio = Math.min(1, Math.max(0.1, 1 - raw / max + 0.12));
      } else {
        ratio = Math.max(0.1, raw / max);
      }
      const angle = startAngle + ai * angleStep;
      const [x, y] = pointOn(angle, RADIUS * ratio);
      return { x, y, raw, axis };
    });
    return { device, pts, color: SLOT_COLORS[di % SLOT_COLORS.length] };
  });

  const gridRings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-display text-sm font-bold text-[var(--ink)]">Silicon fingerprint</p>
        <span className="text-[10.5px] text-[var(--ink-faint)]">Each axis: relative to the strongest device here</span>
      </div>

      <div className="relative mx-auto mt-2 w-full max-w-[440px]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full overflow-visible">
          {/* grid rings */}
          {gridRings.map((r) => (
            <polygon
              key={r}
              points={axes
                .map((_, ai) => pointOn(startAngle + ai * angleStep, RADIUS * r).join(","))
                .join(" ")}
              fill="none"
              stroke="var(--line)"
              strokeWidth={1}
            />
          ))}

          {/* spokes */}
          {axes.map((axis, ai) => {
            const [x, y] = pointOn(startAngle + ai * angleStep, RADIUS);
            return (
              <line
                key={axis.key}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="var(--line)"
                strokeWidth={1}
              />
            );
          })}

          {/* device silhouettes */}
          {shapes.map(({ device, pts, color }, di) => (
            <g key={device.slug} opacity={hoverIdx === null || hoverIdx === di ? 1 : 0.25}>
              <motion.polygon
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: di * 0.08 }}
                style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
                points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                fill={color}
                fillOpacity={0.16}
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {pts.map((p, pi) => (
                <circle key={pi} cx={p.x} cy={p.y} r={3} fill={color} />
              ))}
            </g>
          ))}

          {/* axis labels */}
          {axes.map((axis, ai) => {
            const angle = startAngle + ai * angleStep;
            const [x, y] = pointOn(angle, LABEL_RADIUS);
            const cos = Math.cos(angle);
            const anchor = Math.abs(cos) < 0.35 ? "middle" : cos > 0 ? "start" : "end";
            return (
              <text
                key={axis.key}
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-[var(--ink-soft)]"
                fontSize={13}
                fontWeight={600}
              >
                {axis.label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {shapes.map(({ device, color }, di) => (
          <button
            key={device.slug}
            type="button"
            onMouseEnter={() => setHoverIdx(di)}
            onMouseLeave={() => setHoverIdx(null)}
            className="flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--ink-soft)]"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {device.name}
          </button>
        ))}
      </div>

      {omitted.length > 0 && (
        <p className="mt-3 text-center text-[10.5px] text-[var(--ink-faint)]">
          Axes omitted (not comparable across these devices): {omitted.map((o) => o.label).join(", ")}
        </p>
      )}
      <p className="mt-1 text-center text-[10.5px] text-[var(--ink-faint)]">
        A silhouette shows shape, not a score — see the win count below and the full sheet
        for exact values.
      </p>
    </div>
  );
}
