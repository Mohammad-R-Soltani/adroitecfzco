"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPEC_CATEGORIES, QUICK_METRICS, type QuickMetric } from "@/lib/specSchema";
import type { BenchmarkRow } from "@/lib/benchmarks";
import { computeWinTally } from "@/lib/compareWins";
import { SLOT_COLORS } from "@/lib/compareColors";
import DevicePicker, { type PickerDevice } from "./DevicePicker";
import MetricIcon from "./MetricIcon";
import BenchmarkBattle from "./BenchmarkBattle";
import OverallScore from "./OverallScore";
import SpecRadar from "./SpecRadar";

export type CompareDevice = PickerDevice & {
  releaseDate: string;
  chipsetSlug: string;
  spec: Record<string, string | number | null> | null;
  benchmarks: BenchmarkRow[];
};

const MAX_SLOTS = 3;

export default function CompareView({
  allDevices,
  selected,
}: {
  allDevices: PickerDevice[];
  selected: CompareDevice[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);

  const setSlugs = useCallback(
    (slugs: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slugs.length) params.set("d", slugs.join(","));
      else params.delete("d");
      router.replace(`/compare?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const addDevice = (device: PickerDevice) => {
    const next = [...selected.map((d) => d.slug), device.slug].slice(0, MAX_SLOTS);
    setPickerOpen(false);
    setSlugs(next);
  };

  const removeDevice = (slug: string) => {
    setSlugs(selected.filter((d) => d.slug !== slug).map((d) => d.slug));
  };

  const availableDevices = useMemo(
    () => allDevices.filter((d) => !selected.some((s) => s.slug === d.slug)),
    [allDevices, selected]
  );

  const columns = selected.length || 1;

  const rowHasDifference = (key: string) => {
    const values = selected.map((d) => d.spec?.[key] ?? null);
    const present = values.filter(Boolean);
    if (present.length === 0) return false;
    if (selected.length < 2) return true;
    return new Set(values.map((v) => String(v ?? ""))).size > 1;
  };

  if (selected.length === 0) {
    return (
      <>
        <EmptyState onAdd={() => setPickerOpen(true)} />
        <AnimatePresence>
          {pickerOpen && (
            <DevicePicker
              devices={availableDevices}
              onPick={addDevice}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  const { tally, totalCategories } = computeWinTally(selected);

  const radarDevices = selected.map((d) => ({
    slug: d.slug,
    name: d.name,
    displayInches: typeof d.spec?.displayInches === "number" ? d.spec.displayInches : null,
    batteryMah: typeof d.spec?.batteryMah === "number" ? d.spec.batteryMah : null,
    chargingWatts: typeof d.spec?.chargingWatts === "number" ? d.spec.chargingWatts : null,
    mainCameraMp: typeof d.spec?.mainCameraMp === "number" ? d.spec.mainCameraMp : null,
    refreshRateHz: typeof d.spec?.refreshRateHz === "number" ? d.spec.refreshRateHz : null,
    weightGrams: typeof d.spec?.weightGrams === "number" ? d.spec.weightGrams : null,
    geekbenchMulti:
      d.benchmarks.find((b) => b.family === "GEEKBENCH_6" && b.metric === "MULTI_CORE")?.value ?? null,
  }));

  return (
    <>
      {/* Device header row — sticks so labels stay attached while scanning specs */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-[var(--line)] bg-white/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div
          className="grid gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(columns + (selected.length < MAX_SLOTS ? 1 : 0), MAX_SLOTS)}, minmax(0, 1fr))` }}
        >
          {selected.map((device, i) => (
            <motion.div
              key={device.slug}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface-card relative flex flex-col items-center rounded-2xl border border-[var(--line)] p-2.5 text-center shadow-sm"
            >
              <span
                className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                style={{ background: SLOT_COLORS[i % SLOT_COLORS.length] }}
              />
              <button
                type="button"
                onClick={() => removeDevice(device.slug)}
                aria-label={`Remove ${device.name}`}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--ink-faint)] transition hover:bg-red-50 hover:text-red-500"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>

              <div className="relative mt-1.5 h-16 w-16 overflow-hidden rounded-xl bg-[var(--mist)] sm:h-20 sm:w-20">
                {device.imageUrl ? (
                  <Image src={device.imageUrl} alt={device.name} fill sizes="80px" className="object-cover" />
                ) : (
                  <span
                    className="flex h-full items-center justify-center text-lg font-bold text-white"
                    style={{ background: device.brandAccent }}
                  >
                    {device.name.charAt(0)}
                  </span>
                )}
              </div>

              <Link
                href={`/devices/${device.slug}`}
                className="mt-2 line-clamp-2 text-[12.5px] font-bold leading-tight text-[var(--ink)] hover:text-[var(--signal)] sm:text-sm"
              >
                {device.name}
              </Link>
              <Link
                href={`/chipsets/${device.chipsetSlug}`}
                className="mt-0.5 flex items-center gap-1 text-[10.5px] text-[var(--ink-faint)] hover:text-[var(--signal)]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: device.brandAccent }} />
                <span className="line-clamp-1">{device.chipsetName}</span>
              </Link>
            </motion.div>
          ))}

          {selected.length < MAX_SLOTS && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--line)] text-[var(--ink-faint)] transition hover:border-[var(--signal)]/50 hover:bg-[var(--signal)]/5 hover:text-[var(--signal)]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] font-semibold">Add device</span>
            </button>
          )}
        </div>
      </div>

      {/* Signature: the multi-dimensional silhouette */}
      <section className="mt-6">
        <SpecRadar devices={radarDevices} />
      </section>

      {/* Overall — a plain, transparent win count across every comparable category */}
      {selected.length > 1 && (
        <section className="mt-6">
          <OverallScore
            devices={selected.map((d) => ({ slug: d.slug, name: d.name }))}
            tally={tally}
            totalCategories={totalCategories}
          />
        </section>
      )}

      {/* Real, sourced, versioned benchmark battle */}
      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-bold text-[var(--ink)]">Benchmark battle</h2>
          <span className="text-[10.5px] text-[var(--ink-faint)]">Tap ⓘ on any score for its source</span>
        </div>
        <BenchmarkBattle
          devices={selected.map((d) => ({
            slug: d.slug,
            name: d.name,
            brandAccent: d.brandAccent,
            benchmarks: d.benchmarks,
          }))}
        />
      </section>

      {/* At-a-glance physical specs */}
      <section className="mt-8">
        <h2 className="font-display mb-3 text-sm font-bold text-[var(--ink)]">Physical &amp; hardware</h2>
        <div className="flex flex-col gap-2.5">
          {QUICK_METRICS.map((metric) => (
            <MetricRow key={metric.key} metric={metric} devices={selected} />
          ))}
        </div>
      </section>

      {/* Full spec sheet */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-[var(--ink)]">Full specifications</h2>
          {selected.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllRows((v) => !v)}
              className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-soft)] transition hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
            >
              {showAllRows ? "Only differences" : "Show all rows"}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {SPEC_CATEGORIES.map((category) => {
            const rows = category.rows.filter(
              (row) => showAllRows || selected.length < 2 || rowHasDifference(row.key)
            );
            const populated = rows.filter((row) =>
              selected.some((d) => d.spec?.[row.key])
            );
            if (populated.length === 0) return null;

            return (
              <div
                key={category.name}
                className="surface-card overflow-hidden rounded-2xl border border-[var(--line)] shadow-sm"
              >
                <h3 className="border-b border-[var(--line)] bg-[var(--mist)] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                  {category.name}
                </h3>
                <div className="divide-y divide-[var(--line)]">
                  {populated.map((row) => (
                    <div key={row.key} className="px-3 py-2.5">
                      <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                        {row.label}
                      </p>
                      <div
                        className="grid gap-2 sm:gap-3"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                      >
                        {selected.map((device) => (
                          <p
                            key={device.slug}
                            className="text-[12px] leading-relaxed text-[var(--ink)]"
                          >
                            {device.spec?.[row.key] ? (
                              String(device.spec[row.key])
                            ) : (
                              <span className="text-[var(--ink-faint)]">—</span>
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-[var(--ink-faint)]">
          Spec sheets sourced from GSMArena. Benchmark scores each carry their own named
          source, tested variant and date — tap the ⓘ next to any score above to see it.
          Different benchmark versions (Geekbench 5 vs 6, AnTuTu v10 vs v11, …) are never
          mixed into the same ranking. Confirm pricing, regional variants and availability
          internally before quoting.
        </p>
      </section>

      <AnimatePresence>
        {pickerOpen && (
          <DevicePicker
            devices={availableDevices}
            onPick={addDevice}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function MetricRow({
  metric,
  devices,
}: {
  metric: QuickMetric;
  devices: CompareDevice[];
}) {
  const values = devices.map((d) => {
    const raw = d.spec?.[metric.key];
    return typeof raw === "number" ? raw : null;
  });

  if (values.every((v) => v == null)) return null;

  const present = values.filter((v): v is number => v != null);
  const max = Math.max(...present);
  const best = metric.higherIsBetter ? Math.max(...present) : Math.min(...present);
  const allSame = new Set(present).size === 1;

  return (
    <div className="surface-card rounded-2xl border border-[var(--line)] p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-[var(--signal)]">
          <MetricIcon kind={metric.icon} className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
          {metric.label}
        </p>
      </div>

      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${devices.length}, minmax(0, 1fr))` }}
      >
        {devices.map((device, i) => {
          const value = values[i];
          const isBest = value != null && value === best && !allSame && devices.length > 1;
          const pct = value != null ? Math.max(6, Math.round((value / max) * 100)) : 0;
          const color = SLOT_COLORS[i % SLOT_COLORS.length];

          return (
            <div key={device.slug}>
              <div className="mb-1 flex items-baseline gap-1.5">
                <span
                  className="spec-value text-sm font-bold"
                  style={{ color: isBest ? color : "var(--ink)" }}
                >
                  {value != null ? `${value}${metric.unit}` : "—"}
                </span>
                {isBest && (
                  <span
                    className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white"
                    style={{ background: color }}
                  >
                    Best
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--mist)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-[var(--line)] bg-white/60 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--signal)]/10 text-[var(--signal)]">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path d="M6 20V10M12 20V4M18 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="font-display text-lg font-bold text-[var(--ink)]">Compare up to three devices</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[var(--ink-soft)]">
        Put two or three handsets side by side — a real, source-backed benchmark battle,
        a multi-spec silhouette, and the full sheet, screen to battery to chipset.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--signal)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--signal-deep)]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Add the first device
      </button>
    </div>
  );
}
