import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const brands = Object.fromEntries(
  (await prisma.brand.findMany()).map((b) => [b.slug, b]),
);

// Previous-generation silicon (2022-2024), researched from named sources so the
// market-trend and generational-uplift views have real history to plot against
// rather than starting at 2024.
const CHIPSETS = [
  // ---------------------------------------------------------------- Apple
  {
    brand: "apple",
    slug: "apple-a17-pro",
    name: "A17 Pro",
    series: "A-series",
    kind: "MOBILE_SOC",
    releaseYear: 2023,
    processNode: "TSMC N3B (1st-gen 3nm)",
    cpuSummary: "6-core CPU (2 performance + 4 efficiency), 19 billion transistors",
    gpuSummary: "6-core GPU — first Apple GPU with hardware-accelerated ray tracing",
    npuSummary: "16-core Neural Engine (up to 35 TOPS)",
    maxRam: "8GB",
    highlight: "The first 3nm smartphone chip ever shipped, and the first Apple silicon with hardware ray tracing.",
    gradientFrom: "#1d1d1f",
    gradientTo: "#0071e3",
    sourceNote: "Apple keynote September 2023 (iPhone 15 Pro / Pro Max); process node and transistor count per Wikipedia/Pocketnow technical breakdowns.",
    competitiveEdge:
      "The world's first 3nm phone chip, and the first Apple silicon with hardware-accelerated ray tracing — Apple claimed up to 4x better ray-traced frame rates than the A16 Bionic's software fallback, alongside a 20% faster GPU and 10% faster CPU.",
    competitiveEdgeSourceName: "Pocketnow",
    competitiveEdgeSourceUrl: "https://pocketnow.com/apple-a17-pro-vs-a16-bionic/",
    strengthTag: "First 3nm + first Apple ray tracing",
    devices: [
      { name: "iPhone 15 Pro", category: "PHONE", releaseDate: "2023-09-22" },
      { name: "iPhone 15 Pro Max", category: "PHONE", releaseDate: "2023-09-22" },
    ],
  },
  {
    brand: "apple",
    slug: "apple-a16-bionic",
    name: "A16 Bionic",
    series: "A-series",
    kind: "MOBILE_SOC",
    releaseYear: 2022,
    processNode: "TSMC N4 (4nm)",
    cpuSummary: "6-core CPU (2 performance + 4 efficiency), 16 billion transistors",
    gpuSummary: "5-core GPU (no hardware ray tracing)",
    npuSummary: "16-core Neural Engine",
    maxRam: "6GB",
    highlight: "Debuted on the iPhone 14 Pro, then carried down to the standard iPhone 15 a year later.",
    gradientFrom: "#1d1d1f",
    gradientTo: "#0071e3",
    sourceNote: "Apple keynote September 2022 (iPhone 14 Pro / Pro Max) and September 2023 (iPhone 15 / 15 Plus); transistor count and node per Pocketnow technical comparison.",
    competitiveEdge:
      "Apple's last 4nm phone chip and the last without hardware ray tracing — its role became the value tier, moving down to the standard iPhone 15 line a year after debuting on the 14 Pro, which is why used and refurbished 14 Pro stock still benchmarks close to a new base iPhone 15.",
    competitiveEdgeSourceName: "Pocketnow",
    competitiveEdgeSourceUrl: "https://pocketnow.com/apple-a17-pro-vs-a16-bionic/",
    strengthTag: "Value tier / carried-down flagship",
    devices: [
      { name: "iPhone 14 Pro", category: "PHONE", releaseDate: "2022-09-16" },
      { name: "iPhone 14 Pro Max", category: "PHONE", releaseDate: "2022-09-16" },
      { name: "iPhone 15", category: "PHONE", releaseDate: "2023-09-22" },
      { name: "iPhone 15 Plus", category: "PHONE", releaseDate: "2023-09-22" },
    ],
  },
  {
    brand: "apple",
    slug: "apple-m3",
    name: "M3",
    series: "M-series",
    kind: "LAPTOP_SOC",
    releaseYear: 2023,
    processNode: "TSMC N3B (1st-gen 3nm)",
    cpuSummary: "8-core CPU (4 performance + 4 efficiency), 25 billion transistors",
    gpuSummary: "Up to 10-core GPU with Dynamic Caching, hardware ray tracing and mesh shading",
    npuSummary: "16-core Neural Engine",
    maxRam: "up to 24GB unified memory",
    highlight: "Brought hardware ray tracing and Dynamic Caching to the Mac for the first time.",
    gradientFrom: "#1d1d1f",
    gradientTo: "#0071e3",
    sourceNote: "Apple Newsroom, October 2023 (\"Apple unveils M3, M3 Pro, and M3 Max\").",
    competitiveEdge:
      "Introduced Dynamic Caching — an industry first that allocates only the GPU memory each task actually needs, raising average GPU utilization — plus the Mac's first hardware ray tracing and mesh shading, on top of roughly 20% better CPU and GPU performance than M2.",
    competitiveEdgeSourceName: "Apple Newsroom",
    competitiveEdgeSourceUrl: "https://www.apple.com/newsroom/2023/10/apple-unveils-m3-m3-pro-and-m3-max-the-most-advanced-chips-for-a-personal-computer/",
    strengthTag: "GPU Dynamic Caching (industry first)",
    devices: [
      { name: 'MacBook Pro 14" (M3)', category: "LAPTOP", releaseDate: "2023-11-07" },
      { name: 'MacBook Air 13" (M3)', category: "LAPTOP", releaseDate: "2024-03-08" },
      { name: 'MacBook Air 15" (M3)', category: "LAPTOP", releaseDate: "2024-03-08" },
    ],
  },

  // -------------------------------------------------------------- Samsung
  {
    brand: "samsung",
    slug: "samsung-snapdragon-8-gen-3-for-galaxy",
    name: "Snapdragon 8 Gen 3 for Galaxy",
    series: "Galaxy Snapdragon",
    kind: "MOBILE_SOC",
    releaseYear: 2024,
    processNode: "TSMC N4P (4nm)",
    cpuSummary: "Octa-core (1x Cortex-X4 @ 3.39GHz + 5x Cortex-A720 + 2x Cortex-A520) — overclocked \"for Galaxy\" bin",
    gpuSummary: "Adreno 750 GPU with hardware ray tracing",
    npuSummary: "Hexagon NPU, ~60 TOPS class",
    maxRam: "up to 16GB LPDDR5X",
    highlight: "The chip behind Galaxy AI's launch generation — used in every S24 Ultra worldwide and the US S24/S24+.",
    gradientFrom: "#0a1a3d",
    gradientTo: "#1428A0",
    sourceNote: "Android Authority and PhoneArena Galaxy S24 chipset coverage; S24 Ultra ships this chip in every region, while base S24/S24+ split by region with the Exynos 2400.",
    competitiveEdge:
      "Qualcomm's 30% faster CPU and 98% faster AI performance over the 8 Gen 2 is what made Galaxy AI's on-device features viable at launch; in Samsung's split lineup it also benchmarks slightly ahead of the Exynos 2400 (about 1.82M vs 1.70M in AnTuTu), though the Exynos variant runs measurably longer on a charge.",
    competitiveEdgeSourceName: "Android Authority",
    competitiveEdgeSourceUrl: "https://www.androidauthority.com/exynos-vs-snapdragon-galaxy-s24-3411235/",
    strengthTag: "Peak performance (Galaxy AI launch gen)",
    devices: [
      { name: "Galaxy S24 Ultra", category: "PHONE", releaseDate: "2024-01-31" },
      { name: "Galaxy Z Fold6", category: "PHONE", releaseDate: "2024-07-24" },
      { name: "Galaxy Z Flip6", category: "PHONE", releaseDate: "2024-07-24" },
    ],
  },
  {
    brand: "samsung",
    slug: "samsung-exynos-2400",
    name: "Exynos 2400",
    series: "Exynos",
    kind: "MOBILE_SOC",
    releaseYear: 2024,
    processNode: "Samsung Foundry 4nm (SF4)",
    cpuSummary: "Deca-core (1x Cortex-X4 + 5x Cortex-A720 + 4x Cortex-A520)",
    gpuSummary: "Samsung Xclipse 940 GPU (AMD RDNA-based) with hardware ray tracing",
    npuSummary: "Samsung NPU with on-device generative AI support",
    maxRam: "up to 12GB LPDDR5X",
    highlight: "The Galaxy S24 and S24+ variant sold across Europe, Korea and the Middle East — two more cores than the Snapdragon, and longer battery life.",
    gradientFrom: "#1a2a4d",
    gradientTo: "#1428A0",
    sourceNote: "Android Authority head-to-head testing (\"Snapdragon 8 Gen 3 vs Exynos 2400 Galaxy S24 tested\") and PhoneArena regional-variant coverage. Note: US and China S24/S24+ ship the Snapdragon variant instead; the S24 Ultra is Snapdragon everywhere.",
    competitiveEdge:
      "Trades peak speed for endurance — Android Authority's testing found the Exynos 2400 Galaxy S24 held at least a 15% battery-life lead over the Snapdragon variant in most tests, thanks to spreading light workloads across four efficiency cores instead of two, while giving up a modest amount of gaming performance.",
    competitiveEdgeSourceName: "Android Authority",
    competitiveEdgeSourceUrl: "https://www.androidauthority.com/exynos-vs-snapdragon-galaxy-s24-3411235/",
    strengthTag: "Battery endurance over peak speed",
    devices: [
      { name: "Galaxy S24", category: "PHONE", releaseDate: "2024-01-31", region: "Global (EU, Korea, Middle East)" },
      { name: "Galaxy S24+", category: "PHONE", releaseDate: "2024-01-31", region: "Global (EU, Korea, Middle East)" },
    ],
  },

  // --------------------------------------------------------------- Xiaomi
  {
    brand: "xiaomi",
    slug: "xiaomi-snapdragon-8-gen-3",
    name: "Snapdragon 8 Gen 3",
    series: "Snapdragon",
    kind: "MOBILE_SOC",
    releaseYear: 2023,
    processNode: "TSMC N4P (4nm)",
    cpuSummary: "Octa-core (1x Cortex-X4 @ 3.3GHz + 5x Cortex-A720 @ 3.0-3.2GHz + 2x Cortex-A520)",
    gpuSummary: "Adreno 750 GPU with hardware ray tracing",
    npuSummary: "Hexagon NPU, 60 TOPS — runs large generative AI models on-device",
    maxRam: "up to 24GB LPDDR5X",
    highlight: "Debuted worldwide on the Xiaomi 14 — the first chip Qualcomm built around running generative AI locally.",
    gradientFrom: "#3a1a0a",
    gradientTo: "#FF6900",
    sourceNote: "Android Authority (\"Snapdragon 8 Gen 3 vs Snapdragon 8 Gen 2\") and GSMArena launch coverage — Xiaomi 14 was the first phone to ship it.",
    competitiveEdge:
      "A 30% faster CPU and 98% faster AI engine than the 8 Gen 2, with the Hexagon NPU's 60 TOPS making on-device generative AI (real-time photo upscaling, offline voice translation) practical for the first time rather than cloud-dependent.",
    competitiveEdgeSourceName: "Android Authority",
    competitiveEdgeSourceUrl: "https://www.androidauthority.com/snapdragon-8-gen-3-vs-snapdragon-8-gen-2-3381660/",
    strengthTag: "On-device generative AI (60 TOPS)",
    devices: [
      { name: "Xiaomi 14", category: "PHONE", releaseDate: "2024-02-25" },
      { name: "Xiaomi 14 Ultra", category: "PHONE", releaseDate: "2024-02-25" },
    ],
  },
  {
    brand: "xiaomi",
    slug: "xiaomi-snapdragon-8-gen-2",
    name: "Snapdragon 8 Gen 2",
    series: "Snapdragon",
    kind: "MOBILE_SOC",
    releaseYear: 2022,
    processNode: "TSMC N4 (4nm)",
    cpuSummary: "Octa-core (1x Cortex-X3 @ 3.2GHz + 2x A715 + 2x A710 + 3x A510)",
    gpuSummary: "Adreno 740 GPU — Qualcomm's first mobile GPU with hardware ray tracing",
    npuSummary: "Hexagon NPU with INT4 support",
    maxRam: "up to 16GB LPDDR5X",
    highlight: "The generation that first brought hardware ray tracing and Wi-Fi 7 to Android flagships.",
    gradientFrom: "#3a1a0a",
    gradientTo: "#FF6900",
    sourceNote: "Android Authority generational comparison and GSMArena device pages (Xiaomi 13 / 13 Pro).",
    competitiveEdge:
      "Still a credible flagship in the secondary market: it introduced hardware ray tracing and Wi-Fi 7 to Android, and Android Authority notes that for everyday workloads (web, video, messaging) it feels identical to the 8 Gen 3 — the gap only opens up on AI-specific tasks.",
    competitiveEdgeSourceName: "Android Authority",
    competitiveEdgeSourceUrl: "https://www.androidauthority.com/snapdragon-8-gen-3-vs-snapdragon-8-gen-2-3381660/",
    strengthTag: "Secondary-market value flagship",
    devices: [
      { name: "Xiaomi 13", category: "PHONE", releaseDate: "2023-02-26" },
      { name: "Xiaomi 13 Pro", category: "PHONE", releaseDate: "2023-02-26" },
    ],
  },
];

let chipsetCount = 0;
let deviceCount = 0;

for (const c of CHIPSETS) {
  const brand = brands[c.brand];
  if (!brand) {
    console.log(`  skip "${c.slug}" — brand ${c.brand} not found`);
    continue;
  }

  const { brand: _brandSlug, devices, ...fields } = c;

  const chipset = await prisma.chipset.upsert({
    where: { brandId_name: { brandId: brand.id, name: c.name } },
    update: { brandId: brand.id, ...fields },
    create: { brandId: brand.id, ...fields },
  });
  chipsetCount++;
  console.log(`chipset: ${c.name} (${c.slug})`);

  for (const d of devices) {
    const deviceSlug = d.name
      .toLowerCase()
      .replace(/\+/g, "-plus")
      .replace(/"/g, "")
      .replace(/\(|\)/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    await prisma.device.upsert({
      where: { chipsetId_name: { chipsetId: chipset.id, name: d.name } },
      update: {
        slug: deviceSlug,
        category: d.category,
        releaseDate: new Date(d.releaseDate),
        region: d.region ?? null,
      },
      create: {
        slug: deviceSlug,
        chipsetId: chipset.id,
        name: d.name,
        category: d.category,
        releaseDate: new Date(d.releaseDate),
        region: d.region ?? null,
      },
    });
    deviceCount++;
    console.log(`  device: ${d.name} (${deviceSlug})`);
  }
}

console.log(`\n${chipsetCount} chipsets, ${deviceCount} devices upserted.`);
