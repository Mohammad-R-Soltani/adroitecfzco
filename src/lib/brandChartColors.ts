// The three brand colours used everywhere in the app — filters, pills,
// compare views and every chart — so a colour means the same brand no matter
// where it is seen. These match Brand.accent in the database exactly.
//
// Apple's blue and Samsung's navy sit closer together than a chart legend
// would ideally want under colour-vision-deficiency simulation; that tradeoff
// is deliberate here in favour of one consistent identity per brand across
// the whole product, so a chart is never the one place a brand's colour
// looks different. Charts with two or more of these series always keep the
// legend swatch + label alongside the colour, so identity never rests on hue
// alone.
export const BRAND_CHART_ORDER = ["apple", "xiaomi", "samsung"] as const;

export const BRAND_CHART_COLORS: Record<(typeof BRAND_CHART_ORDER)[number], string> = {
  apple: "#1D1D1F",
  xiaomi: "#FF6900",
  samsung: "#2196F3",
};
