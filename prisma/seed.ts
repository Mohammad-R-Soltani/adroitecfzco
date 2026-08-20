import "dotenv/config";

import {
  PrismaClient,
  BrandSlug,
  DeviceCategory,
  Role,
} from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/slugify";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });


// ============================================================
// Wikimedia Commons image resolver
// ============================================================

type CommonsImage = {
  imageUrl: string;
  sourceUrl: string;
  title: string;
  width?: number;
  height?: number;
};

async function findCommonsImage(
  searchTerm: string,
): Promise<CommonsImage | null> {
  try {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: `${searchTerm} filetype:bitmap`,
      gsrnamespace: "6",
      gsrlimit: "10",
      prop: "imageinfo",
      iiprop: "url|size",
      iiurlwidth: "1600",
      format: "json",
      origin: "*",
    });

    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
      {
        headers: {
          "User-Agent":
            "adroitecfzco/1.0 (device catalog; educational project)",
        },
      },
    );

    if (!response.ok) {
      console.warn(
        `⚠ Wikimedia search failed for "${searchTerm}": ${response.status}`,
      );

      return null;
    }

    const data = await response.json();

    const pages = data?.query?.pages;

    if (!pages) {
      return null;
    }

    const candidates = Object.values(pages) as any[];

    if (!candidates.length) {
      return null;
    }

    // Prefer a result whose title contains the device name.
    const normalizedSearch = searchTerm.toLowerCase();

    const best =
      candidates.find((page) =>
        String(page.title ?? "")
          .toLowerCase()
          .includes(normalizedSearch),
      ) ?? candidates[0];

    const info = best?.imageinfo?.[0];

    if (!info?.thumburl && !info?.url) {
      return null;
    }

    return {
      imageUrl: info.thumburl ?? info.url,
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(
        best.title.replaceAll(" ", "_"),
      )}`,
      title: best.title,
      width: info.thumbwidth ?? info.width,
      height: info.thumbheight ?? info.height,
    };
  } catch (error) {
    console.warn(
      `⚠ Wikimedia lookup failed for "${searchTerm}":`,
      error,
    );

    return null;
  }
}


// ============================================================
// Image cache
// ============================================================

const imageCache = new Map<string, CommonsImage | null>();

async function getDeviceImage(
  deviceName: string,
): Promise<CommonsImage | null> {
  if (imageCache.has(deviceName)) {
    return imageCache.get(deviceName)!;
  }

  console.log(`🔎 Searching image for: ${deviceName}`);

  const image = await findCommonsImage(deviceName);

  imageCache.set(deviceName, image);

  if (image) {
    console.log(`   ✓ ${image.title}`);
    console.log(`   → ${image.imageUrl}`);
  } else {
    console.log(`   ⚠ No Wikimedia image found`);
  }

  // Avoid hammering Wikimedia.
  await new Promise((resolve) => setTimeout(resolve, 350));

  return image;
}


// ============================================================
// Types
// ============================================================

type DeviceSeed = {
  name: string;
  category: DeviceCategory;
  releaseDate: string;

  // Better search term for Wikimedia.
  imageSearch?: string;
};

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

  devices: DeviceSeed[];
};


// ============================================================
// Main
// ============================================================

async function main() {
  console.log("🚀 Starting database seed...\n");


  // ==========================================================
  // Brands
  // ==========================================================

  const apple = await prisma.brand.upsert({
    where: {
      slug: BrandSlug.apple,
    },

    update: {},

    create: {
      slug: BrandSlug.apple,
      name: "Apple",
      accent: "#0071e3",
    },
  });


  const xiaomi = await prisma.brand.upsert({
    where: {
      slug: BrandSlug.xiaomi,
    },

    update: {},

    create: {
      slug: BrandSlug.xiaomi,
      name: "Xiaomi",
      accent: "#FF6900",
    },
  });


  // ==========================================================
  // Chipsets
  // ==========================================================

  const chipsets: ChipsetSeed[] = [

    // ========================================================
    // APPLE A19 PRO
    // ========================================================

    {
      brandId: apple.id,
      name: "A19 Pro",
      series: "A-series",
      releaseYear: 2025,
      processNode: "TSMC N3P (3rd-gen 3nm)",
      cpuSummary:
        "6-core CPU (2 performance + 4 efficiency)",
      gpuSummary:
        "6-core GPU with per-core Neural Accelerators and hardware ray tracing",
      npuSummary:
        "16-core Neural Engine",
      maxRam: "12GB",

      highlight:
        "Adds a vapor chamber and redesigned GPU architecture for demanding on-device AI workloads.",

      gradientFrom: "#1d1d1f",
      gradientTo: "#0071e3",

      sourceNote:
        "Apple keynote, September 2025 — iPhone 17 Pro / Pro Max",

      geekbenchSingleCore: 3800,
      geekbenchMultiCore: 9600,
      featured: true,

      devices: [
        {
          name: "iPhone 17 Pro",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-09-19",
          imageSearch: "iPhone 17 Pro",
        },

        {
          name: "iPhone 17 Pro Max",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-09-19",
          imageSearch: "iPhone 17 Pro Max",
        },
      ],
    },


    // ========================================================
    // APPLE A19
    // ========================================================

    {
      brandId: apple.id,
      name: "A19",
      series: "A-series",
      releaseYear: 2025,
      processNode: "TSMC N3P (3rd-gen 3nm)",

      cpuSummary:
        "6-core CPU (2 performance + 4 efficiency)",

      gpuSummary:
        "5-core GPU",

      npuSummary:
        "16-core Neural Engine",

      maxRam: "8GB",

      highlight:
        "Powers the standard iPhone 17 line and iPhone Air.",

      gradientFrom: "#2c2c2e",
      gradientTo: "#5ac8fa",

      sourceNote:
        "Apple keynote, September 2025 — iPhone 17 / iPhone Air",

      geekbenchSingleCore: 3700,
      geekbenchMultiCore: 9100,

      devices: [
        {
          name: "iPhone 17",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-09-19",
          imageSearch: "iPhone 17",
        },

        {
          name: "iPhone Air",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-09-19",
          imageSearch: "iPhone Air",
        },
      ],
    },


    // ========================================================
    // APPLE A18 PRO
    // ========================================================

    {
      brandId: apple.id,
      name: "A18 Pro",
      series: "A-series",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",

      cpuSummary:
        "6-core CPU (2 performance + 4 efficiency)",

      gpuSummary:
        "6-core GPU with hardware-accelerated ray tracing",

      npuSummary:
        "16-core Neural Engine",

      maxRam: "8GB",

      highlight:
        "First Apple silicon rated for on-device Apple Intelligence at launch.",

      gradientFrom: "#1d1d1f",
      gradientTo: "#3a3a3c",

      sourceNote:
        "Apple keynote, September 2024 — iPhone 16 Pro / Pro Max",

      geekbenchSingleCore: 3400,
      geekbenchMultiCore: 8300,
      featured: true,

      devices: [
        {
          name: "iPhone 16 Pro",
          category: DeviceCategory.PHONE,
          releaseDate: "2024-09-20",
          imageSearch: "iPhone 16 Pro",
        },

        {
          name: "iPhone 16 Pro Max",
          category: DeviceCategory.PHONE,
          releaseDate: "2024-09-20",
          imageSearch: "iPhone 16 Pro Max",
        },
      ],
    },


    // ========================================================
    // APPLE A18
    // ========================================================

    {
      brandId: apple.id,
      name: "A18",
      series: "A-series",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",

      cpuSummary:
        "6-core CPU (2 performance + 4 efficiency)",

      gpuSummary:
        "5-core GPU",

      npuSummary:
        "16-core Neural Engine",

      maxRam: "8GB",

      highlight:
        "Brought Apple Intelligence support to the non-Pro iPhone line.",

      gradientFrom: "#3a3a3c",
      gradientTo: "#8e8e93",

      sourceNote:
        "Apple keynotes, 2024/2025 — iPhone 16, 16 Plus, 16e",

      geekbenchSingleCore: 3300,
      geekbenchMultiCore: 8000,

      devices: [
        {
          name: "iPhone 16",
          category: DeviceCategory.PHONE,
          releaseDate: "2024-09-20",
          imageSearch: "iPhone 16",
        },

        {
          name: "iPhone 16 Plus",
          category: DeviceCategory.PHONE,
          releaseDate: "2024-09-20",
          imageSearch: "iPhone 16 Plus",
        },

        {
          name: "iPhone 16e",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-02-28",
          imageSearch: "iPhone 16e",
        },
      ],
    },


    // ========================================================
    // APPLE M5
    // ========================================================

    {
      brandId: apple.id,
      name: "M5",
      series: "M-series",
      releaseYear: 2025,
      processNode: "TSMC N3P (3rd-gen 3nm)",

      cpuSummary:
        "10-core CPU (4 performance + 6 efficiency)",

      gpuSummary:
        "10-core GPU with per-core Neural Accelerators",

      npuSummary:
        "16-core Neural Engine",

      maxRam: "up to 32GB unified memory",

      highlight:
        "Major generational GPU improvement for on-device AI compute.",

      gradientFrom: "#0a0a0a",
      gradientTo: "#7c3aed",

      sourceNote:
        "Apple announcement, October 2025 — MacBook Pro and iPad Pro",

      geekbenchSingleCore: 4000,
      geekbenchMultiCore: 16500,
      featured: true,

      devices: [
        {
          name: 'MacBook Pro 14" (M5)',
          category: DeviceCategory.LAPTOP,
          releaseDate: "2025-10-22",
          imageSearch: "MacBook Pro M5",
        },

        {
          name: "iPad Pro (M5)",
          category: DeviceCategory.TABLET,
          releaseDate: "2025-10-22",
          imageSearch: "iPad Pro M5",
        },
      ],
    },


    // ========================================================
    // APPLE M4
    // ========================================================

    {
      brandId: apple.id,
      name: "M4",
      series: "M-series",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",

      cpuSummary:
        "Up to 10-core CPU",

      gpuSummary:
        "Up to 10-core GPU",

      npuSummary:
        "16-core Neural Engine",

      maxRam: "up to 32GB unified memory",

      highlight:
        "Debuted in iPad Pro before expanding across Apple's Mac lineup.",

      gradientFrom: "#1d1d1f",
      gradientTo: "#34c759",

      sourceNote:
        "Apple announcements, 2024 — iPad Pro, MacBook Pro, iMac and Mac mini",

      geekbenchSingleCore: 3900,
      geekbenchMultiCore: 14700,

      devices: [
        {
          name: "iPad Pro (M4)",
          category: DeviceCategory.TABLET,
          releaseDate: "2024-05-15",
          imageSearch: "iPad Pro M4",
        },

        {
          name: 'MacBook Pro 14"/16" (M4)',
          category: DeviceCategory.LAPTOP,
          releaseDate: "2024-10-30",
          imageSearch: "MacBook Pro M4",
        },

        {
          name: "Mac mini (M4)",
          category: DeviceCategory.LAPTOP,
          releaseDate: "2024-11-08",
          imageSearch: "Mac mini M4",
        },
      ],
    },


    // ========================================================
    // APPLE M4 PRO / MAX
    // ========================================================

    {
      brandId: apple.id,
      name: "M4 Pro / M4 Max",
      series: "M-series",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",

      cpuSummary:
        "Up to 14-core CPU (Pro) / 16-core CPU (Max)",

      gpuSummary:
        "Up to 20-core GPU (Pro) / 40-core GPU (Max)",

      npuSummary:
        "16-core Neural Engine",

      maxRam:
        "up to 128GB unified memory",

      highlight:
        "Workstation-class Apple silicon for MacBook Pro, Mac mini and Mac Studio.",

      gradientFrom: "#1d1d1f",
      gradientTo: "#ff375f",

      sourceNote:
        "Apple announcement, October 2024 — MacBook Pro, Mac mini, Mac Studio",

      geekbenchSingleCore: 3900,
      geekbenchMultiCore: 22000,

      devices: [
        {
          name: 'MacBook Pro 14"/16" (M4 Pro/Max)',
          category: DeviceCategory.LAPTOP,
          releaseDate: "2024-10-30",
          imageSearch: "MacBook Pro M4",
        },

        {
          name: "Mac Studio (M4 Max)",
          category: DeviceCategory.LAPTOP,
          releaseDate: "2025-03-12",
          imageSearch: "Mac Studio M4",
        },
      ],
    },


    // ========================================================
    // XIAOMI XRING O1
    // ========================================================

    {
      brandId: xiaomi.id,
      name: "XRing O1",
      series: "XRing",
      releaseYear: 2025,
      processNode: "TSMC N3 (3nm)",

      cpuSummary:
        "10-core Arm v9.2 CPU (1 prime + 3 performance + 6 efficiency)",

      gpuSummary:
        "Immortalis-G925 MC12 GPU",

      npuSummary:
        "3rd-gen Xiaomi NPU",

      maxRam:
        "up to 24GB LPDDR5X",

      highlight:
        "Xiaomi's first fully self-designed flagship SoC.",

      gradientFrom: "#FF6900",
      gradientTo: "#1d1d1f",

      sourceNote:
        "Xiaomi launch event, May 2025",

      geekbenchSingleCore: 2400,
      geekbenchMultiCore: 7800,
      featured: true,

      devices: [
        {
          name: "Xiaomi 15S Pro",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-05-08",
          imageSearch: "Xiaomi 15S Pro",
        },

        {
          name: "Xiaomi Pad 7 Ultra",
          category: DeviceCategory.TABLET,
          releaseDate: "2025-05-08",
          imageSearch: "Xiaomi Pad 7 Ultra",
        },
      ],
    },


    // ========================================================
    // SNAPDRAGON 8 ELITE GEN 5
    // ========================================================

    {
      brandId: xiaomi.id,
      name: "Snapdragon 8 Elite Gen 5",
      series: "Snapdragon",
      releaseYear: 2025,
      processNode: "TSMC N3P (3rd-gen 3nm)",

      cpuSummary:
        "Qualcomm Oryon 3rd-generation custom CPU",

      gpuSummary:
        "Adreno GPU with hardware ray tracing",

      npuSummary:
        "Hexagon NPU with generative AI acceleration",

      maxRam:
        "up to 24GB LPDDR5X",

      highlight:
        "Flagship Qualcomm platform for Xiaomi's numbered flagship series.",

      gradientFrom: "#FF6900",
      gradientTo: "#FFA630",

      sourceNote:
        "Qualcomm Snapdragon Summit, 2025",

      geekbenchSingleCore: 3600,
      geekbenchMultiCore: 11200,
      featured: true,

      devices: [
        {
          name: "Xiaomi 17",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-09-25",
          imageSearch: "Xiaomi 17",
        },

        {
          name: "Xiaomi 17 Pro",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-09-25",
          imageSearch: "Xiaomi 17 Pro",
        },

        {
          name: "Xiaomi 17 Pro Max",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-09-25",
          imageSearch: "Xiaomi 17 Pro Max",
        },
      ],
    },


    // ========================================================
    // SNAPDRAGON 8 ELITE
    // ========================================================

    {
      brandId: xiaomi.id,
      name: "Snapdragon 8 Elite",
      series: "Snapdragon",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",

      cpuSummary:
        "Qualcomm Oryon 2nd-gen CPU, all-big-core design",

      gpuSummary:
        "Adreno 830 GPU",

      npuSummary:
        "Hexagon NPU",

      maxRam:
        "up to 16GB LPDDR5X",

      highlight:
        "Qualcomm's first fully custom Oryon core design for phones.",

      gradientFrom: "#FF6900",
      gradientTo: "#8e8e93",

      sourceNote:
        "Qualcomm Snapdragon Summit, October 2024",

      geekbenchSingleCore: 3200,
      geekbenchMultiCore: 9800,

      devices: [
        {
          name: "Xiaomi 15",
          category: DeviceCategory.PHONE,
          releaseDate: "2024-10-29",
          imageSearch: "Xiaomi 15",
        },

        {
          name: "Xiaomi 15 Pro",
          category: DeviceCategory.PHONE,
          releaseDate: "2024-10-29",
          imageSearch: "Xiaomi 15 Pro",
        },

        {
          name: "Xiaomi 15 Ultra",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-02-27",
          imageSearch: "Xiaomi 15 Ultra",
        },
      ],
    },


    // ========================================================
    // DIMENSITY 9400
    // ========================================================

    {
      brandId: xiaomi.id,
      name: "Dimensity 9400",
      series: "MediaTek Dimensity",
      releaseYear: 2024,
      processNode: "TSMC N3E (2nd-gen 3nm)",

      cpuSummary:
        "All-big-core CPU with Cortex-X925 prime core",

      gpuSummary:
        "Immortalis-G925 MC12 GPU",

      npuSummary:
        "MediaTek NPU 890",

      maxRam:
        "up to 24GB LPDDR5X",

      highlight:
        "MediaTek flagship platform used across high-end Xiaomi ecosystem devices.",

      gradientFrom: "#FF6900",
      gradientTo: "#0071e3",

      sourceNote:
        "MediaTek announcement, October 2024",

      geekbenchSingleCore: 3100,
      geekbenchMultiCore: 9700,
      featured: true,

      devices: [
        {
          name: "Redmi K80 Pro",
          category: DeviceCategory.PHONE,
          releaseDate: "2024-11-27",
          imageSearch: "Redmi K80 Pro",
        },
      ],
    },


    // ========================================================
    // DIMENSITY 8400
    // ========================================================

    {
      brandId: xiaomi.id,
      name: "Dimensity 8400",
      series: "MediaTek Dimensity",
      releaseYear: 2025,
      processNode: "TSMC N4P (4nm)",

      cpuSummary:
        "All-big-core CPU, 8 Cortex-A725-class cores",

      gpuSummary:
        "Mali-G925 MC6 GPU",

      npuSummary:
        "MediaTek NPU 890",

      maxRam:
        "up to 16GB LPDDR5X",

      highlight:
        "Brings all-big-core architecture to upper-mid-range Xiaomi devices.",

      gradientFrom: "#FFA630",
      gradientTo: "#FF3D00",

      sourceNote:
        "MediaTek announcement, December 2024",

      geekbenchSingleCore: 2200,
      geekbenchMultiCore: 6700,

      devices: [
        {
          name: "Redmi Turbo 4",
          category: DeviceCategory.PHONE,
          releaseDate: "2024-12-27",
          imageSearch: "Redmi Turbo 4",
        },

        {
          name: "POCO X7 Pro",
          category: DeviceCategory.PHONE,
          releaseDate: "2025-01-16",
          imageSearch: "POCO X7 Pro",
        },
      ],
    },
  ];


  // ==========================================================
  // Seed chipsets + devices
  // ==========================================================

  const brandSlugById: Record<string, string> = {
    [apple.id]: "apple",
    [xiaomi.id]: "xiaomi",
  };


  let totalDevices = 0;


  for (const c of chipsets) {
    const chipsetSlug =
      `${brandSlugById[c.brandId]}-${slugify(c.name)}`;


    console.log(`\n📦 ${c.name}`);


    const chipset = await prisma.chipset.upsert({
      where: {
        brandId_name: {
          brandId: c.brandId,
          name: c.name,
        },
      },

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


    // ========================================================
    // Devices
    // ========================================================

    for (const d of c.devices) {
      totalDevices++;

      const deviceSlug = slugify(d.name);

      const image = await getDeviceImage(
        d.imageSearch ?? d.name,
      );


      await prisma.device.upsert({
        where: {
          chipsetId_name: {
            chipsetId: chipset.id,
            name: d.name,
          },
        },

        update: {
          slug: deviceSlug,
          category: d.category,
          releaseDate: new Date(d.releaseDate),

          ...(image
            ? {
                imageUrl: image.imageUrl,
                imageWidth: image.width,
                imageHeight: image.height,

                imageAttributionText:
                  image.title,

                imageAttributionUrl:
                  image.sourceUrl,

                imageLicense:
                  "Wikimedia Commons",
              }
            : {}),
        },

        create: {
          slug: deviceSlug,
          chipsetId: chipset.id,
          name: d.name,
          category: d.category,
          releaseDate: new Date(d.releaseDate),

          imageUrl: image?.imageUrl ?? null,
          imageWidth: image?.width ?? null,
          imageHeight: image?.height ?? null,

          imageAttributionText:
            image?.title ?? null,

          imageAttributionUrl:
            image?.sourceUrl ?? null,

          imageLicense:
            image ? "Wikimedia Commons" : null,
        },
      });


      console.log(
        image
          ? `   🖼 Image saved`
          : `   ⚠ Device saved without image`,
      );
    }
  }


  // ==========================================================
  // Users
  // ==========================================================

  console.log("\n👤 Creating users...");


  const adminPasswordHash = await bcrypt.hash(
    "adroit-admin-2026",
    10,
  );


  await prisma.user.upsert({
    where: {
      username: "admin",
    },

    update: {},

    create: {
      username: "admin",
      passwordHash: adminPasswordHash,
      displayName: "Admin",
      jobTitle: "Administrator",
      role: Role.ADMIN,
    },
  });


  const yaminPasswordHash = await bcrypt.hash(
    "yamin",
    10,
  );


  await prisma.user.upsert({
    where: {
      username: "yamin",
    },

    update: {
      jobTitle: "Sales Manager",
      role: Role.STAFF,
    },

    create: {
      username: "yamin",
      passwordHash: yaminPasswordHash,
      displayName: "Yamin",
      jobTitle: "Sales Manager",
      role: Role.STAFF,
    },
  });


  // ==========================================================
  // Done
  // ==========================================================

  console.log("\n======================================");
  console.log("✅ SEED COMPLETED");
  console.log("======================================");

  console.log(
    `Chipsets: ${chipsets.length}`,
  );

  console.log(
    `Devices: ${totalDevices}`,
  );

  console.log(
    `Images resolved: ${
      [...imageCache.values()].filter(Boolean).length
    }`,
  );

  console.log(
    `Images missing: ${
      [...imageCache.values()].filter((x) => !x).length
    }`,
  );

  console.log("======================================\n");
}


// ============================================================
// Run
// ============================================================

main()
  .catch((error) => {
    console.error("\n❌ SEED FAILED\n");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });