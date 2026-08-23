import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Every row below was pulled from a single, named, dated article that was
// fetched directly (not inferred from an aggregated search summary). Where a
// number couldn't be pinned to one fetched, dated source with a known
// benchmark version, the device is deliberately left out — see the
// conversation notes for iPhone Air / Xiaomi 17 Pro / iPad Pro M5 multi-core.
const ROWS = [
  {
    slug: "xiaomi-15s-pro",
    sourceName: "Notebookcheck",
    sourceUrl:
      "https://www.notebookcheck.net/Xiaomi-15S-Pro-review-Newfound-independence-and-strong-battery-life-in-a-flagship-smartphone.1047332.0.html",
    sourceDate: "2025-06-26",
    testedVariant: "16GB/512GB",
    notes: "From Notebookcheck's full lab review (Geekbench 6.7 build).",
    rows: [
      { family: "GEEKBENCH_6", metric: "SINGLE_CORE", value: 2985 },
      { family: "GEEKBENCH_6", metric: "MULTI_CORE", value: 9250 },
      { family: "ANTUTU_V10", metric: "TOTAL", value: 2487133 },
    ],
  },
  {
    slug: "xiaomi-15-ultra",
    sourceName: "Notebookcheck",
    sourceUrl: "https://www.notebookcheck.net/Xiaomi-15-Ultra-review-Leica-powered-powerhouse.975197.0.html",
    sourceDate: "2025-03-07",
    notes: "From Notebookcheck's full lab review (Geekbench 6.7 build).",
    rows: [
      { family: "GEEKBENCH_6", metric: "SINGLE_CORE", value: 3099 },
      { family: "GEEKBENCH_6", metric: "MULTI_CORE", value: 9685 },
    ],
  },
  {
    slug: "xiaomi-15-pro",
    sourceName: "Notebookcheck",
    sourceUrl:
      "https://www.notebookcheck.net/Xiaomi-15-Pro-review-One-of-the-most-efficient-flagship-smartphones-thanks-to-a-special-display.939116.0.html",
    sourceDate: "2024-12-29",
    notes: "From Notebookcheck's full lab review (Geekbench 6.7 build).",
    rows: [
      { family: "GEEKBENCH_6", metric: "SINGLE_CORE", value: 3089 },
      { family: "GEEKBENCH_6", metric: "MULTI_CORE", value: 9404 },
    ],
  },
  {
    slug: "redmi-k80-pro",
    sourceName: "Notebookcheck",
    sourceUrl:
      "https://www.notebookcheck.net/Redmi-K80-Pro-Benchmarks-establish-stunning-performance-of-imminent-Snapdragon-8-Elite-phone.922888.0.html",
    sourceDate: "2024-11-24",
    notes: "Pre-release review unit benchmark, reported by Notebookcheck.",
    rows: [
      { family: "GEEKBENCH_6", metric: "SINGLE_CORE", value: 3050 },
      { family: "GEEKBENCH_6", metric: "MULTI_CORE", value: 9216 },
    ],
  },
  {
    slug: "redmi-turbo-4",
    sourceName: "Notebookcheck",
    sourceUrl:
      "https://www.notebookcheck.net/Dimensity-8400-Redmi-Turbo-4-benchmarks-reveal-performance-of-MediaTek-s-newest-chipset.940625.0.html",
    sourceDate: "2025-01-04",
    rows: [
      { family: "GEEKBENCH_6", metric: "SINGLE_CORE", value: 1639 },
      { family: "GEEKBENCH_6", metric: "MULTI_CORE", value: 6500 },
    ],
  },
  {
    slug: "xiaomi-pad-7-ultra",
    sourceName: "Notebookcheck",
    sourceUrl:
      "https://www.notebookcheck.com/Das-beste-Android-Tablet-kommt-nicht-von-Samsung-Test-Xiaomi-Pad-7-Ultra.1035985.0.html",
    sourceDate: "2025-06-24",
    notes: "From Notebookcheck's full lab review (German edition, Geekbench 6.7 build).",
    rows: [
      { family: "GEEKBENCH_6", metric: "SINGLE_CORE", value: 2718 },
      { family: "GEEKBENCH_6", metric: "MULTI_CORE", value: 9097 },
      { family: "ANTUTU_V10", metric: "TOTAL", value: 2599957 },
    ],
  },
  {
    slug: "ipad-pro-m5",
    sourceName: "Tom's Hardware",
    sourceUrl:
      "https://www.tomshardware.com/tech-industry/m5-powered-ipad-pro-breaks-cover-in-geekbench-scoring-4-133-in-single-threaded-tests-matches-m4-max-and-beats-every-single-core-pc-chip-score",
    notes: "Single-core figure only was confirmed in the fetched article text; multi-core was not verifiable from the same source and is intentionally omitted.",
    rows: [{ family: "GEEKBENCH_6", metric: "SINGLE_CORE", value: 4133 }],
  },
];

async function main() {
  let total = 0;
  for (const entry of ROWS) {
    const device = await prisma.device.findUnique({ where: { slug: entry.slug } });
    if (!device) {
      console.log(`! no device for slug ${entry.slug}`);
      continue;
    }
    for (const row of entry.rows) {
      await prisma.deviceBenchmark.upsert({
        where: {
          deviceId_family_metric_sourceUrl: {
            deviceId: device.id,
            family: row.family,
            metric: row.metric,
            sourceUrl: entry.sourceUrl,
          },
        },
        update: { value: row.value, sourceName: entry.sourceName, sourceDate: entry.sourceDate ?? null, testedVariant: entry.testedVariant ?? null, notes: entry.notes ?? null },
        create: {
          deviceId: device.id,
          family: row.family,
          metric: row.metric,
          value: row.value,
          sourceName: entry.sourceName,
          sourceUrl: entry.sourceUrl,
          sourceDate: entry.sourceDate ?? null,
          testedVariant: entry.testedVariant ?? null,
          notes: entry.notes ?? null,
        },
      });
      total++;
    }
    console.log(`✓ ${entry.slug}: ${entry.rows.length} row(s) from ${entry.sourceName}`);
  }
  console.log(`\n${total} externally-sourced benchmark rows imported.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
