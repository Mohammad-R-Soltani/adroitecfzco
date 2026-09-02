import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const samsung = await prisma.brand.findUnique({ where: { slug: "samsung" } });
if (!samsung) throw new Error("Samsung brand not found.");

const CHIPSETS = [
  {
    slug: "samsung-dimensity-9300-plus",
    name: "Dimensity 9300+",
    series: "MediaTek Dimensity",
    kind: "MOBILE_SOC",
    releaseYear: 2024,
    processNode: "TSMC 3rd-gen 4nm",
    cpuSummary: "Octa-core: 1x Cortex-X4 @ 3.4GHz + 3x Cortex-X4 @ 2.85GHz + 4x Cortex-A720 @ 2.0GHz",
    gpuSummary: "ARM Immortalis-G720 GPU",
    npuSummary: "MediaTek NPU 790",
    maxRam: "up to 16GB",
    highlight: "For the first time ever, Samsung's Tab S flagship tablets run a MediaTek chip instead of Qualcomm or Exynos.",
    gradientFrom: "#1a2a4d",
    gradientTo: "#1428A0",
    sourceNote: "GSMArena (\"Samsung Galaxy Tab S10+ and Tab S10 Ultra arrive with Dimensity 9300+, more AI\", Sept 2024).",
    featured: false,
    competitiveEdge:
      "Versus the Snapdragon 8 Gen 2 in the previous Tab S9 generation, MediaTek's own figures claim an 18% faster CPU, 28% faster GPU and 14% faster NPU — the first time Samsung's tablet flagship has shipped on MediaTek silicon rather than Qualcomm or its own Exynos.",
    competitiveEdgeSourceName: "GSMArena",
    competitiveEdgeSourceUrl: "https://www.gsmarena.com/samsung_galaxy_tab_s10_and_tab_s10_ultra_arrive_with_dimensity_9300_more_ai-news-64703.php",
    strengthTag: "First MediaTek Samsung tablet flagship",
    devices: [
      { name: "Galaxy Tab S10+", category: "TABLET", releaseDate: "2024-10-03" },
      { name: "Galaxy Tab S10 Ultra", category: "TABLET", releaseDate: "2024-10-03" },
    ],
  },
  {
    slug: "samsung-buds-chip",
    name: "Galaxy Buds audio chip (undisclosed)",
    series: "Galaxy Buds",
    kind: "AUDIO_CHIP",
    releaseYear: 2024,
    processNode: "Not publicly disclosed by Samsung",
    cpuSummary: "Not publicly disclosed by Samsung",
    gpuSummary: "N/A — dedicated audio silicon",
    npuSummary: null,
    maxRam: null,
    highlight: "Unlike Apple's named H-series, Samsung has never published a model name or specs for the chip inside its Galaxy Buds.",
    gradientFrom: "#1a2a4d",
    gradientTo: "#3a5cc9",
    sourceNote: "Samsung's official Buds3/Buds3 Pro support pages list audio hardware (drivers, codecs, battery) but no chipset name or specs — confirmed absent across multiple spec-aggregator sites as of this research.",
    featured: false,
    devices: [
      { name: "Galaxy Buds3", category: "EARBUDS", releaseDate: "2024-07-24" },
      { name: "Galaxy Buds3 Pro", category: "EARBUDS", releaseDate: "2024-07-24" },
    ],
  },
];

let chipsetCount = 0;
let deviceCount = 0;

for (const c of CHIPSETS) {
  const { devices, ...chipsetFields } = c;
  const chipset = await prisma.chipset.upsert({
    where: { brandId_name: { brandId: samsung.id, name: c.name } },
    update: { brandId: samsung.id, ...chipsetFields },
    create: { brandId: samsung.id, ...chipsetFields },
  });
  chipsetCount++;

  for (const d of devices) {
    const deviceSlug = d.name
      .toLowerCase()
      .replace(/\+/g, "-plus")
      .replace(/\(|\)/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    await prisma.device.upsert({
      where: { chipsetId_name: { chipsetId: chipset.id, name: d.name } },
      update: { slug: deviceSlug, category: d.category, releaseDate: new Date(d.releaseDate) },
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
