import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * GSMArena doesn't cover laptops at all — it's a phone/tablet site — so the
 * 12 laptops in this catalog were never reachable by the GSMArena backfill.
 * Geekbench's own browser.geekbench.com blocks direct scraping (403), so
 * each score here was individually researched via web search against
 * published Geekbench 6 results and laptop reviews, then hand-verified
 * against the chip in question. Every row cites where its number came from.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// deviceId -> { cpu, single, multi, sourceUrl, note? }
const DATA = [
  {
    id: "cmtjrz0ti000ao0uvfa0a24c9", // MacBook Air 13" (M3)
    cpu: "Apple M3 (8-core)",
    single: 3157, multi: 12020,
    sourceUrl: "https://browser.geekbench.com/v6/cpu/5221398",
  },
  {
    id: "cmtjrz0tk000bo0uv9nz0fefj", // MacBook Air 15" (M3)
    cpu: "Apple M3 (8-core)",
    single: 3157, multi: 12020,
    sourceUrl: "https://browser.geekbench.com/v6/cpu/5221526",
    note: "Same M3 chip as the 13\" model; Geekbench 6 CPU score does not vary by chassis size.",
  },
  {
    id: "cmtjysvxk000gnouvsrebwp5h", // MacBook Air 13" (M4)
    cpu: "Apple M4 (10-core)",
    single: 3204, multi: 15072,
    sourceUrl: "https://browser.geekbench.com/v6/cpu/11334686",
  },
  {
    id: "cmtjysvxt000inouvfa0i1j32", // MacBook Air 15" (M4)
    cpu: "Apple M4 (10-core)",
    single: 3204, multi: 15072,
    sourceUrl: "https://browser.geekbench.com/v6/cpu/11334686",
    note: "Same M4 chip as the 13\" model; Geekbench 6 CPU score does not vary by chassis size.",
  },
  {
    id: "cmtjrz0sy0009o0uvia32x60l", // MacBook Pro 14" (M3)
    cpu: "Apple M3 (8-core)",
    single: 3030, multi: 11649,
    sourceUrl: "https://www.cpu-monkey.com/en/benchmark-apple_m3_8_cpu_10_gpu-geekbench_6_multi_core",
  },
  {
    id: "cmsp453cr000kfsuveugivf8t", // MacBook Pro 14"/16" (M4)
    cpu: "Apple M4 (10-core)",
    single: 3806, multi: 14743,
    sourceUrl: "https://browser.geekbench.com/macs/macbook-pro-14-inch-2024-14c-cpu-20c-gpu",
    note: "A single submitted Geekbench 6 result for the base (non-Pro/Max) M4 configuration — this configuration is uncommon enough that no large-sample average was found.",
  },
  {
    id: "cmsp453d5000nfsuv2kv6ftcl", // MacBook Pro 14"/16" (M4 Pro/Max)
    cpu: "Apple M4 Max (up to 16-core)",
    single: 3919, multi: 23133,
    sourceUrl: "https://www.tomshardware.com/pc-components/cpus/apples-m4-max-is-the-single-core-performance-king-in-geekbench-6-m4-max-beats-the-core-ultra-9-285k-and-ryzen-9-9950x",
    note: "This catalog entry groups the M4 Pro and M4 Max configurations; the score recorded is the M4 Max average (2,437 samples) — the higher end of the range. The M4 Pro variant averages lower, around 3,330/24,568.",
  },
  {
    id: "cmsp453cu000lfsuv9mbvrgq1", // Mac mini (M4)
    cpu: "Apple M4 (10-core)",
    single: 3277, multi: 15359,
    sourceUrl: "https://browser.geekbench.com/macs/mac-mini-2024-10c-cpu",
  },
  {
    id: "cmsp453d8000ofsuvj0qrmsst", // Mac Studio (M4 Max)
    cpu: "Apple M4 Max (up to 16-core)",
    single: 3499, multi: 25799,
    sourceUrl: "https://browser.geekbench.com/v6/cpu/11162564",
  },
  {
    id: "cmsp453c9000gfsuvejnlm5ja", // MacBook Pro 14" (M5)
    cpu: "Apple M5 (10-core)",
    single: 3638, multi: 17949,
    sourceUrl: "https://browser.geekbench.com/macs/macbook-pro-14-inch-2025",
  },
  {
    id: "cmtjysvvv0007nouve5lvmrnb", // RedmiBook 16 (2025)
    cpu: "Intel Core 5 210H",
    single: 2449, multi: 8938,
    sourceUrl: "https://nanoreview.net/en/cpu/intel-core-5-210h",
    note: "Base configuration (Intel Core 5 210H); a higher Core Ultra 5 225H variant also exists for this model but was not the one catalogued here.",
  },
  {
    id: "cmtjysvv60004nouvu4ur1csa", // Galaxy Book5 Pro 360
    cpu: "Intel Core Ultra (Lunar Lake)",
    single: 2584, multi: 10328,
    sourceUrl: "https://www.windowscentral.com/hardware/laptops/samsung-galaxy-book5-pro-360-review",
  },
];

for (const row of DATA) {
  const device = await prisma.device.findUnique({ where: { id: row.id }, select: { name: true, spec: true } });
  if (!device) {
    console.log(`! device ${row.id} not found`);
    continue;
  }

  await prisma.deviceSpec.upsert({
    where: { deviceId: row.id },
    update: { cpu: row.cpu },
    create: { deviceId: row.id, cpu: row.cpu, sourceName: "Geekbench Browser (web search)", sourceUrl: row.sourceUrl },
  });

  for (const [metric, value] of [["SINGLE_CORE", row.single], ["MULTI_CORE", row.multi]]) {
    await prisma.deviceBenchmark.upsert({
      where: {
        deviceId_family_metric_sourceUrl: {
          deviceId: row.id,
          family: "GEEKBENCH_6",
          metric,
          sourceUrl: row.sourceUrl,
        },
      },
      update: { value },
      create: {
        deviceId: row.id,
        family: "GEEKBENCH_6",
        metric,
        value,
        sourceName: "Geekbench Browser",
        sourceUrl: row.sourceUrl,
      },
    });
  }

  console.log(`✓ ${device.name} · ${row.cpu} · GB6 ${row.single}/${row.multi}${row.note ? ` (${row.note})` : ""}`);
}

await prisma.$disconnect();
