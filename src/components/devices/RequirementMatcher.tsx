"use client";

import { useEffect, useMemo, useState } from "react";
import MetricIcon from "@/components/compare/MetricIcon";
import DeviceCard from "@/components/DeviceCard";

export type MatcherDevice = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  brandSlug: string;
  brandName: string;
  brandAccent: string;
  chipsetSlug: string;
  chipsetName: string;
  chipsetGradientFrom: string;
  chipsetGradientTo: string;
  category: string;
  batteryMah: number | null;
  chargingWatts: number | null;
  displayInches: number | null;
  refreshRateHz: number | null;
  mainCameraMp: number | null;
  score: number | null;
  priceEur: number | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  PHONE: "Phones",
  TABLET: "Tablets",
  LAPTOP: "Laptops",
  WATCH: "Watches",
  EARBUDS: "Earbuds",
};
const CATEGORY_ORDER = ["PHONE", "TABLET", "LAPTOP", "WATCH", "EARBUDS"];

// Filter state survives a trip to a device page and back (sessionStorage
// outlives the client-side navigation that would otherwise reset this
// component's state), so re-opening the list after checking one device
// doesn't throw away everything a buyer just dialled in.
const STORAGE_KEY = "devices-matcher-filters-v1";

type StoredState = {
  brand: string;
  category: string;
  mins: Partial<Record<NumericKey, number>>;
  maxPriceRaw: number | null;
  selectedChipsets: string[];
};

function loadStored(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredState) : null;
  } catch {
    return null;
  }
}

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

/** Small selected-state check, so an active pill reads at a glance rather than
    by colour saturation alone. */
function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4.5 10.5l3.5 3.5 7-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  // Brand narrows first, then category — a trader usually knows which brand a
  // client wants before anything else, so it leads the filter stack.
  // Always mount with the server-rendered defaults — reading sessionStorage
  // here would make the client's first render disagree with the server's
  // HTML and trip a hydration mismatch. The stored filters are applied a
  // moment later instead, from the effect below.
  const [brand, setBrand] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("PHONE");

  const brandOptions = useMemo(() => {
    const counts = new Map<string, { slug: string; name: string; accent: string; count: number }>();
    for (const d of devices) {
      const entry = counts.get(d.brandSlug);
      if (entry) entry.count++;
      else counts.set(d.brandSlug, { slug: d.brandSlug, name: d.brandName, accent: d.brandAccent, count: 1 });
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [devices]);

  const byBrand = useMemo(
    () => (brand === "ALL" ? devices : devices.filter((d) => d.brandSlug === brand)),
    [devices, brand],
  );

  const scoped = useMemo(
    () => (category === "ALL" ? byBrand : byBrand.filter((d) => d.category === category)),
    [byBrand, category],
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
  const [selectedChipsets, setSelectedChipsets] = useState<Set<string>>(new Set());

  // Guards the save effect below. Without it, the save effect's very first
  // run (right after mount, in the same tick as the restore below) fires
  // with the pre-restore default values — since the restore's setState calls
  // are batched and haven't been applied to this render yet — and clobbers
  // whatever was in storage before the restored values ever get a chance to
  // land. Gating the write on `hydrated` (itself set true in the same batch
  // as the restored values) means the first write to actually happen always
  // carries the real, restored state.
  const [hydrated, setHydrated] = useState(false);

  // Restore whatever was picked before navigating away, once, right after
  // mount — the effect body runs on the client only, after hydration.
  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setBrand(stored.brand);
      setCategory(stored.category);
      setMins(stored.mins);
      setMaxPriceRaw(stored.maxPriceRaw);
      setSelectedChipsets(new Set(stored.selectedChipsets));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persisted on every change rather than only on unmount, since a full page
  // navigation (to a device, then back) doesn't reliably fire a cleanup here.
  useEffect(() => {
    if (!hydrated) return;
    const state: StoredState = {
      brand,
      category,
      mins,
      maxPriceRaw,
      selectedChipsets: [...selectedChipsets],
    };
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private browsing, quota) — filters just
      // won't survive the round trip in that case, which is not worth
      // surfacing to the buyer mid-search.
    }
  }, [hydrated, brand, category, mins, maxPriceRaw, selectedChipsets]);

  // Chipset options are scoped to the category in view, same as the sliders —
  // counted here rather than read off `results`, so picking a chipset never
  // removes its own option from the list.
  const chipsetOptions = useMemo(() => {
    const counts = new Map<string, { slug: string; name: string; count: number }>();
    for (const d of scoped) {
      const entry = counts.get(d.chipsetSlug);
      if (entry) entry.count++;
      else counts.set(d.chipsetSlug, { slug: d.chipsetSlug, name: d.chipsetName, count: 1 });
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [scoped]);

  const activeMins = (Object.entries(mins) as [NumericKey, number][]).filter(
    ([key, value]) => value > bounds[key].min,
  );
  const priceActive = maxPriceRaw != null && maxPriceRaw < bounds.priceEur.max;
  const chipsetActive = selectedChipsets.size > 0;
  const anyFilter = activeMins.length > 0 || priceActive || chipsetActive;

  const results = useMemo(() => {
    return scoped
      .filter((d) => {
        for (const [key, min] of activeMins) {
          const value = d[key];
          if (typeof value !== "number" || value < min) return false;
        }
        if (priceActive && (d.priceEur == null || d.priceEur > maxPrice)) return false;
        if (chipsetActive && !selectedChipsets.has(d.chipsetSlug)) return false;
        return true;
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [scoped, activeMins, priceActive, maxPrice, chipsetActive, selectedChipsets]);

  function toggleChipset(slug: string) {
    setSelectedChipsets((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function reset() {
    setBrand("ALL");
    setMins({});
    setMaxPriceRaw(null);
    setSelectedChipsets(new Set());
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

      {/* Brand leads the filter stack — each pill carries that brand's own
          colour when picked, so which one is active reads instantly instead
          of every control competing for the same blue. */}
      {brandOptions.length > 1 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
            Brand
          </p>
          <div className="flex flex-wrap gap-1.5">
            {brandOptions.map((b) => {
              const selected = brand === b.slug;
              return (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => {
                    // A category the new brand doesn't carry (e.g. Xiaomi has
                    // no watches) would otherwise leave no tab highlighted at
                    // all, so the view falls back to the default category.
                    setBrand(selected ? "ALL" : b.slug);
                    setCategory("PHONE");
                    setMins({});
                    setSelectedChipsets(new Set());
                  }}
                  aria-pressed={selected}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition"
                  style={
                    selected
                      ? { borderColor: b.accent, background: b.accent, color: "#fff" }
                      : { borderColor: "var(--line)", background: "#fff", color: "var(--ink-soft)" }
                  }
                >
                  {selected && <CheckMark className="h-3 w-3" />}
                  {b.name}
                  <span className={selected ? "text-white/70" : "text-[var(--ink-faint)]"}>{b.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category next — the sliders' ranges are computed from whichever
          category is in view, so phone filters aren't stretched by tablets. */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORY_TABS.map((tab) => {
          const count =
            tab.value === "ALL" ? byBrand.length : byBrand.filter((d) => d.category === tab.value).length;
          if (count === 0) return null;
          const selected = category === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setCategory(tab.value);
                setMins({});
                setSelectedChipsets(new Set());
              }}
              aria-pressed={selected}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                selected
                  ? "border-[var(--signal)] bg-[var(--signal)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--signal)]/40"
              }`}
            >
              {selected && <CheckMark className="h-3 w-3" />}
              {tab.label}
              <span className={selected ? "text-white/70" : "text-[var(--ink-faint)]"}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Chipset is an identity filter, not a range — a strict yes/no toggle
          list reads cleaner here than trying to force it onto a slider. */}
      {chipsetOptions.length > 1 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
            Chipset
          </p>
          <div className="flex flex-wrap gap-1.5">
            {chipsetOptions.map((c) => {
              const selected = selectedChipsets.has(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggleChipset(c.slug)}
                  aria-pressed={selected}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                    selected
                      ? "border-[var(--signal)] bg-[var(--signal)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--signal)]/40"
                  }`}
                >
                  {selected && <CheckMark className="h-3 w-3" />}
                  {c.name}
                  <span className={selected ? "text-white/70" : "text-[var(--ink-faint)]"}>{c.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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

      <p className="mb-3 mt-4 border-t border-[var(--line)] pt-3 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
        {results.length} device{results.length === 1 ? "" : "s"} match
      </p>

      {results.length === 0 && (
        <p className="text-[12px] text-[var(--ink-soft)]">
          Nothing in the catalog meets all of those minimums. Try easing one back.
        </p>
      )}

      {/* The whole point of the filters: this grid is always exactly what
          brand + category + chipset + every slider currently narrow it to —
          never a separate, differently-scoped list. */}
      <div className="space-y-8">
        {CATEGORY_ORDER.map((cat) => {
          const inCategory = results.filter((d) => d.category === cat);
          if (inCategory.length === 0) return null;
          return (
            <section key={cat}>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--ink-faint)]">
                {CATEGORY_LABELS[cat] ?? cat} ({inCategory.length})
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {inCategory.map((d) => (
                  <DeviceCard
                    key={d.id}
                    device={{
                      slug: d.slug,
                      name: d.name,
                      category: d.category,
                      imageUrl: d.imageUrl,
                      chipset: {
                        name: d.chipsetName,
                        slug: d.chipsetSlug,
                        gradientFrom: d.chipsetGradientFrom,
                        gradientTo: d.chipsetGradientTo,
                      },
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
