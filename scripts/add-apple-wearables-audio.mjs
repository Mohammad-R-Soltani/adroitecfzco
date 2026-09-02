import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const apple = await prisma.brand.findUnique({ where: { slug: "apple" } });
if (!apple) throw new Error("Apple brand not found.");

const CHIPSETS = [
  {
    slug: "apple-h2",
    name: "H2",
    series: "H-series",
    kind: "AUDIO_CHIP",
    releaseYear: 2024,
    processNode: "Not disclosed by Apple",
    cpuSummary: "Custom Apple audio chip — not a general-purpose CPU/GPU design",
    gpuSummary: "N/A — dedicated audio silicon",
    npuSummary: "On-chip ML for real-time noise cancellation (Voice Isolation, Adaptive Audio) — Apple states it recomputes noise control 48,000 times per second on AirPods Pro 3",
    maxRam: null,
    highlight: "The same H2 chip has now powered three straight AirPods generations — AirPods 4, AirPods 4 (ANC) and AirPods Pro 3 all share it.",
    gradientFrom: "#1d1d1f",
    gradientTo: "#0071e3",
    sourceNote: "Apple Support tech-specs pages and Apple Newsroom (AirPods 4 launch, Sept 2024); AirPods Pro 3 confirmed on the same H2 chip per Apple's own AirPods Pro 3 product page (MacRumors cross-check), not a new chip despite some early conflicting reports.",
    featured: false,
    competitiveEdge:
      "Reusing H2 across three SKUs let Apple push real-time ML noise processing (48,000 recomputations/second) and heart-rate sensing down to a $129 open-fit earbud, not just the $249 Pro model — a software/feature differentiator on identical silicon rather than a new chip generation.",
    competitiveEdgeSourceName: "Apple Newsroom",
    competitiveEdgeSourceUrl: "https://www.apple.com/newsroom/2024/09/apple-introduces-airpods-4-and-a-hearing-health-experience-with-airpods-pro-2/",
    strengthTag: "Real-time on-chip ML audio",
    devices: [
      { name: "AirPods 4", releaseDate: "2024-09-20" },
      { name: "AirPods 4 (ANC)", releaseDate: "2024-09-20" },
      { name: "AirPods Pro 3", releaseDate: "2025-09-19" },
    ],
  },
  {
    slug: "apple-s10",
    name: "S10",
    series: "S-series",
    kind: "WEARABLE_SOC",
    releaseYear: 2024,
    processNode: "Not disclosed by Apple",
    cpuSummary: "Dual-core custom Apple SiP (System in Package) — same design as S9, resized for the thinner Series 10 case",
    gpuSummary: "Apple-designed GPU (unchanged from S9)",
    npuSummary: "4-core Neural Engine",
    maxRam: null,
    highlight: "For the first time in Apple Watch history, a new model year shipped without a new chip — Series 11, Ultra 3 and SE 3 all reuse the Series 10's S10.",
    gradientFrom: "#1d1d1f",
    gradientTo: "#0071e3",
    sourceNote: "MacRumors (\"No New Apple Watch Chip for the First Time Ever: All Models Stick to S10\", Sept 2025) and GSMArena (Apple Watch Series 11, Watch SE 3 and Watch Ultra 3 announced).",
    featured: false,
    competitiveEdge:
      "Apple confirmed the S9-derived S10 carries over unchanged into Series 11, Ultra 3 and SE 3 — the first time in the product's history that three generations in a row ship on the same silicon, with this year's gains (24-hour \"true all-day\" battery on Series 11, 42-hour Ultra 3) coming entirely from software and battery engineering, not a faster chip.",
    competitiveEdgeSourceName: "MacRumors",
    competitiveEdgeSourceUrl: "https://www.macrumors.com/2025/09/09/no-new-apple-watch-chip-for-the-first-time/",
    strengthTag: "Battery life via efficiency, not a new chip",
    devices: [
      { name: "Apple Watch Series 10", releaseDate: "2024-09-20" },
      { name: "Apple Watch Series 11", releaseDate: "2025-09-19" },
      { name: "Apple Watch Ultra 3", releaseDate: "2025-09-19" },
      { name: "Apple Watch SE 3", releaseDate: "2025-09-19" },
    ],
  },
];

let chipsetCount = 0;
let deviceCount = 0;

for (const c of CHIPSETS) {
  const { devices, ...chipsetFields } = c;
  const chipset = await prisma.chipset.upsert({
    where: { brandId_name: { brandId: apple.id, name: c.name } },
    update: { brandId: apple.id, ...chipsetFields },
    create: { brandId: apple.id, ...chipsetFields },
  });
  chipsetCount++;

  const category = c.kind === "AUDIO_CHIP" ? "EARBUDS" : "WATCH";

  for (const d of devices) {
    const deviceSlug = d.name
      .toLowerCase()
      .replace(/\(|\)/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    await prisma.device.upsert({
      where: { chipsetId_name: { chipsetId: chipset.id, name: d.name } },
      update: { slug: deviceSlug, category, releaseDate: new Date(d.releaseDate) },
      create: {
        slug: deviceSlug,
        chipsetId: chipset.id,
        name: d.name,
        category,
        releaseDate: new Date(d.releaseDate),
      },
    });
    deviceCount++;
    console.log(`  device: ${d.name} (${deviceSlug})`);
  }
  console.log(`chipset: ${c.name} (${c.slug})`);
}

console.log(`\n${chipsetCount} chipsets, ${deviceCount} devices upserted.`);
