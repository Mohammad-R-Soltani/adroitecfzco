"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import MetricIcon from "@/components/compare/MetricIcon";

export type MatcherDevice = {
  slug: string;
  name: string;
  brandName: string;
  brandAccent: string;
  chipsetName: string;
  category: string;
  batteryMah: number | null;
  chargingWatts: number | null;
  displayInches: number | null;
  refreshRateHz: number | null;
  mainCameraMp: number | null;
  score: number | null;
  priceEur: number | null;
};

type NumericKey =
  | "batteryMah"
  | "chargingWatts"
  | "displayInches"
  | "refreshRateHz"
  | "mainCameraMp"
  | "score";

type SliderSpec = {
  key: NumericKey;
  label: string;
  unit: string;
  step: number;
  decimals: number;
  icon: string;
};

// Only fields that are real parsed numbers on the spec sheet — nothing here is
// derived or estimated, so a device with no published figure for a filter you
// have moved is excluded rather than assumed to pass.
const SLIDERS: SliderSpec[] = [
  { key: "batteryMah", label: "Battery capacity", unit: " mAh", step: 50, decimals: 0, icon: "battery" },
  { key: "chargingWatts", label: "Charging speed", unit: " W", step: 5, decimals: 0, icon: "bolt" },
  { key: "displayInches", label: "Screen size", unit: '"', step: 0.1, decimals: 1, icon: "display" },
  { key: "refreshRateHz", label: "Refresh rate", unit: " Hz", step: 10, decimals: 0, icon: "refresh" },
  { key: "mainCameraMp", label: "Main camera", unit: " MP", step: 1, decimals: 0, icon: "camera" },
  { key: "score", label: "Geekbench 6 multi-core", unit: " pts", step: 100, decimals: 0, icon: "bolt" },
];

function floorTo(value: number, step: number) {
  return Math.floor(value / step) * step;
}
function ceilTo(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

const CATEGORY_TABS = [
  { value: "PHONE", label: "Phones" },
  { value: "TABLET", label: "Tablets" },
  { value: "LAPTOP", label: "Laptops" },
  { value: "WATCH", label: "Watches" },
  { value: "EARBUDS", label: "Earbuds" },
  { value: "ALL", label: "All" },
] as const;

export default function RequirementMatcher({ devices }: { devices: MatcherDevice[] }) {
  // Scoped by category first: a 1.4" watch and a 14.6" tablet in the same
  // slider range makes every phone filter useless.
  const [category, setCategory] = useState<string>("PHONE");

  const scoped = useMemo(
    () => (category === "ALL" ? devices : devices.filter((d) => d.category === category)),
    [devices, category],
  );

  // Slider bounds come from the scoped catalog itself, so a slider can never be
  // dragged to a value no device in view could ever satisfy.
  const bounds = useMemo(() => {
    const out = {} as Record<NumericKey | "priceEur", { min: number; max: number }>;
    for (const spec of SLIDERS) {
      const values = scoped
        .map((d) => d[spec.key])
        .filter((v): v is number => typeof v === "number");
      out[spec.key] = values.length
        ? { min: floorTo(Math.min(...values), spec.step), max: ceilTo(Math.max(...values), spec.step) }
        : { min: 0, max: 0 };
    }
    const prices = scoped.map((d) => d.priceEur).filter((v): v is number => typeof v === "number");
    out.priceEur = prices.length
      ? { min: floorTo(Math.min(...prices), 10), max: ceilTo(Math.max(...prices), 10) }
      : { min: 0, max: 0 };
    return out;
  }, [scoped]);

  const [mins, setMins] = useState<Partial<Record<NumericKey, number>>>({});
  // null means "no ceiling set" — kept null rather than pinned to a number so
  // switching category can't leave a stale limit from the previous range.
  const [maxPriceRaw, setMaxPriceRaw] = useState<number | null>(null);
  const maxPrice = maxPriceRaw ?? bounds.priceEur.max;

  const activeMins = (Object.entries(mins) as [NumericKey, number][]).filter(
    ([key, value]) => value > bounds[key].min,
  );
  const priceActive = maxPriceRaw != null && maxPriceRaw < bounds.priceEur.max;
  const anyFilter = activeMins.length > 0 || priceActive;

  const results = useMemo(() => {
    return devices
      .filter((d) => {
        for (const [key, min] of activeMins) {
          const value = d[key];
          if (typeof value !== "number" || value < min) return false;
        }
        if (priceActive && (d.priceEur == null || d.priceEur > maxPrice)) return false;
        return true;
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [devices, activeMins, priceActive, maxPrice]);

  function reset() {
    setMins({});
    setMaxPriceRaw(null);
  }

  return (
    <div className="surface-card rounded-2xl border border-[var(--line)] p-4 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-bold text-[var(--ink)]">
            Match a buyer&apos;s requirements
          </h2>
          <p className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">
            Drag each slider to the minimum a client asked for. Devices with no published figure
            for a filter you move are excluded rather than assumed to pass.
          </p>
        </div>
        {anyFilter && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-soft)] transition hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
          >
            Reset
          </button>
        )}
      </div>

      {/* Category first — the sliders' ranges are computed from whichever
          category is in view, so phone filters aren't stretched by tablets. */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORY_TABS.map((tab) => {
          const count =
            tab.value === "ALL"
              ? devices.length
              : devices.filter((d) => d.category === tab.value).length;
          if (count === 0) return null;
          const selected = category === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setCategory(tab.value);
                setMins({});
              }}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                selected
                  ? "border-[var(--signal)] bg-[var(--signal)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--signal)]/40"
              }`}
            >
              {tab.label}
              <span className={selected ? "ml-1 text-white/70" : "ml-1 text-[var(--ink-faint)]"}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {SLIDERS.map((spec) => {
          const { min, max } = bounds[spec.key];
          // A slider whose whole range is a single value can't filter anything,
          // so it is left out rather than shown as a dead control.
          if (max <= min) return null;

          const value = mins[spec.key] ?? min;
          const isActive = value > min;

          return (
            <div
              key={spec.key}
              className={`rounded-xl border px-3 py-2.5 transition ${
                isActive ? "border-[var(--signal)]/40 bg-[var(--signal)]/[0.04]" : "border-[var(--line)] bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: isActive ? "var(--signal)" : "var(--mist)",
                    color: isActive ? "#fff" : "var(--ink-faint)",
                  }}
                >
                  <MetricIcon kind={spec.icon} className="h-3.5 w-3.5" />
                </span>

                <label
                  htmlFor={`req-${spec.key}`}
                  className="w-[152px] shrink-0 text-[11.5px] font-semibold text-[var(--ink)]"
                >
                  {spec.label}
                  <span className="ml-1 font-normal text-[var(--ink-faint)]">at least</span>
                </label>

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="spec-value hidden w-[46px] shrink-0 text-right text-[9.5px] text-[var(--ink-faint)] sm:block">
                    {min.toFixed(spec.decimals)}
                  </span>
                  <input
                    id={`req-${spec.key}`}
                    type="range"
                    min={min}
                    max={max}
                    step={spec.step}
                    value={value}
                    onChange={(e) =>
                      setMins((prev) => ({ ...prev, [spec.key]: Number(e.target.value) }))
                    }
                    className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--mist)]"
                    style={{ accentColor: "var(--signal)" }}
                  />
                  <span className="spec-value hidden w-[46px] shrink-0 text-[9.5px] text-[var(--ink-faint)] sm:block">
                    {max.toFixed(spec.decimals)}
                  </span>
                </div>

                <span
                  className="spec-value w-[84px] shrink-0 text-right text-[12px] font-bold"
                  style={{ color: isActive ? "var(--signal)" : "var(--ink-faint)" }}
                >
                  {value.toFixed(spec.decimals)}
                  {spec.unit}
                </span>
              </div>
            </div>
          );
        })}

        {bounds.priceEur.max > bounds.priceEur.min && (
          <div
            className={`rounded-xl border px-3 py-2.5 transition ${
              priceActive ? "border-[var(--signal)]/40 bg-[var(--signal)]/[0.04]" : "border-[var(--line)] bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold"
                style={{
                  background: priceActive ? "var(--signal)" : "var(--mist)",
                  color: priceActive ? "#fff" : "var(--ink-faint)",
                }}
              >
                €
              </span>

              <label
                htmlFor="req-price"
                className="w-[152px] shrink-0 text-[11.5px] font-semibold text-[var(--ink)]"
              >
                Launch price
                <span className="ml-1 font-normal text-[var(--ink-faint)]">up to</span>
              </label>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="spec-value hidden w-[46px] shrink-0 text-right text-[9.5px] text-[var(--ink-faint)] sm:block">
                  {bounds.priceEur.min}
                </span>
                <input
                  id="req-price"
                  type="range"
                  min={bounds.priceEur.min}
                  max={bounds.priceEur.max}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => setMaxPriceRaw(Number(e.target.value))}
                  className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--mist)]"
                  style={{ accentColor: "var(--signal)" }}
                />
                <span className="spec-value hidden w-[46px] shrink-0 text-[9.5px] text-[var(--ink-faint)] sm:block">
                  {bounds.priceEur.max}
                </span>
              </div>

              <span
                className="spec-value w-[84px] shrink-0 text-right text-[12px] font-bold"
                style={{ color: priceActive ? "var(--signal)" : "var(--ink-faint)" }}
              >
                €{maxPrice.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[var(--line)] pt-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
          {anyFilter
            ? `${results.length} device${results.length === 1 ? "" : "s"} match`
            : `${scoped.length} in this category — move a slider to narrow`}
        </p>

        {anyFilter && results.length === 0 && (
          <p className="text-[12px] text-[var(--ink-soft)]">
            Nothing in the catalog meets all of those minimums. Try easing one back.
          </p>
        )}

        {anyFilter && results.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {results.slice(0, 12).map((d) => (
              <Link
                key={d.slug}
                href={`/devices/${d.slug}`}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-white px-3 py-2 transition hover:border-[var(--signal)]/40"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.brandAccent }} />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[var(--ink)]">
                  {d.name}
                </span>
                <span className="hidden shrink-0 text-[11px] text-[var(--ink-faint)] sm:block">
                  {d.chipsetName}
                </span>
                {d.score != null && (
                  <span className="spec-value shrink-0 text-[11.5px] font-semibold text-[var(--signal)]">
                    {d.score.toLocaleString()}
                  </span>
                )}
                <span className="spec-value w-[62px] shrink-0 text-right text-[11px] text-[var(--ink-soft)]">
                  {d.priceEur != null ? `€${d.priceEur.toLocaleString()}` : "—"}
                </span>
              </Link>
            ))}
            {results.length > 12 && (
              <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
                …and {results.length - 12} more.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
