import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Two zero-unit-sold rows sat in the ledger for POCO F8 Pro and F8 Ultra 5G —
 * new stock the company holds but has not yet moved. Both are real, shipping
 * devices (announced Nov 2025) on chipsets already fully researched in the
 * catalog (Snapdragon 8 Elite / 8 Elite Gen 5), so adding them costs nothing
 * beyond the device row itself.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEVICES = [
  {
    name: "POCO F8 Pro",
    chipsetName: "Snapdragon 8 Elite",
    releaseDate: "2025-11-01",
    spec: {
      displayInches: 6.59, refreshRateHz: 120, batteryMah: 6210, mainCameraMp: 50,
      sourceName: "GSMArena", sourceUrl: "https://www.gsmarena.com/xiaomi_poco_f8_pro_5g-14303.php",
    },
  },
  {
    name: "POCO F8 Ultra 5G",
    chipsetName: "Snapdragon 8 Elite Gen 5",
    releaseDate: "2025-11-01",
    spec: {
      displayInches: 6.90, refreshRateHz: 120, batteryMah: 6500, mainCameraMp: 50,
      sourceName: "GSMArena", sourceUrl: "https://m.gsmarena.com/xiaomi_poco_f8_ultra_5g-14301.php",
    },
  },
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const xiaomi = await prisma.brand.findUnique({ where: { slug: "xiaomi" } });
if (!xiaomi) throw new Error("Xiaomi brand not found.");

for (const d of DEVICES) {
  const chipset = await prisma.chipset.findFirst({ where: { name: d.chipsetName, brandId: xiaomi.id } });
  if (!chipset) throw new Error(`Chipset "${d.chipsetName}" not found — expected it to already exist.`);

  const device = await prisma.device.upsert({
    where: { chipsetId_name: { chipsetId: chipset.id, name: d.name } },
    update: {},
    create: {
      slug: slugify(d.name), chipsetId: chipset.id, name: d.name,
      category: "PHONE", releaseDate: new Date(d.releaseDate),
    },
  });

  await prisma.deviceSpec.upsert({
    where: { deviceId: device.id },
    update: {},
    create: { deviceId: device.id, cpu: chipset.cpuSummary, gpu: chipset.gpuSummary, ...d.spec },
  });

  const linked = await prisma.tradedProduct.updateMany({
    where: { family: { equals: d.name, mode: "insensitive" }, deviceId: null },
    data: { deviceId: device.id },
  });
  console.log(`${d.name} → ${d.chipsetName} (${linked.count} ledger row(s) linked)`);
}

await prisma.$disconnect();
