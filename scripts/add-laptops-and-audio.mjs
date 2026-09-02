import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GSMArena carries no laptops and almost no audio products, so these are
// researched from the makers' own pages and named outlets instead. Every
// figure below comes from one of the sources recorded in sourceNote.
const BRAND_GRADIENTS = {
  apple: ["#1d1d1f", "#0071e3"],
  samsung: ["#0a1a3d", "#1428A0"],
  xiaomi: ["#3a1a0a", "#FF6900"],
};

const ENTRIES = [
  {
    brand: "apple",
    chipset: {
      slug: "apple-h1",
      name: "H1",
      series: "H-series",
      kind: "AUDIO_CHIP",
      releaseYear: 2024,
      processNode: "Not disclosed by Apple",
      cpuSummary: "Custom Apple headphone chip — one per ear cup",
      gpuSummary: "N/A — dedicated audio silicon",
      npuSummary: "On-chip processing for Active Noise Cancellation, Adaptive EQ and spatial audio head tracking",
      maxRam: null,
      highlight: "The older H-series chip Apple kept in AirPods Max even for the 2024 USB-C refresh.",
      sourceNote: "Apple Support tech specs, AirPods Max (USB-C), 2024.",
      competitiveEdge:
        "Apple ships one H1 in each ear cup and pairs them with nine microphones — eight feeding Active Noise Cancellation — and the 2024 USB-C revision adds up to 24-bit/48kHz lossless over cable, the first lossless path on any AirPods.",
      competitiveEdgeSourceName: "Apple Support",
      competitiveEdgeSourceUrl: "https://support.apple.com/en-us/121205",
      strengthTag: "Wired lossless + 9-mic ANC",
    },
    devices: [
      {
        name: "AirPods Max (USB-C)",
        category: "EARBUDS",
        releaseDate: "2024-09-20",
        spec: {
          announced: "September 2024",
          bluetooth: "Bluetooth 5.0",
          sensors: "Optical sensor, position sensor, case-detect sensor, accelerometer, gyroscope",
          loudspeaker: "Apple-designed 40mm dynamic driver per ear cup",
          colors: "Midnight, Starlight, Blue, Purple, Orange",
          batteryType: "Up to 20h listening with ANC on",
          price: "From $549",
          sourceName: "Apple Support",
          sourceUrl: "https://support.apple.com/en-us/121205",
        },
      },
    ],
  },
  {
    brand: "samsung",
    chipset: {
      slug: "samsung-intel-core-ultra-7-series-2",
      name: "Intel Core Ultra 7 (Series 2)",
      series: "Intel Core Ultra",
      kind: "LAPTOP_SOC",
      releaseYear: 2025,
      processNode: "Intel 18A-class (Lunar Lake)",
      cpuSummary: "8-core: 4 performance + 4 low-power efficiency cores (Core Ultra 7 258V)",
      gpuSummary: "Integrated Intel Arc graphics",
      npuSummary: "NPU rated up to 47 TOPS",
      maxRam: "16GB / 32GB",
      highlight: "Intel's Lunar Lake generation, and the silicon behind Samsung's Copilot+ Galaxy Book5 line.",
      sourceNote: "Samsung US product pages and Expert Reviews CES 2025 coverage of the Galaxy Book5 line.",
      competitiveEdge:
        "Its 47 TOPS NPU clears Microsoft's 40 TOPS Copilot+ bar, which is what lets the Galaxy Book5 line run Windows' on-device AI features locally — and Samsung pairs it with a claimed 25 hours of local video playback.",
      competitiveEdgeSourceName: "Expert Reviews",
      competitiveEdgeSourceUrl:
        "https://www.expertreviews.co.uk/technology/laptops/ces-samsung-unveils-galaxy-book5-and-book5-360-powered-by-latest-intel-chips",
      strengthTag: "Copilot+ class NPU (47 TOPS)",
    },
    devices: [
      {
        name: "Galaxy Book5 Pro 360",
        category: "LAPTOP",
        releaseDate: "2025-01-06",
        spec: {
          announced: "January 2025 (CES)",
          displayType: "AMOLED touchscreen, 120Hz",
          displaySize: "16 inches",
          displayResolution: "3K (2880 x 1800)",
          displayInches: 16,
          refreshRateHz: 120,
          internalStorage: "16GB RAM, 256GB / 512GB / 1TB SSD",
          dimensions: "12.7 mm thick",
          weight: "1.69 kg (3.72 lbs)",
          weightGrams: 1690,
          batteryType: "76 Wh",
          os: "Windows 11 Pro",
          sourceName: "Samsung",
          sourceUrl: "https://www.samsung.com/us/computing/galaxy-books/galaxy-book5-pro-360/",
        },
      },
    ],
  },
  {
    brand: "xiaomi",
    chipset: {
      slug: "xiaomi-intel-core-i5-220h",
      name: "Intel Core i5-220H",
      series: "Intel Core",
      kind: "LAPTOP_SOC",
      releaseYear: 2025,
      processNode: "Intel 7 (Raptor Lake-H Refresh)",
      cpuSummary: "12-core: 4 performance + 8 efficiency cores, up to 4.9GHz",
      gpuSummary: "Integrated Intel graphics",
      npuSummary: null,
      maxRam: "16GB / 32GB",
      highlight: "The mainstream Intel part behind Xiaomi's 2025 RedmiBook value laptops.",
      sourceNote: "Gizmochina and GizChina RedmiBook 14/16 (2025) pre-order coverage, December 2024.",
      competitiveEdge:
        "A deliberately mainstream Raptor Lake-H Refresh part: no NPU and no Copilot+ badge, but it lets Xiaomi pair 12 cores with a 2.5K 120Hz panel and a 72Wh battery at a price the Copilot+ machines can't reach.",
      competitiveEdgeSourceName: "Gizmochina",
      competitiveEdgeSourceUrl: "https://www.gizmochina.com/2024/12/29/xiaomi-redmi-book-14-16-2025-laptops-key-specs-revealed/",
      strengthTag: "Core count per euro (no NPU)",
    },
    devices: [
      {
        name: "RedmiBook 16 (2025)",
        category: "LAPTOP",
        releaseDate: "2025-01-01",
        spec: {
          announced: "December 2024",
          displaySize: "16 inches",
          displayResolution: "2.5K",
          displayType: "120Hz",
          displayInches: 16,
          refreshRateHz: 120,
          internalStorage: "16GB RAM 512GB / 16GB 1TB / 32GB 1TB SSD",
          batteryType: "72 Wh",
          charging: "100W fast charging",
          chargingWatts: 100,
          sourceName: "Gizmochina",
          sourceUrl: "https://www.gizmochina.com/2024/12/29/xiaomi-redmi-book-14-16-2025-laptops-key-specs-revealed/",
        },
      },
    ],
  },
  {
    brand: "xiaomi",
    chipset: {
      slug: "xiaomi-buds-chip",
      name: "Xiaomi Buds audio chip (undisclosed)",
      series: "Xiaomi Buds",
      kind: "AUDIO_CHIP",
      releaseYear: 2024,
      processNode: "Not publicly disclosed by Xiaomi",
      cpuSummary: "Not publicly disclosed by Xiaomi",
      gpuSummary: "N/A — dedicated audio silicon",
      npuSummary: null,
      maxRam: null,
      highlight: "Like Samsung, Xiaomi publishes driver and codec details for its earbuds but never a chip name.",
      sourceNote:
        "Xiaomi's own Redmi Buds 6 Pro spec page and GSMArena's reviews list drivers, codecs and battery but no chipset name — confirmed absent rather than assumed.",
    },
    devices: [
      {
        name: "Xiaomi Buds 5 Pro",
        category: "EARBUDS",
        releaseDate: "2024-10-29",
        spec: {
          announced: "October 2024",
          batteryType: "53 mAh (earbud), 570 mAh (charging case)",
          loudspeaker: "Triple-driver setup, LDAC hi-res streaming",
          sensors: "Triple microphones, ANC",
          sourceName: "GSMArena",
          sourceUrl: "https://www.gsmarena.com/xiaomi_buds_5_pro_review_-news-66865.php",
        },
      },
      {
        name: "Redmi Buds 6 Pro",
        category: "EARBUDS",
        releaseDate: "2024-11-27",
        spec: {
          announced: "November 2024",
          batteryType: "54 mAh (earbud), 480 mAh (charging case) — up to 36h total",
          loudspeaker: "11mm titanium-coated dynamic drivers, 55dB ANC",
          bluetooth: "Bluetooth 5.3, LHDC 5.0, LC3",
          usb: "USB Type-C",
          sourceName: "Xiaomi",
          sourceUrl: "https://www.mi.com/global/product/redmi-buds-6-pro/specs/",
        },
      },
    ],
  },
  {
    brand: "samsung",
    existingChipsetSlug: "samsung-buds-chip",
    devices: [
      {
        name: "Galaxy Buds3 FE",
        category: "EARBUDS",
        releaseDate: "2025-08-19",
        spec: {
          announced: "August 2025",
          dimensions: "21.1 x 18 x 33.8 mm (earbud); 48.7 x 58.9 x 24.4 mm (case)",
          weight: "5 g per earbud; 41.8 g case",
          weightGrams: 5,
          batteryType: "53 mAh (earbud), 512 mAh (case) — 8h ANC on, 24h ANC off",
          bluetooth: "Bluetooth 5.4, AAC, SBC, SSC",
          loudspeaker: "Dynamic drivers, 24-bit Hi-Fi, spatial audio",
          sensors: "Three microphones for ANC",
          sourceName: "Samsung Newsroom",
          sourceUrl:
            "https://news.samsung.com/global/samsung-introduces-galaxy-buds3-fe-with-iconic-design-enhanced-sound-and-galaxy-ai-integration",
        },
      },
    ],
  },
  {
    brand: "apple",
    existingChipsetSlug: "apple-m4",
    devices: [
      {
        name: 'MacBook Air 13" (M4)',
        category: "LAPTOP",
        releaseDate: "2025-03-12",
        spec: {
          announced: "March 2025",
          displaySize: "13.6 inches",
          displayInches: 13.6,
          internalStorage: "up to 32GB unified memory, up to 2TB SSD",
          os: "macOS",
          sourceName: "Apple Newsroom",
          sourceUrl: "https://www.apple.com/newsroom/2025/03/apple-introduces-the-new-macbook-air-with-the-m4-chip-and-a-sky-blue-color/",
        },
      },
      {
        name: 'MacBook Air 15" (M4)',
        category: "LAPTOP",
        releaseDate: "2025-03-12",
        spec: {
          announced: "March 2025",
          displaySize: "15.3 inches",
          displayInches: 15.3,
          internalStorage: "up to 32GB unified memory, up to 2TB SSD",
          os: "macOS",
          sourceName: "Apple Newsroom",
          sourceUrl: "https://www.apple.com/newsroom/2025/03/apple-introduces-the-new-macbook-air-with-the-m4-chip-and-a-sky-blue-color/",
        },
      },
    ],
  },
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/["”″]/g, "")
    .replace(/\(|\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

let chipsetCount = 0;
let deviceCount = 0;

for (const entry of ENTRIES) {
  const brand = await prisma.brand.findUnique({ where: { slug: entry.brand } });
  if (!brand) {
    console.log(`! brand ${entry.brand} not found, skipping`);
    continue;
  }

  let chipset;
  if (entry.existingChipsetSlug) {
    chipset = await prisma.chipset.findUnique({ where: { slug: entry.existingChipsetSlug } });
    if (!chipset) {
      console.log(`! chipset ${entry.existingChipsetSlug} not found, skipping its devices`);
      continue;
    }
  } else {
    const [gradientFrom, gradientTo] = BRAND_GRADIENTS[entry.brand];
    const { slug, ...rest } = entry.chipset;
    chipset = await prisma.chipset.upsert({
      where: { brandId_name: { brandId: brand.id, name: entry.chipset.name } },
      update: { slug, brandId: brand.id, ...rest, gradientFrom, gradientTo },
      create: { slug, brandId: brand.id, ...rest, gradientFrom, gradientTo },
    });
    chipsetCount++;
    console.log(`chipset: ${chipset.name}`);
  }

  for (const d of entry.devices) {
    const deviceSlug = slugify(d.name);
    const device = await prisma.device.upsert({
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

    await prisma.deviceSpec.upsert({
      where: { deviceId: device.id },
      update: d.spec,
      create: { deviceId: device.id, ...d.spec },
    });

    deviceCount++;
    console.log(`  device: ${d.name} (${deviceSlug})`);
  }
}

console.log(`\n${chipsetCount} chipsets, ${deviceCount} devices upserted.`);
