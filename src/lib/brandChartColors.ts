import { SLOT_COLORS } from "./compareColors";

// Apple's and Samsung's real brand blues sit too close together for a
// multi-series chart legend (CVD ΔE < 8, normal-vision ΔE < 15 — validated
// via the dataviz skill's palette script). So chart identity uses the app's
// existing validated categorical triple instead of literal brand hex codes;
// brand recognizability comes from the legend label + swatch, not hue alone.
export const BRAND_CHART_ORDER = ["apple", "xiaomi", "samsung"] as const;

export const BRAND_CHART_COLORS: Record<(typeof BRAND_CHART_ORDER)[number], string> = {
  apple: SLOT_COLORS[0],
  xiaomi: SLOT_COLORS[1],
  samsung: SLOT_COLORS[2],
};
