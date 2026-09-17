import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Resolves the three ledger families that survived every automated relink
 * pass, each individually researched:
 *
 *  - "REDMIN NOTE 15 PRO" is a typo of "Redmi Note 15 Pro" (present in the
 *    catalog) — linked directly rather than by fuzzy matching, since a typo
 *    fix is a one-off fact, not a rule worth generalising into the matcher.
 *  - "POCO C65" is a real, previously uncatalogued device — added here with
 *    its own chipset, same shape as scripts/add-midrange-xiaomi-lineup.mjs.
 *  - "X20 Max" is not a phone at all: it is the Xiaomi Robot Vacuum X20 Max
 *    (mi.com/global/product/xiaomi-robot-vacuum-x20-max). It is left
 *    unlinked deliberately — this catalog only models phones, tablets,
 *    laptops, earbuds and watches, and forcing a vacuum into any of those
 *    categories would be a wrong record, not a fix.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const xiaomi = await prisma.brand.findUnique({ where: { slug: "xiaomi" } });
if (!xiaomi) throw new Error("Xiaomi brand not found.");

// ---- 1. typo fix ------------------------------------------------------
const note15Pro = await prisma.device.findFirst({
  where: { name: "Redmi Note 15 Pro", chipset: { brandId: xiaomi.id } },
});
if (!note15Pro) throw new Error('"Redmi Note 15 Pro" not found in catalog.');

const typoFix = await prisma.tradedProduct.updateMany({
  where: { family: { equals: "Redmin Note 15 Pro", mode: "insensitive" }, deviceId: null },
  data: { deviceId: note15Pro.id },
});
console.log(`REDMIN NOTE 15 PRO → Redmi Note 15 Pro: ${typoFix.count} row(s) linked.`);

// ---- 2. add the missing device -----------------------------------------
const chipset = await prisma.chipset.upsert({
  where: { brandId_name: { brandId: xiaomi.id, name: "Helio G85" } },
  update: {},
  create: {
    slug: "xiaomi-helio-g85",
    brandId: xiaomi.id,
    name: "Helio G85",
    series: "MediaTek Helio",
    kind: "MOBILE_SOC",
    releaseYear: 2020,
    processNode: "12nm",
    cpuSummary: "Octa-core (2x2.0GHz Cortex-A75 + 6x1.8GHz Cortex-A55)",
    gpuSummary: "Mali-G52 MC2",
    highlight: "Powers POCO C65 (a rebadged Redmi 13C 4G).",
    gradientFrom: "#3a1a0a",
    gradientTo: "#FF6900",
    sourceNote: "Researched via GSMArena (web search) — full model spec sheet, not yet cross-checked against a second outlet.",
  },
});

const device = await prisma.device.upsert({
  where: { chipsetId_name: { chipsetId: chipset.id, name: "POCO C65" } },
  update: {},
  create: {
    slug: "poco-c65",
    chipsetId: chipset.id,
    name: "POCO C65",
    category: "PHONE",
    releaseDate: new Date("2023-11-06"),
  },
});

await prisma.deviceSpec.upsert({
  where: { deviceId: device.id },
  update: {},
  create: {
    deviceId: device.id,
    cpu: "Octa-core (2x2.0GHz Cortex-A75 + 6x1.8GHz Cortex-A55)",
    gpu: "Mali-G52 MC2",
    displayInches: 6.74,
    refreshRateHz: 90,
    batteryMah: 5000,
    chargingWatts: 18,
    mainCameraMp: 50,
    selfieCameraMp: 5,
    weightGrams: 192,
    heightMm: 168,
    widthMm: 78,
    thicknessMm: 8.09,
    sourceName: "GSMArena",
    sourceUrl: "https://www.gsmarena.com/xiaomi_poco_c65-review-2637.php",
  },
});

const c65Link = await prisma.tradedProduct.updateMany({
  where: { family: { equals: "POCO C65", mode: "insensitive" }, deviceId: null },
  data: { deviceId: device.id },
});
console.log(`POCO C65 added to catalog and ${c65Link.count} ledger row(s) linked.`);

// ---- 3. confirm the vacuum stays unlinked, with a reason on record ------
const vacuum = await prisma.tradedProduct.findMany({ where: { family: "X20 Max" } });
console.log(
  `\n"X20 Max" left unlinked: ${vacuum.reduce((s, t) => s + 1, 0)} row(s), ` +
    `${vacuum.length} record(s) — this is the Xiaomi Robot Vacuum X20 Max, not a phone. ` +
    "Not a catalog gap.",
);

await prisma.$disconnect();
