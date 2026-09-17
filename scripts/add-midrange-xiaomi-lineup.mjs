import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Adds the mid-range Redmi/POCO lineup that showed up in the company's own
 * sales ledger but was missing from the catalog — every one of these is a
 * real traded product, researched individually via GSMArena (through web
 * search, since GSMArena's own scraper is currently rate-limited). No
 * competitiveEdge or strengthTag is set here: that requires the deeper
 * comparative research done for the flagship chipsets, not yet done for
 * these, so the UI shows "not documented yet" honestly rather than a guess.
 *
 * Chipsets are grouped so the same physical chip used by several phones
 * (e.g. Helio G81 Ultra across five different budget models) becomes one
 * row, not five.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const xiaomi = await prisma.brand.findUnique({ where: { slug: "xiaomi" } });
if (!xiaomi) throw new Error("Xiaomi brand not found.");

const GRADIENT = ["#3a1a0a", "#FF6900"];
const SOURCE = "Researched via GSMArena (web search) — full model spec sheet, not yet cross-checked against a second outlet.";

const CHIPSETS = [
  {
    name: "Unisoc T7250", series: "Unisoc", releaseYear: 2025, processNode: "12nm",
    cpuSummary: "Octa-core (2x1.8GHz Cortex-A75 + 6x1.6GHz Cortex-A55)", gpuSummary: "Mali-G57 MP1",
    devices: [
      { name: "Redmi A5", releaseDate: "2025-03-21", displayInches: 6.88, refreshRateHz: 120, batteryMah: 5200, mainCameraMp: 32, weightGrams: 193, thicknessMm: 8.3 },
      { name: "POCO C71", releaseDate: "2025-04-08", displayInches: 6.88, refreshRateHz: 120, batteryMah: 5200, mainCameraMp: 32, weightGrams: 193, thicknessMm: 8.3, heightMm: 171.8, widthMm: 77.8 },
      { name: "POCO C81 Pro", releaseDate: "2026-04-01", displayInches: 6.9, refreshRateHz: 120, batteryMah: 6000, chargingWatts: 15, mainCameraMp: 13 },
      { name: "Redmi A7 Pro", releaseDate: "2025-01-01", displayInches: 6.9, refreshRateHz: 120, batteryMah: 6300, chargingWatts: 15, mainCameraMp: 13 },
    ],
  },
  {
    name: "Dimensity 7025 Ultra", series: "MediaTek Dimensity", releaseYear: 2024, processNode: "6nm",
    cpuSummary: "Octa-core (2x2.5GHz Cortex-A78 + 6x2.0GHz Cortex-A55)", gpuSummary: "Mali-G57",
    devices: [
      { name: "Redmi Note 14", releaseDate: "2024-09-01", displayInches: 6.67, refreshRateHz: 120, batteryMah: 5000, chargingWatts: 45, mainCameraMp: 108, weightGrams: 190, heightMm: 162.4, widthMm: 75.7, thicknessMm: 8.0 },
      { name: "POCO M7 Pro", releaseDate: "2024-12-20", displayInches: 6.67, refreshRateHz: 120, batteryMah: 5110, chargingWatts: 45, weightGrams: 190, thicknessMm: 8 },
    ],
  },
  {
    name: "Helio G100", series: "MediaTek Helio", releaseYear: 2025, processNode: "12nm",
    cpuSummary: "Octa-core, all-big-core class (similar to Helio G99)", gpuSummary: "Mali-G57 MC2",
    devices: [
      { name: "Redmi Note 14 Pro 4G", releaseDate: "2025-01-01", displayInches: 6.67, batteryMah: 5500 },
    ],
  },
  {
    name: "Helio G81 Ultra", series: "MediaTek Helio", releaseYear: 2024, processNode: "12nm",
    cpuSummary: "Octa-core (2x2.0GHz Cortex-A75 + 6x1.8GHz Cortex-A55)", gpuSummary: "Mali-G52 MC2",
    devices: [
      { name: "POCO C75", releaseDate: "2024-11-05", displayInches: 6.88, refreshRateHz: 120, batteryMah: 5160, chargingWatts: 18, mainCameraMp: 50, weightGrams: 204, heightMm: 171.88, widthMm: 77.8, thicknessMm: 8.22 },
      { name: "POCO C85", releaseDate: "2025-09-01", displayInches: 6.9, refreshRateHz: 120, batteryMah: 6000, chargingWatts: 33, mainCameraMp: 50 },
      { name: "Redmi 15C", releaseDate: "2025-01-01", displayInches: 6.9, refreshRateHz: 120, batteryMah: 6000, chargingWatts: 33, mainCameraMp: 50, weightGrams: 205, thicknessMm: 8.2 },
      { name: "Redmi A3 Pro", releaseDate: "2024-10-01", displayInches: 6.88, refreshRateHz: 90, batteryMah: 5160, chargingWatts: 10, mainCameraMp: 50 },
      { name: "Redmi 14C", releaseDate: "2024-08-30", displayInches: 6.88, refreshRateHz: 120, batteryMah: 5160, mainCameraMp: 50 },
    ],
  },
  {
    name: "Helio G99 Ultra", series: "MediaTek Helio", releaseYear: 2024, processNode: "12nm",
    cpuSummary: "Octa-core (2x2.2GHz Cortex-A76 + 6x2.0GHz Cortex-A55)", gpuSummary: "Mali-G57 MC2",
    devices: [
      { name: "Redmi Note 14S", releaseDate: "2025-03-01", displayInches: 6.67, batteryMah: 5000, chargingWatts: 67, mainCameraMp: 200 },
      { name: "Redmi Note 13 Pro", releaseDate: "2024-01-01", displayInches: 6.67, batteryMah: 5000 },
      { name: "POCO M6 Pro", releaseDate: "2024-01-01", displayInches: 6.67, refreshRateHz: 120, batteryMah: 5000, weightGrams: 179, heightMm: 161.1, widthMm: 75.0, thicknessMm: 8.0 },
    ],
  },
  {
    name: "Helio G91 Ultra", series: "MediaTek Helio", releaseYear: 2024, processNode: "12nm",
    cpuSummary: "Octa-core (2x2.0GHz Cortex-A75 + 6x1.8GHz Cortex-A55)", gpuSummary: "Mali-G52 MC2",
    devices: [
      { name: "Redmi 13", releaseDate: "2024-06-03", displayInches: 6.79, refreshRateHz: 90, weightGrams: 205, heightMm: 168.6, widthMm: 76.3, thicknessMm: 8.3 },
      { name: "Redmi 13X", releaseDate: "2025-03-28", displayInches: 6.79, refreshRateHz: 90, batteryMah: 5030, chargingWatts: 33, mainCameraMp: 108 },
      { name: "POCO M6", releaseDate: "2024-06-03", displayInches: 6.79, batteryMah: 5030 },
    ],
  },
  { name: "Dimensity 6080", series: "MediaTek Dimensity", releaseYear: 2024, processNode: "6nm",
    cpuSummary: "Octa-core", gpuSummary: "Mali-G57",
    devices: [{ name: "Redmi Note 13", releaseDate: "2024-01-01", displayInches: 6.67, batteryMah: 5000 }] },
  { name: "Snapdragon 6s Gen 3", series: "Snapdragon", releaseYear: 2025, processNode: "6nm",
    cpuSummary: "Octa-core (2x2.3GHz Cortex-A78 + 6x2.0GHz Cortex-A55)", gpuSummary: "Adreno 619",
    devices: [{ name: "Redmi 15", releaseDate: "2025-08-01", displayInches: 6.9, refreshRateHz: 144, batteryMah: 7000, chargingWatts: 33, mainCameraMp: 50, weightGrams: 217, heightMm: 169.5, widthMm: 80.5, thicknessMm: 8.4 }] },
  { name: "Helio G95", series: "MediaTek Helio", releaseYear: 2022, processNode: "12nm",
    cpuSummary: "Octa-core (2x2.05GHz Cortex-A76 + 6x2.0GHz Cortex-A55)", gpuSummary: "Mali-G76 MC4",
    devices: [{ name: "POCO M5s", releaseDate: "2022-01-01", displayInches: 6.43, batteryMah: 5000, chargingWatts: 33, mainCameraMp: 64, weightGrams: 179, heightMm: 160.5, widthMm: 74.5, thicknessMm: 8.3 }] },
  { name: "Snapdragon 6 Gen 3", series: "Snapdragon", releaseYear: 2025, processNode: null,
    cpuSummary: "Octa-core", gpuSummary: "Adreno",
    devices: [{ name: "Redmi Note 15", releaseDate: "2025-12-01", displayInches: 6.77, batteryMah: 5520 }] },
  { name: "Helio G36", series: "MediaTek Helio", releaseYear: 2024, processNode: "12nm",
    cpuSummary: "Octa-core", gpuSummary: "PowerVR GE8320",
    devices: [{ name: "Redmi A3", releaseDate: "2024-02-14", displayInches: 6.71, refreshRateHz: 90, batteryMah: 5000, chargingWatts: 10, mainCameraMp: 8 }] },
  { name: "Unisoc T603", series: "Unisoc", releaseYear: 2024, processNode: null,
    cpuSummary: "Octa-core", gpuSummary: "IMG GE8320",
    devices: [{ name: "Redmi A3x", releaseDate: "2024-01-01", displayInches: 6.71, refreshRateHz: 90, batteryMah: 5000, chargingWatts: 10, mainCameraMp: 8, heightMm: 168.4, widthMm: 76.3, thicknessMm: 8.3 }] },
  { name: "Dimensity 7300 Ultra", series: "MediaTek Dimensity", releaseYear: 2024, processNode: "4nm",
    cpuSummary: "Octa-core (4x2.5GHz Cortex-A78 + 4x2.0GHz Cortex-A55)", gpuSummary: "Mali-G615 MC2",
    devices: [{ name: "POCO X7", releaseDate: "2024-01-01", displayInches: 6.67, batteryMah: 5110, mainCameraMp: 50 }] },
  { name: "Dimensity 8300 Ultra", series: "MediaTek Dimensity", releaseYear: 2024, processNode: "4nm",
    cpuSummary: "Octa-core, up to 3.35GHz", gpuSummary: "Mali-G615",
    devices: [
      { name: "POCO X6 Pro", releaseDate: "2024-01-12", displayInches: 6.67, refreshRateHz: 120, batteryMah: 5000, mainCameraMp: 64 },
      { name: "Xiaomi 14T", releaseDate: "2024-09-26", displayInches: 6.67, batteryMah: 5000, chargingWatts: 67, mainCameraMp: 50 },
    ] },
  { name: "Helio G100 Ultra", series: "MediaTek Helio", releaseYear: 2025, processNode: "6nm",
    cpuSummary: "Octa-core (2x2.2GHz Cortex-A76 + 6x2.0GHz Cortex-A55)", gpuSummary: "Mali-G57MC2",
    devices: [{ name: "Redmi Pad 2", releaseDate: "2025-01-01", category: "TABLET", displayInches: 11, refreshRateHz: 90, batteryMah: 9000 }] },
  { name: "Snapdragon 4 Gen 2", series: "Snapdragon", releaseYear: 2025, processNode: null,
    cpuSummary: "Octa-core", gpuSummary: "Adreno",
    devices: [{ name: "POCO M7", releaseDate: "2025-03-07", displayInches: 6.88, refreshRateHz: 120, batteryMah: 5160, chargingWatts: 18, mainCameraMp: 50, weightGrams: 205, heightMm: 171.9, widthMm: 77.8, thicknessMm: 8.2 }] },
  { name: "Dimensity 9500s", series: "MediaTek Dimensity", releaseYear: 2025, processNode: "3nm",
    cpuSummary: "Octa-core (1x3.73GHz Cortex-X925 + 3x3.3GHz Cortex-X4 + 4x2.4GHz Cortex-A720)", gpuSummary: "Immortalis-G925 MC12",
    devices: [{ name: "POCO X8 Pro Max", releaseDate: "2025-01-01", displayInches: 6.83, refreshRateHz: 120, batteryMah: 8500, chargingWatts: 100, mainCameraMp: 50, weightGrams: 218, heightMm: 162.9, widthMm: 77.9, thicknessMm: 8.2 }] },
  { name: "Dimensity 7400 Ultra", series: "MediaTek Dimensity", releaseYear: 2025, processNode: "4nm",
    cpuSummary: "Octa-core (4x2.6GHz Cortex-A78 + 4x2.0GHz Cortex-A55)", gpuSummary: "Mali-G615 MC2",
    devices: [
      { name: "Redmi Note 15 Pro", releaseDate: "2025-01-01", displayInches: 6.83, batteryMah: 6580, chargingWatts: 45 },
      { name: "Redmi Note 15 Pro Plus 5G", releaseDate: "2025-01-01", displayInches: 6.83, refreshRateHz: 120, batteryMah: 6580, weightGrams: 210, heightMm: 163.6, widthMm: 78.1, thicknessMm: 8.0 },
    ] },
  { name: "Dimensity 8500 Ultra", series: "MediaTek Dimensity", releaseYear: 2026, processNode: "4nm",
    cpuSummary: "Octa-core", gpuSummary: "Mali-G720 MC8",
    devices: [{ name: "POCO X8 Pro", releaseDate: "2026-01-01", displayInches: 6.59, refreshRateHz: 120, batteryMah: 6500, chargingWatts: 100, mainCameraMp: 50, weightGrams: 204, heightMm: 157.5, widthMm: 75.2, thicknessMm: 8.2 }] },
  { name: "Snapdragon 7s Gen 3", series: "Snapdragon", releaseYear: 2025, processNode: "4nm",
    cpuSummary: "Octa-core (1x2.5GHz + 3x2.4GHz Cortex-A720 + 4x1.8GHz Cortex-A520)", gpuSummary: "Adreno 710",
    devices: [{ name: "Redmi Note 14 Pro+ 5G", releaseDate: "2025-01-01", displayInches: 6.67, refreshRateHz: 120, batteryMah: 6200, chargingWatts: 90, weightGrams: 205, heightMm: 162.5, widthMm: 74.7, thicknessMm: 8.8 }] },
  { name: "Snapdragon 8 Gen 2", series: "Snapdragon", releaseYear: 2024, processNode: "4nm",
    cpuSummary: "Octa-core (1x3.2GHz Cortex-X3 + 2x2.8GHz Cortex-A715 + 2x2.8GHz Cortex-A710 + 3x2.0GHz Cortex-A510)", gpuSummary: "Adreno 740",
    devices: [{ name: "POCO F6 Pro", releaseDate: "2024-05-01", displayInches: 6.67, refreshRateHz: 120, batteryMah: 5000, chargingWatts: 120, weightGrams: 209, heightMm: 160.9, widthMm: 75.0, thicknessMm: 8.2 }] },
  { name: "Snapdragon 7s Gen 2", series: "Snapdragon", releaseYear: 2024, processNode: "4nm",
    cpuSummary: "Octa-core (4x2.4GHz Cortex-A78 + 4x1.95GHz Cortex-A55)", gpuSummary: "Adreno 710",
    devices: [
      { name: "POCO X6", releaseDate: "2024-01-01", displayInches: 6.67, batteryMah: 5100, weightGrams: 181, heightMm: 161.2, widthMm: 74.3, thicknessMm: 8 },
      { name: "Redmi Note 13 Pro 5G", releaseDate: "2024-01-04", displayInches: 6.67, batteryMah: 5100, chargingWatts: 67, mainCameraMp: 200, weightGrams: 187, heightMm: 161.2, widthMm: 74.2, thicknessMm: 8.0 },
    ] },
  { name: "Snapdragon 7+ Gen 3", series: "Snapdragon", releaseYear: 2024, processNode: "4nm",
    cpuSummary: "Octa-core (1x2.8GHz Cortex-X4 + 4x2.6GHz Cortex-A720 + 3x1.9GHz Cortex-A520)", gpuSummary: "Adreno 732",
    devices: [{ name: "Xiaomi Pad 7", releaseDate: "2024-01-01", category: "TABLET", displayInches: 11.2, refreshRateHz: 144, batteryMah: 8850, chargingWatts: 45, weightGrams: 500 }] },
  { name: "Dimensity 9300+", series: "MediaTek Dimensity", releaseYear: 2024, processNode: "4nm",
    cpuSummary: "Octa-core (1x3.4GHz X4 + 3x2.85GHz X4 + 4x2.0GHz A720)", gpuSummary: "Immortalis-G720",
    devices: [{ name: "Xiaomi 14T Pro", releaseDate: "2024-09-26", displayInches: 6.67, refreshRateHz: 144, batteryMah: 5000, chargingWatts: 120, mainCameraMp: 50 }] },
  { name: "Snapdragon 7s Gen 4", series: "Snapdragon", releaseYear: 2025, processNode: null,
    cpuSummary: "Octa-core", gpuSummary: "Adreno",
    devices: [{ name: "POCO M8 Pro 5G", releaseDate: "2025-01-01", displayInches: 6.83, refreshRateHz: 120, batteryMah: 6500, mainCameraMp: 50 }] },
  { name: "Snapdragon 8s Gen 3", series: "Snapdragon", releaseYear: 2024, processNode: "4nm",
    cpuSummary: "Octa-core (1x3.0GHz Cortex-X4 + 4x2.8GHz Cortex-A720 + 3x2.0GHz Cortex-A520)", gpuSummary: "Adreno 735",
    devices: [{ name: "POCO F6", releaseDate: "2024-05-01", displayInches: 6.67, refreshRateHz: 120, batteryMah: 5000, chargingWatts: 90, weightGrams: 179, heightMm: 160.5, widthMm: 74.5, thicknessMm: 8.0 }] },
  { name: "Helio G96", series: "MediaTek Helio", releaseYear: 2023, processNode: "12nm",
    cpuSummary: "Octa-core (2x2.05GHz Cortex-A76 + 6x2.0GHz Cortex-A55)", gpuSummary: "Mali-G57 MC2",
    devices: [{ name: "Redmi Note 12S", releaseDate: "2023-04-26", displayInches: 6.43, refreshRateHz: 90, batteryMah: 5000, chargingWatts: 33, mainCameraMp: 108 }] },
  { name: "Snapdragon 8s Gen 4", series: "Snapdragon", releaseYear: 2025, processNode: null,
    cpuSummary: "Octa-core", gpuSummary: "Adreno",
    devices: [{ name: "POCO F7", releaseDate: "2025-06-01", displayInches: 6.83, batteryMah: 6500 }] },
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
let specCount = 0;

for (const c of CHIPSETS) {
  const chipset = await prisma.chipset.upsert({
    where: { brandId_name: { brandId: xiaomi.id, name: c.name } },
    update: {
      series: c.series, kind: "MOBILE_SOC", releaseYear: c.releaseYear,
      processNode: c.processNode ?? "Not published", cpuSummary: c.cpuSummary, gpuSummary: c.gpuSummary,
    },
    create: {
      slug: `xiaomi-${slugify(c.name)}`, brandId: xiaomi.id, name: c.name, series: c.series,
      kind: "MOBILE_SOC", releaseYear: c.releaseYear, processNode: c.processNode ?? "Not published",
      cpuSummary: c.cpuSummary, gpuSummary: c.gpuSummary,
      highlight: `Powers ${c.devices.map((d) => d.name).join(", ")}.`,
      gradientFrom: GRADIENT[0], gradientTo: GRADIENT[1],
      sourceNote: SOURCE,
    },
  });
  chipsetCount++;

  for (const d of c.devices) {
    const deviceSlug = slugify(d.name);
    const device = await prisma.device.upsert({
      where: { chipsetId_name: { chipsetId: chipset.id, name: d.name } },
      update: { slug: deviceSlug, category: d.category ?? "PHONE", releaseDate: new Date(d.releaseDate) },
      create: {
        slug: deviceSlug, chipsetId: chipset.id, name: d.name,
        category: d.category ?? "PHONE", releaseDate: new Date(d.releaseDate),
      },
    });
    deviceCount++;

    const specFields = {
      cpu: c.cpuSummary, gpu: c.gpuSummary,
      displayInches: d.displayInches ?? null,
      refreshRateHz: d.refreshRateHz ?? null,
      batteryMah: d.batteryMah ?? null,
      chargingWatts: d.chargingWatts ?? null,
      mainCameraMp: d.mainCameraMp ?? null,
      weightGrams: d.weightGrams ?? null,
      heightMm: d.heightMm ?? null,
      widthMm: d.widthMm ?? null,
      thicknessMm: d.thicknessMm ?? null,
      sourceName: "GSMArena",
      sourceUrl: "https://www.gsmarena.com",
    };
    await prisma.deviceSpec.upsert({
      where: { deviceId: device.id },
      update: specFields,
      create: { deviceId: device.id, ...specFields },
    });
    specCount++;
  }
  console.log(`chipset: ${c.name} → ${c.devices.map((d) => d.name).join(", ")}`);
}

console.log(`\n${chipsetCount} chipsets, ${deviceCount} devices, ${specCount} spec sheets upserted.`);

// ---- relink TradedProduct rows to the devices that now exist -------------
const devices = await prisma.device.findMany({
  where: { chipset: { brandId: xiaomi.id } },
  select: { id: true, name: true },
});
const deviceByKey = new Map(
  devices.map((d) => [d.name.toLowerCase().replace(/[^a-z0-9]+/g, ""), d.id]),
);

const traded = await prisma.tradedProduct.findMany({ where: { deviceId: null } });
let linked = 0;
for (const p of traded) {
  const key = p.family.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const deviceId = deviceByKey.get(key);
  if (deviceId) {
    await prisma.tradedProduct.update({ where: { id: p.id }, data: { deviceId } });
    linked++;
  }
}
console.log(`\n${linked} traded products linked to the catalog (of ${traded.length} previously unlinked).`);

await prisma.$disconnect();
