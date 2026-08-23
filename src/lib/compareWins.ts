import { QUICK_METRICS } from "./specSchema";
import { groupBenchmarksForCompare, type BenchmarkRow } from "./benchmarks";

export type WinTally = {
  slug: string;
  wins: number;
  categories: string[]; // labels of what this device won, for the tooltip/detail
};

/**
 * Counts, transparently, how many comparable categories each device "wins"
 * — a category only counts when at least two devices have a real value for
 * it and there's no tie. This is a plain win-count, not a weighted or
 * invented score: 1 category = 1 point, full stop.
 */
export function computeWinTally<
  D extends {
    slug: string;
    spec: Record<string, string | number | null> | null;
    benchmarks: BenchmarkRow[];
  },
>(devices: D[]): { tally: WinTally[]; totalCategories: number } {
  const wins = new Map<string, WinTally>(devices.map((d) => [d.slug, { slug: d.slug, wins: 0, categories: [] }]));
  let totalCategories = 0;

  // Physical / hardware quick metrics
  for (const metric of QUICK_METRICS) {
    const values = devices
      .map((d) => ({ slug: d.slug, value: typeof d.spec?.[metric.key] === "number" ? (d.spec![metric.key] as number) : null }))
      .filter((v): v is { slug: string; value: number } => v.value != null);

    if (values.length < 2) continue;
    const best = metric.higherIsBetter ? Math.max(...values.map((v) => v.value)) : Math.min(...values.map((v) => v.value));
    const winners = values.filter((v) => v.value === best);
    if (winners.length !== 1) continue; // tie — nobody gets the point

    totalCategories++;
    const entry = wins.get(winners[0].slug)!;
    entry.wins++;
    entry.categories.push(metric.label);
  }

  // Benchmark groups (each exact family+metric pair is its own category)
  const groups = groupBenchmarksForCompare(devices);
  for (const group of groups) {
    if (group.entries.length < 2) continue;
    const best = Math.max(...group.entries.map((e) => e.row.value));
    const winners = group.entries.filter((e) => e.row.value === best);
    if (winners.length !== 1) continue;

    totalCategories++;
    const entry = wins.get(winners[0].deviceSlug)!;
    entry.wins++;
    entry.categories.push(`${group.family} ${group.metric}`);
  }

  return { tally: [...wins.values()], totalCategories };
}
