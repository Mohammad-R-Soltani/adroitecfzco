import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const a19pro = await prisma.chipset.findFirst({
  where: { name: "A19 Pro" },
});

if (!a19pro) {
  console.log("No 'A19 Pro' chipset found in this database yet — nothing to fix, seed will create it fresh.");
  process.exit(0);
}

const device = await prisma.device.findUnique({
  where: { slug: "iphone-air" },
});

if (!device) {
  console.log("No existing 'iphone-air' device row — nothing to fix, seed will create it fresh.");
  process.exit(0);
}

if (device.chipsetId === a19pro.id) {
  console.log("iPhone Air already points at A19 Pro — nothing to do.");
  process.exit(0);
}

await prisma.device.update({
  where: { id: device.id },
  data: { chipsetId: a19pro.id },
});

console.log(`Moved iPhone Air (device ${device.id}) to A19 Pro chipset (${a19pro.id}).`);
