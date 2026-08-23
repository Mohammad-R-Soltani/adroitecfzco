// Every benchmark shown anywhere in the app must trace back to one row in
// DeviceBenchmark — a real, dated, sourced measurement. Nothing here
// generates, estimates or averages a score. Families are never mixed:
// Geekbench 5 never ranks against Geekbench 6, AnTuTu v10 never against v11.

export type BenchmarkFamily =
  | "GEEKBENCH_5"
  | "GEEKBENCH_6"
  | "ANTUTU_V9"
  | "ANTUTU_V10"
  | "ANTUTU_V11"
  | "THREEDMARK_WILD_LIFE"
  | "THREEDMARK_WILD_LIFE_EXTREME"
  | "THREEDMARK_STEEL_NOMAD_LIGHT"
  | "THREEDMARK_STEEL_NOMAD";

export type BenchmarkMetric =
  | "SINGLE_CORE"
  | "MULTI_CORE"
  | "TOTAL"
  | "CPU_SCORE"
  | "GPU_SCORE"
  | "MEM_SCORE"
  | "UX_SCORE"
  | "SCORE"
  | "FPS";

export type BenchmarkRow = {
  family: BenchmarkFamily;
  metric: BenchmarkMetric;
  value: number;
  testedVariant: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string | null;
  notes: string | null;
};

const FAMILY_LABELS: Record<BenchmarkFamily, string> = {
  GEEKBENCH_5: "Geekbench 5",
  GEEKBENCH_6: "Geekbench 6",
  ANTUTU_V9: "AnTuTu v9",
  ANTUTU_V10: "AnTuTu v10",
  ANTUTU_V11: "AnTuTu v11",
  THREEDMARK_WILD_LIFE: "3DMark Wild Life",
  THREEDMARK_WILD_LIFE_EXTREME: "3DMark Wild Life Extreme",
  THREEDMARK_STEEL_NOMAD_LIGHT: "3DMark Steel Nomad Light",
  THREEDMARK_STEEL_NOMAD: "3DMark Steel Nomad",
};

const METRIC_LABELS: Record<BenchmarkMetric, string> = {
  SINGLE_CORE: "Single-core",
  MULTI_CORE: "Multi-core",
  TOTAL: "Total",
  CPU_SCORE: "CPU",
  GPU_SCORE: "GPU",
  MEM_SCORE: "Memory",
  UX_SCORE: "UX",
  SCORE: "Score",
  FPS: "FPS",
};

/** A stable key for one exact (family, metric) pair — never compare across keys. */
export function benchmarkKey(family: BenchmarkFamily, metric: BenchmarkMetric) {
  return `${family}::${metric}`;
}

export function benchmarkLabel(family: BenchmarkFamily, metric: BenchmarkMetric) {
  return `${FAMILY_LABELS[family]} — ${METRIC_LABELS[metric]}`;
}

export function familyLabel(family: BenchmarkFamily) {
  return FAMILY_LABELS[family];
}

export function metricLabel(metric: BenchmarkMetric) {
  return METRIC_LABELS[metric];
}

/**
 * Groups benchmark rows (already loaded per device) into per-(family,metric)
 * battle groups across the given devices. A device only appears in a group
 * if it has that *exact* reading — a device with only Geekbench 5 never
 * shows up in a Geekbench 6 group, and is never backfilled with a guess.
 */
export function groupBenchmarksForCompare<D extends { slug: string; benchmarks: BenchmarkRow[] }>(
  devices: D[]
) {
  const groups = new Map<
    string,
    { family: BenchmarkFamily; metric: BenchmarkMetric; entries: { deviceSlug: string; row: BenchmarkRow }[] }
  >();

  for (const device of devices) {
    for (const row of device.benchmarks) {
      const key = benchmarkKey(row.family, row.metric);
      if (!groups.has(key)) {
        groups.set(key, { family: row.family, metric: row.metric, entries: [] });
      }
      groups.get(key)!.entries.push({ deviceSlug: device.slug, row });
    }
  }

  // Prefer CPU/GPU headline groups first, then the rest, each internally
  // ordered by how many of the selected devices actually have that reading.
  const priority: string[] = [
    benchmarkKey("GEEKBENCH_6", "MULTI_CORE"),
    benchmarkKey("GEEKBENCH_6", "SINGLE_CORE"),
    benchmarkKey("ANTUTU_V11", "TOTAL"),
    benchmarkKey("ANTUTU_V10", "TOTAL"),
    benchmarkKey("ANTUTU_V9", "TOTAL"),
    benchmarkKey("THREEDMARK_WILD_LIFE_EXTREME", "SCORE"),
    benchmarkKey("THREEDMARK_WILD_LIFE", "SCORE"),
    benchmarkKey("THREEDMARK_STEEL_NOMAD_LIGHT", "SCORE"),
    benchmarkKey("THREEDMARK_STEEL_NOMAD", "SCORE"),
    benchmarkKey("GEEKBENCH_5", "MULTI_CORE"),
    benchmarkKey("GEEKBENCH_5", "SINGLE_CORE"),
  ];

  return [...groups.entries()]
    .sort((a, b) => {
      const pa = priority.indexOf(a[0]);
      const pb = priority.indexOf(b[0]);
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb);
      return b[1].entries.length - a[1].entries.length;
    })
    .map(([key, group]) => ({ key, ...group }));
}
