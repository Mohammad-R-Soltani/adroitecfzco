"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

type Filter = {
  key: keyof MatcherDevice;
  label: string;
  unit: string;
  steps: number[];
};

// Only fields that are real parsed numbers on the spec sheet — nothing here is
// derived or estimated, so a device is excluded when its value is unknown
// rather than assumed to pass.
const FILTERS: Filter[] = [
  { key: "batteryMah", label: "Battery at least", unit: "mAh", steps: [4000, 4500, 5000, 5500, 6000] },
  { key: "chargingWatts", label: "Charging at least", unit: "W", steps: [25, 45, 67, 90, 120] },
  { key: "displayInches", label: "Screen at least", unit: '"', steps: [6.1, 6.4, 6.7, 6.8] },
  { key: "refreshRateHz", label: "Refresh at least", unit: "Hz", steps: [90, 120, 144] },
  { key: "mainCameraMp", label: "Main camera at least", unit: "MP", steps: [12, 48, 50, 108, 200] },
  { key: "score", label: "Geekbench 6 at least", unit: "pts", steps: [6000, 7000, 8000, 9000, 10000] },
];

export default function RequirementMatcher({ devices }: { devices: MatcherDevice[] }) {
  const [mins, setMins] = useState<Partial<Record<string, number>>>({});
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const active = Object.entries(mins).filter(([, v]) => v != null);

  const results = useMemo(() => {
    return devices
      .filter((d) => {
        for (const [key, min] of active) {
          const value = d[key as keyof MatcherDevice];
          if (typeof value !== "number" || value < (min as number)) return false;
        }
        if (maxPrice != null && (d.priceEur == null || d.priceEur > maxPrice)) return false;
        return true;
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [devices, active, maxPrice]);

  const anyFilter = active.length > 0 || maxPrice != null;

  return (
    <div className="surface-card rounded-2xl border border-[var(--line)] p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-bold text-[var(--ink)]">Match a buyer&apos;s requirements</h2>
          <p className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">
            Set the minimums a client asked for — devices with no published figure for a filter
            you set are excluded rather than assumed to pass.
          </p>
        </div>
        {anyFilter && (
          <button
            type="button"
            onClick={() => {
              setMins({});
              setMaxPrice(null);
            }}
            className="shrink-0 rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-soft)] transition hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {FILTERS.map((filter) => (
          <div key={filter.key} className="flex flex-wrap items-center gap-1.5">
            <span className="w-[150px] shrink-0 text-[11px] font-medium text-[var(--ink-soft)]">
              {filter.label}
            </span>
            {filter.steps.map((step) => {
              const selected = mins[filter.key] === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() =>
                    setMins((prev) => ({ ...prev, [filter.key]: selected ? undefined : step }))
                  }
                  className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
                    selected
                      ? "border-[var(--signal)] bg-[var(--signal)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--signal)]/40"
                  }`}
                >
                  {step}
                  {filter.unit}
                </button>
              );
            })}
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-[150px] shrink-0 text-[11px] font-medium text-[var(--ink-soft)]">
            Launch price up to
          </span>
          {[400, 600, 800, 1000].map((step) => {
            const selected = maxPrice === step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => setMaxPrice(selected ? null : step)}
                className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
                  selected
                    ? "border-[var(--signal)] bg-[var(--signal)] text-white"
                    : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--signal)]/40"
                }`}
              >
                €{step}
              </button>
            );
          })}
        </div>
      </div>

      {anyFilter && (
        <div className="mt-4 border-t border-[var(--line)] pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
            {results.length} device{results.length === 1 ? "" : "s"} match
          </p>
          {results.length === 0 ? (
            <p className="text-[12px] text-[var(--ink-soft)]">
              Nothing in the catalog meets all of those minimums. Try relaxing one.
            </p>
          ) : (
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
                  {d.priceEur != null && (
                    <span className="spec-value w-[62px] shrink-0 text-right text-[11px] text-[var(--ink-soft)]">
                      €{d.priceEur.toLocaleString()}
                    </span>
                  )}
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
      )}
    </div>
  );
}
