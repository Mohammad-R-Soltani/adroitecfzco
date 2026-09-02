// Fixed hue order for chipset SERIES (e.g. "A-series", "Snapdragon"), used in
// the market-trend chart. Validated as the dataviz skill's default 8-slot
// categorical theme (adjacent-pair CVD ΔE >= 8.4, normal-vision >= 19.3, both
// modes) — https://oklab palette, blue/orange/aqua/yellow/magenta/green/violet/red.
// Order must stay FIXED as new series ship: always APPEND a newly-seen series
// to the next free slot, never re-sort or re-assign existing ones. Past 8
// distinct series, fold the rest into "Other" rather than reusing a hue.
export const SERIES_CHART_ORDER = [
  "A-series",
  "M-series",
  "Snapdragon",
  "MediaTek Dimensity",
  "XRing",
] as const;

const SLOT_HEXES = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
] as const;

export const SERIES_CHART_COLORS: Record<string, string> = Object.fromEntries(
  SERIES_CHART_ORDER.map((series, i) => [series, SLOT_HEXES[i % SLOT_HEXES.length]]),
);

export function colorForSeries(series: string, fallbackIndex: number): string {
  return SERIES_CHART_COLORS[series] ?? SLOT_HEXES[fallbackIndex % SLOT_HEXES.length];
}
