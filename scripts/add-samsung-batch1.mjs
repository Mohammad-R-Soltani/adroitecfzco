import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const samsung = await prisma.brand.findUnique({ where: { slug: "samsung" } });
if (!samsung) throw new Error("Samsung brand not found — run the brand seed first.");

const CHIPSETS = [
  {
    slug: "samsung-snapdragon-8-elite-for-galaxy",
    name: "Snapdragon 8 Elite for Galaxy",
    series: "Galaxy Snapdragon",
    kind: "MOBILE_SOC",
    releaseYear: 2025,
    processNode: "TSMC N3E (2nd-gen 3nm)",
    cpuSummary: "Octa-core Qualcomm Oryon CPU (2x4.47GHz prime + 6x3.53GHz performance) — a factory-overclocked \"for Galaxy\" bin of the Snapdragon 8 Elite",
    gpuSummary: "Adreno 830 GPU (1200MHz)",
    npuSummary: "Hexagon NPU with on-device generative AI acceleration",
    maxRam: "up to 16GB LPDDR5X",
    highlight: "Samsung's entire 2025 Galaxy S line and both foldables run this Qualcomm-exclusive, higher-clocked bin — the first time in years every region gets the same silicon.",
    gradientFrom: "#0a1a3d",
    gradientTo: "#1428A0",
    sourceNote: "GSMArena device reviews (Galaxy S25 Ultra, Galaxy Z Fold7) — all Galaxy S25-series and Z-series 2025 models confirmed on this chipset globally; a limited EU Galaxy S25+ Exynos 2500 variant has been reported but is not independently confirmed, so it isn't tracked separately here.",
    featured: true,
    devices: [
      { name: "Galaxy S25", category: "PHONE", releaseDate: "2025-02-07" },
      { name: "Galaxy S25+", category: "PHONE", releaseDate: "2025-02-07" },
      { name: "Galaxy S25 Ultra", category: "PHONE", releaseDate: "2025-02-07" },
      { name: "Galaxy Z Fold7", category: "PHONE", releaseDate: "2025-07-25" },
      { name: "Galaxy Z Flip7", category: "PHONE", releaseDate: "2025-07-25" },
    ],
  },
  {
    slug: "samsung-exynos-w1000",
    name: "Exynos W1000",
    series: "Exynos W-series",
    kind: "WEARABLE_SOC",
    releaseYear: 2025,
    processNode: "Samsung Foundry 3nm (SF3)",
    cpuSummary: "5-core CPU (1x Cortex-A78 performance + 4x Cortex-A55 efficiency)",
    gpuSummary: "ARM Mali-G68 MP2 GPU",
    npuSummary: null,
    maxRam: "2GB",
    highlight: "Carried over from the Watch7/Watch Ultra generation, this 3nm wearable chip claims a 3.4x single-core and 3.7x multi-core jump over its predecessor.",
    gradientFrom: "#1a2a4d",
    gradientTo: "#3a5cc9",
    sourceNote: "Samsung Semiconductor official product page (Exynos W1000) and GSMArena (Galaxy Watch8, Galaxy Watch Ultra).",
    featured: false,
    devices: [
      { name: "Galaxy Watch8", category: "WATCH", releaseDate: "2025-07-25" },
      { name: "Galaxy Watch Ultra (2025)", category: "WATCH", releaseDate: "2025-07-25" },
    ],
  },
];

let chipsetCount = 0;
let deviceCount = 0;

for (const c of CHIPSETS) {
  const chipset = await prisma.chipset.upsert({
    where: { brandId_name: { brandId: samsung.id, name: c.name } },
    update: {
      slug: c.slug,
      series: c.series,
      kind: c.kind,
      releaseYear: c.releaseYear,
      processNode: c.processNode,
      cpuSummary: c.cpuSummary,
      gpuSummary: c.gpuSummary,
      npuSummary: c.npuSummary,
      maxRam: c.maxRam,
      highlight: c.highlight,
      gradientFrom: c.gradientFrom,
      gradientTo: c.gradientTo,
      sourceNote: c.sourceNote,
      featured: c.featured,
    },
    create: {
      slug: c.slug,
      brandId: samsung.id,
      name: c.name,
      series: c.series,
      kind: c.kind,
      releaseYear: c.releaseYear,
      processNode: c.processNode,
      cpuSummary: c.cpuSummary,
      gpuSummary: c.gpuSummary,
      npuSummary: c.npuSummary,
      maxRam: c.maxRam,
      highlight: c.highlight,
      gradientFrom: c.gradientFrom,
      gradientTo: c.gradientTo,
      sourceNote: c.sourceNote,
      featured: c.featured,
    },
  });
  chipsetCount++;

  for (const d of c.devices) {
    const deviceSlug = d.name
      .toLowerCase()
      .replace(/\+/g, "-plus")
      .replace(/\(|\)/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    await prisma.device.upsert({
      where: { chipsetId_name: { chipsetId: chipset.id, name: d.name } },
      update: {
        slug: deviceSlug,
        category: d.category,
        releaseDate: new Date(d.releaseDate),
      },
      create: {
        slug: deviceSlug,
        chipsetId: chipset.id,
        name: d.name,
        category: d.category,
        releaseDate: new Date(d.releaseDate),
      },
    });
    deviceCount++;
    console.log(`  device: ${d.name} (${deviceSlug})`);
  }
  console.log(`chipset: ${c.name} (${c.slug})`);
}

console.log(`\n${chipsetCount} chipsets, ${deviceCount} devices upserted.`);
