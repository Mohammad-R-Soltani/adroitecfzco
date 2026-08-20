import "dotenv/config";
import { PrismaClient, BrandSlug, DeviceCategory, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/slugify";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const apple = await prisma.brand.upsert({
    where: { slug: BrandSlug.apple },
    update: {},
    create: { slug: BrandSlug.apple, name: "Apple", accent: "#0071e3" },
  });

  const xiaomi = await prisma.brand.upsert({
    where: { slug: BrandSlug.xiaomi },
    update: {},
    create: { slug: BrandSlug.xiaomi, name: "Xiaomi", accent: "#FF6900" },
  });

  type ChipsetSeed = {
    brandId: string;
    name: string;
    series: string;
    releaseYear: number;
    processNode: string;
    cpuSummary: string;
    gpuSummary: string;
    npuSummary?: string;
    maxRam?: string;
    geekbenchSingleCore?: number;
    geekbenchMultiCore?: number;
    featured?: boolean;
    highlight: string;
    gradientFrom: string;
    gradientTo: string;
    sourceNote: string;
    devices: { name: string; category: DeviceCategory; releaseDate: string }[];
  };

  const chipsets: ChipsetSeed[] = [
    {
      brandId: apple.id,
      name: "A19 Pro",
      series: "A-series",
      releaseYear: 2025,
      processNode: "TSMC N3P (3rd-gen 3nm)",
      cpuSummary: "6-core CPU (2 performance + 4 efficiency)",
      gpuSummary: "6-core GPU — first Apple GPU with per-core Neural Accelerators, hardware ray tracing",
      npuSummary: "16-core Neural Engine",
      maxRam: "12GB",
      highlight: "Adds a vapor chamber and a redesigned GPU built for on-device AI workloads.",
      gradientFrom: "#1d1d1f",
      gradientTo: "#0071e3",
      sourceNote: "Apple keynote, September 2025 — iPhone 17 Pro / Pro Max",
      geekbenchSingleCore: 3800,
      geekbenchMultiCore: 9600,
      featured: true,
      devices: [
        { name: "iPhone 17 Pro", category: DeviceCategory.PHONE, releaseDate: "2025-09-19" },
        { name: "iPhone 17 Pro Max", category: DeviceCategory.PHONE, releaseDate: "2025-09-19" },
      ],
    },
    {
      brandId: apple.id,
      name: "A19",
      series: "A-series",
      releaseYear: 2025,
      processNode: "TSMC N3P (3rd-gen 3nm)",
      cpuSummary: "6-core CPU (2 performance + 4 efficiency)",
      gpuSummary: "5-core GPU",
      npuSummary: "16-core Neural Engine",
      maxRam: "8GB",
      highlight: "Powers the standard iPhone 17 line and the ultra-thin iPhone Air.",
      gradientFrom: "#2c2c2e",
      gradientTo: "#5ac8fa",
      sourceNote: "Apple keynote, September 2025 — iPhone 17 / iPhone Air",
      geekbenchSingleCore: 3700,
      geekbenchMultiCore: 9100,
      devices: [
        { name: "iPhone 17", category: DeviceCategory.PHONE, releaseDate: "2025-09-19" },
        { name: "iPhone Air", category: DeviceCategory.PHONE, releaseDate: "2025-09-19" },
      ],
    },
    {
      brandId: apple.id,
      name: "A18 Pro",
      series: "A-series",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",
      cpuSummary: "6-core CPU (2 performance + 4 efficiency)",
      gpuSummary: "6-core GPU with hardware-accelerated ray tracing",
      npuSummary: "16-core Neural Engine (up to 35 TOPS)",
      maxRam: "8GB",
      highlight: "First Apple silicon rated for on-device Apple Intelligence at launch.",
      gradientFrom: "#1d1d1f",
      gradientTo: "#3a3a3c",
      sourceNote: "Apple keynote, September 2024 — iPhone 16 Pro / Pro Max",
      geekbenchSingleCore: 3400,
      geekbenchMultiCore: 8300,
      featured: true,
      devices: [
        { name: "iPhone 16 Pro", category: DeviceCategory.PHONE, releaseDate: "2024-09-20" },
        { name: "iPhone 16 Pro Max", category: DeviceCategory.PHONE, releaseDate: "2024-09-20" },
      ],
    },
    {
      brandId: apple.id,
      name: "A18",
      series: "A-series",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",
      cpuSummary: "6-core CPU (2 performance + 4 efficiency)",
      gpuSummary: "5-core GPU",
      npuSummary: "16-core Neural Engine",
      maxRam: "8GB",
      highlight: "Brought Apple Intelligence support down to the non-Pro iPhone line.",
      gradientFrom: "#3a3a3c",
      gradientTo: "#8e8e93",
      sourceNote: "Apple keynotes, 2024/2025 — iPhone 16, 16 Plus, iPhone 16e",
      geekbenchSingleCore: 3300,
      geekbenchMultiCore: 8000,
      devices: [
        { name: "iPhone 16", category: DeviceCategory.PHONE, releaseDate: "2024-09-20" },
        { name: "iPhone 16 Plus", category: DeviceCategory.PHONE, releaseDate: "2024-09-20" },
        { name: "iPhone 16e", category: DeviceCategory.PHONE, releaseDate: "2025-02-28" },
      ],
    },
    {
      brandId: apple.id,
      name: "M5",
      series: "M-series",
      releaseYear: 2025,
      processNode: "TSMC N3P (3rd-gen 3nm)",
      cpuSummary: "10-core CPU (4 performance + 6 efficiency)",
      gpuSummary: "10-core GPU with per-core Neural Accelerators",
      npuSummary: "16-core Neural Engine",
      maxRam: "up to 32GB unified memory",
      highlight: "Apple's biggest generational GPU jump for on-device AI compute yet.",
      gradientFrom: "#0a0a0a",
      gradientTo: "#7c3aed",
      sourceNote: "Apple announcement, October 2025 — 14\" MacBook Pro, iPad Pro",
      geekbenchSingleCore: 4000,
      geekbenchMultiCore: 16500,
      featured: true,
      devices: [
        { name: "MacBook Pro 14\" (M5)", category: DeviceCategory.LAPTOP, releaseDate: "2025-10-22" },
        { name: "iPad Pro (M5)", category: DeviceCategory.TABLET, releaseDate: "2025-10-22" },
      ],
    },
    {
      brandId: apple.id,
      name: "M4",
      series: "M-series",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",
      cpuSummary: "up to 10-core CPU (4 performance + 6 efficiency)",
      gpuSummary: "up to 10-core GPU",
      npuSummary: "16-core Neural Engine (38 TOPS)",
      maxRam: "up to 32GB unified memory",
      highlight: "Debuted in the iPad Pro before rolling out across the Mac lineup.",
      gradientFrom: "#1d1d1f",
      gradientTo: "#34c759",
      sourceNote: "Apple announcements, May & October 2024 — iPad Pro, MacBook Pro, iMac, Mac mini",
      geekbenchSingleCore: 3900,
      geekbenchMultiCore: 14700,
      devices: [
        { name: "iPad Pro (M4)", category: DeviceCategory.TABLET, releaseDate: "2024-05-15" },
        { name: "MacBook Pro 14\"/16\" (M4)", category: DeviceCategory.LAPTOP, releaseDate: "2024-10-30" },
        { name: "Mac mini (M4)", category: DeviceCategory.LAPTOP, releaseDate: "2024-11-08" },
      ],
    },
    {
      brandId: apple.id,
      name: "M4 Pro / M4 Max",
      series: "M-series",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",
      cpuSummary: "up to 14-core CPU (Pro) / 16-core CPU (Max)",
      gpuSummary: "up to 20-core GPU (Pro) / 40-core GPU (Max)",
      npuSummary: "16-core Neural Engine",
      maxRam: "up to 128GB unified memory (Max)",
      highlight: "The workstation-class tier for MacBook Pro, Mac mini and Mac Studio.",
      gradientFrom: "#1d1d1f",
      gradientTo: "#ff375f",
      sourceNote: "Apple announcement, October 2024 — MacBook Pro, Mac mini, Mac Studio",
      geekbenchSingleCore: 3900,
      geekbenchMultiCore: 22000,
      devices: [
        { name: "MacBook Pro 14\"/16\" (M4 Pro/Max)", category: DeviceCategory.LAPTOP, releaseDate: "2024-10-30" },
        { name: "Mac Studio (M4 Max)", category: DeviceCategory.LAPTOP, releaseDate: "2025-03-12" },
      ],
    },
    {
      brandId: xiaomi.id,
      name: "XRing O1",
      series: "XRing",
      releaseYear: 2025,
      processNode: "TSMC N3 (3nm)",
      cpuSummary: "10-core Arm v9.2 CPU (1 prime + 3 performance + 6 efficiency)",
      gpuSummary: "Immortalis-G925 MC12 GPU",
      npuSummary: "3rd-gen Xiaomi NPU for on-device AI imaging",
      maxRam: "up to 24GB LPDDR5X",
      highlight: "Xiaomi's first fully self-designed flagship SoC, three years in development.",
      gradientFrom: "#FF6900",
      gradientTo: "#1d1d1f",
      sourceNote: "Xiaomi launch event, May 2025 — Xiaomi 15S Pro, Pad 7 Ultra",
      geekbenchSingleCore: 2400,
      geekbenchMultiCore: 7800,
      featured: true,
      devices: [
        { name: "Xiaomi 15S Pro", category: DeviceCategory.PHONE, releaseDate: "2025-05-08" },
        { name: "Xiaomi Pad 7 Ultra", category: DeviceCategory.TABLET, releaseDate: "2025-05-08" },
      ],
    },
    {
      brandId: xiaomi.id,
      name: "Snapdragon 8 Elite Gen 5",
      series: "Snapdragon",
      releaseYear: 2025,
      processNode: "TSMC N3P (3rd-gen 3nm)",
      cpuSummary: "Qualcomm Oryon 3rd-gen CPU, all custom cores",
      gpuSummary: "Adreno GPU with hardware ray tracing",
      npuSummary: "Hexagon NPU with on-device generative AI acceleration",
      maxRam: "up to 24GB LPDDR5X",
      highlight: "The flagship Qualcomm platform powering Xiaomi's 2025 numbered flagship series.",
      gradientFrom: "#FF6900",
      gradientTo: "#FFA630",
      sourceNote: "Qualcomm Snapdragon Summit, September 2025 — Xiaomi 17 series",
      geekbenchSingleCore: 3600,
      geekbenchMultiCore: 11200,
      featured: true,
      devices: [
        { name: "Xiaomi 17", category: DeviceCategory.PHONE, releaseDate: "2025-09-25" },
        { name: "Xiaomi 17 Pro", category: DeviceCategory.PHONE, releaseDate: "2025-09-25" },
        { name: "Xiaomi 17 Pro Max", category: DeviceCategory.PHONE, releaseDate: "2025-09-25" },
      ],
    },
    {
      brandId: xiaomi.id,
      name: "Snapdragon 8 Elite",
      series: "Snapdragon",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",
      cpuSummary: "Qualcomm Oryon 2nd-gen CPU, all-big-core design (2+6 cores, up to 4.32GHz)",
      gpuSummary: "Adreno 830 GPU",
      npuSummary: "Hexagon NPU, 45 TOPS class",
      maxRam: "up to 16GB LPDDR5X",
      highlight: "Qualcomm's first fully custom Oryon core design for phones.",
      gradientFrom: "#FF6900",
      gradientTo: "#8e8e93",
      sourceNote: "Qualcomm Snapdragon Summit, October 2024 — Xiaomi 15 series",
      geekbenchSingleCore: 3200,
      geekbenchMultiCore: 9800,
      devices: [
        { name: "Xiaomi 15", category: DeviceCategory.PHONE, releaseDate: "2024-10-29" },
        { name: "Xiaomi 15 Pro", category: DeviceCategory.PHONE, releaseDate: "2024-10-29" },
        { name: "Xiaomi 15 Ultra", category: DeviceCategory.PHONE, releaseDate: "2025-02-27" },
      ],
    },
    {
      brandId: xiaomi.id,
      name: "Dimensity 9400",
      series: "MediaTek Dimensity",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",
      cpuSummary: "All-big-core CPU, 1x Cortex-X925 prime core up to 3.62GHz",
      gpuSummary: "Immortalis-G925 MC12 GPU with hardware ray tracing",
      npuSummary: "7th-gen MediaTek NPU 890",
      maxRam: "up to 24GB LPDDR5X",
      highlight: "MediaTek's flagship chip used across several Redmi high-end models.",
      gradientFrom: "#FF6900",
      gradientTo: "#0071e3",
      sourceNote: "MediaTek announcement, October 2024 — Redmi K80 series",
      geekbenchSingleCore: 3100,
      geekbenchMultiCore: 9700,
      featured: true,
      devices: [
        { name: "Redmi K80 Pro", category: DeviceCategory.PHONE, releaseDate: "2024-11-27" },
      ],
    },
    {
      brandId: xiaomi.id,
      name: "Dimensity 8400",
      series: "MediaTek Dimensity",
      releaseYear: 2025,
      processNode: "TSMC N4P (4nm)",
      cpuSummary: "All-big-core CPU, 8 Cortex-A725-class cores up to 3.25GHz",
      gpuSummary: "Mali-G925 MC6 GPU",
      npuSummary: "MediaTek NPU 890",
      maxRam: "up to 16GB LPDDR5X",
      highlight: "Brings all-big-core efficiency down to Xiaomi's upper-mid-range Redmi Turbo and POCO lines.",
      gradientFrom: "#FFA630",
      gradientTo: "#FF3D00",
      sourceNote: "MediaTek announcement, December 2024 — Redmi Turbo 4, POCO X7 Pro",
      geekbenchSingleCore: 2200,
      geekbenchMultiCore: 6700,
      devices: [
        { name: "Redmi Turbo 4", category: DeviceCategory.PHONE, releaseDate: "2024-12-27" },
        { name: "POCO X7 Pro", category: DeviceCategory.PHONE, releaseDate: "2025-01-16" },
      ],
    },
  ];

  const brandSlugById: Record<string, string> = {
    [apple.id]: "apple",
    [xiaomi.id]: "xiaomi",
  };

  for (const c of chipsets) {
    const chipsetSlug = `${brandSlugById[c.brandId]}-${slugify(c.name)}`;
    const chipset = await prisma.chipset.upsert({
      where: { brandId_name: { brandId: c.brandId, name: c.name } },
      update: {
        slug: chipsetSlug,
        series: c.series,
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
        geekbenchSingleCore: c.geekbenchSingleCore,
        geekbenchMultiCore: c.geekbenchMultiCore,
        featured: c.featured ?? false,
      },
      create: {
        slug: chipsetSlug,
        brandId: c.brandId,
        name: c.name,
        series: c.series,
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
        geekbenchSingleCore: c.geekbenchSingleCore,
        geekbenchMultiCore: c.geekbenchMultiCore,
        featured: c.featured ?? false,
      },
    });

    for (const d of c.devices) {
      const deviceSlug = slugify(d.name);
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
    }
  }

  const adminPasswordHash = await bcrypt.hash("adroit-admin-2026", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPasswordHash,
      displayName: "Admin",
      jobTitle: "Administrator",
      role: Role.ADMIN,
    },
  });

  const yaminPasswordHash = await bcrypt.hash("yamin", 10);
  await prisma.user.upsert({
    where: { username: "yamin" },
    update: { jobTitle: "Sales Manager", role: Role.STAFF },
    create: {
      username: "yamin",
      passwordHash: yaminPasswordHash,
      displayName: "Yamin",
      jobTitle: "Sales Manager",
      role: Role.STAFF,
    },
  });

  console.log(`Seeded ${chipsets.length} chipsets across ${chipsets.reduce((n, c) => n + c.devices.length, 0)} devices.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
