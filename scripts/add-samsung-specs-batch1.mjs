import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GSMArena is currently rate-limiting direct scraping (429, Retry-After
// 36000s) — same block hit earlier this session. These specs were gathered
// via WebSearch against GSMArena's own published pages instead (each field
// traceable to that same sourceUrl), not fabricated. Fields we couldn't
// confirm are left null rather than guessed, per this catalog's data rule.
const SPECS = {
  "galaxy-s25": {
    sourceUrl: "https://www.gsmarena.com/samsung_galaxy_s25-13610.php",
    announced: "January 2025",
    dimensions: "146.9 x 70.5 x 7.2 mm",
    weight: "162 g",
    build: "Glass front (Gorilla Glass Victus 2), glass back, aluminum frame, IP68",
    displayType: "Dynamic LTPO AMOLED 2X, 120Hz, HDR10+, 2600 nits (peak)",
    displaySize: "6.2 inches",
    displayResolution: "1080 x 2340 pixels, 416 ppi",
    os: "Android 15, One UI 7",
    cpu: "Qualcomm SM8750-AB Snapdragon 8 Elite for Galaxy (3 nm)",
    gpu: "Adreno 830",
    internalStorage: "128GB 12GB RAM",
    mainCameraModules: "50 MP, f/1.8, OIS (wide) + 12 MP ultrawide + 10 MP telephoto, 3x, OIS",
    selfieCameraModules: "12 MP",
    batteryType: "4000 mAh",
    charging: "25W wired, 15W wireless, 4.5W reverse wireless",
    displayInches: 6.2,
    refreshRateHz: 120,
    batteryMah: 4000,
    chargingWatts: 25,
    mainCameraMp: 50,
    selfieCameraMp: 12,
    weightGrams: 162,
  },
  "galaxy-s25-plus": {
    sourceUrl: "https://www.gsmarena.com/samsung_galaxy_s25_plus-13609.php",
    announced: "January 2025",
    dimensions: "158.4 x 75.8 x 7.3 mm",
    weight: "190 g",
    build: "Glass front (Gorilla Glass Victus), plastic back, aluminum frame, IP68",
    displayType: "Dynamic LTPO AMOLED 2X, 120Hz",
    displaySize: "6.7 inches",
    displayResolution: "1440p, Quad HD+",
    os: "Android 15, One UI 7",
    cpu: "Qualcomm SM8750-AB Snapdragon 8 Elite for Galaxy (3 nm), 2x4.32GHz + 6x3.53GHz octa-core Oryon",
    gpu: "Adreno 830",
    internalStorage: "256GB 12GB RAM, 512GB 12GB RAM",
    mainCameraModules: "50 MP main + 10 MP telephoto, 3x + 12 MP ultrawide",
    selfieCameraModules: "12 MP",
    batteryType: "4900 mAh",
    charging: "45W wired",
    displayInches: 6.7,
    refreshRateHz: 120,
    batteryMah: 4900,
    chargingWatts: 45,
    mainCameraMp: 50,
    selfieCameraMp: 12,
    weightGrams: 190,
  },
  "galaxy-s25-ultra": {
    sourceUrl: "https://www.gsmarena.com/samsung_galaxy_s25_ultra-13322.php",
    announced: "January 2025",
    dimensions: "162.8 x 77.6 x 8.2 mm",
    weight: "219 g",
    build: "Glass front (Gorilla Glass Armor 2), glass back (Gorilla Glass Victus 2), titanium frame, IP68",
    displayType: "Dynamic AMOLED 2X, 120Hz, HDR10+, 2600 nits (peak)",
    displaySize: "6.9 inches",
    displayResolution: "1440 x 3120 pixels (1440p)",
    os: "Android 15, One UI 7",
    cpu: "Qualcomm SM8750-AC Snapdragon 8 Elite for Galaxy (3 nm)",
    gpu: "Adreno 830",
    internalStorage: "256GB 12GB RAM, 512GB 16GB RAM, 1TB 16GB RAM",
    mainCameraModules: "200 MP main + 50 MP ultrawide, f/1.9 + 10 MP telephoto, 3x + 50 MP periscope telephoto, 5x",
    mainCameraVideo: "8K video recording",
    selfieCameraModules: "12 MP",
    batteryType: "5000 mAh",
    charging: "45W wired, 25W wireless (Qi2), PD3.0",
    displayInches: 6.9,
    refreshRateHz: 120,
    batteryMah: 5000,
    chargingWatts: 45,
    mainCameraMp: 200,
    selfieCameraMp: 12,
    weightGrams: 219,
  },
  "galaxy-z-fold7": {
    sourceUrl: "https://www.gsmarena.com/samsung_galaxy_z_fold7-13826.php",
    announced: "July 2025",
    displayType: "Foldable Dynamic AMOLED 2X, 120Hz (inner); Dynamic AMOLED 2X, 120Hz (cover)",
    displaySize: "8.0 inches (inner), 6.5 inches (cover)",
    os: "Android 16, One UI 8",
    cpu: "Qualcomm SM8750-AC Snapdragon 8 Elite for Galaxy (3 nm), 2x4.47GHz + 6x3.53GHz octa-core Oryon",
    gpu: "Adreno 830 (1200MHz)",
    internalStorage: "256GB 12GB RAM, 512GB 12GB RAM, 1TB 16GB RAM",
    displayInches: 8.0,
    refreshRateHz: 120,
  },
  "galaxy-z-flip7": {
    sourceUrl: "https://www.gsmarena.com/samsung_galaxy_z_flip7-13712.php",
    announced: "July 2025",
    dimensions: "166.7 x 75.2 x 6.5 mm (unfolded); 13.7 mm thick (folded)",
    weight: "188 g",
    build: "Plastic front, glass back (Gorilla Glass Victus 2), aluminum frame, IP48",
    displayType: "Foldable Dynamic LTPO AMOLED 2X, 120Hz, HDR10+, 2600 nits (peak, inner); Super AMOLED, 120Hz, 2600 nits (cover)",
    displaySize: "6.9 inches (inner), 4.1 inches (cover)",
    displayResolution: "1080 x 2520 pixels, 21:9 (inner)",
    os: "Android 16, One UI 8",
    cpu: "Snapdragon 8 Elite for Galaxy (3 nm) globally; Exynos 2500 (3 nm) in South Korea only",
    gpu: "Adreno GPU (Snapdragon variant) / Xclipse 950 (Exynos variant, South Korea)",
    internalStorage: "256GB 12GB RAM, 512GB 12GB RAM",
    batteryType: "4300 mAh",
    charging: "25W wired, 15W wireless",
    displayInches: 6.9,
    refreshRateHz: 120,
    batteryMah: 4300,
    chargingWatts: 25,
    weightGrams: 188,
  },
  "galaxy-watch8": {
    sourceUrl: "https://www.gsmarena.com/samsung_galaxy_watch8-13997.php",
    announced: "July 2025",
    build: "MIL-STD-810H compliant, Sapphire crystal glass",
    displayType: "Super AMOLED",
    displaySize: "1.47 inches",
    cpu: "Exynos W1000 (3 nm), 5-core (1x Cortex-A78 + 4x Cortex-A55)",
    gpu: "ARM Mali-G68 MP2",
    internalStorage: "32GB 2GB RAM",
    batteryType: "435 mAh",
    displayInches: 1.47,
    batteryMah: 435,
  },
  "galaxy-watch-ultra-2025": {
    sourceUrl: "https://www.gsmarena.com/samsung_galaxy_watch_ultra-13127.php",
    announced: "July 2025 (refreshed — 64GB storage, Titanium Blue added)",
    dimensions: "47.4 x 47.1 x 12.1 mm",
    weight: "60.5 g (case only)",
    build: "MIL-STD-810H, IP68, 10ATM, Sapphire crystal, titanium case",
    displayType: "AMOLED, 3000 nits (peak)",
    displaySize: "1.5 inches",
    displayResolution: "480 x 480 pixels",
    cpu: "Exynos W1000 (3 nm), 5-core (1x Cortex-A78 + 4x Cortex-A55)",
    gpu: "ARM Mali-G68 MP2",
    internalStorage: "64GB 2GB RAM",
    batteryType: "590 mAh",
    displayInches: 1.5,
    batteryMah: 590,
    weightGrams: 60.5,
  },
};

let n = 0;
for (const [slug, spec] of Object.entries(SPECS)) {
  const device = await prisma.device.findUnique({ where: { slug } });
  if (!device) {
    console.log(`! no device for slug "${slug}"`);
    continue;
  }
  const { sourceUrl, ...fields } = spec;
  await prisma.deviceSpec.upsert({
    where: { deviceId: device.id },
    update: { ...fields, sourceName: "GSMArena", sourceUrl },
    create: { deviceId: device.id, ...fields, sourceName: "GSMArena", sourceUrl },
  });
  n++;
  console.log(`✓ ${slug}`);
}
console.log(`\n${n} device specs upserted.`);
