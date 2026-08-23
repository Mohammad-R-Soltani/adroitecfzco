import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// "163.4 x 78 x 8.8 mm (6.43 x 3.07 x 0.35 in)" -> {h, w, t}
function parseDimensions(text) {
  if (!text) return null;
  // Some entries list per-finish thicknesses: "152.3 x 71.2 x 8.1 / 8.4 / 8.5 mm".
  // Take the first thickness — the base model — rather than failing the row.
  const m = text.match(/([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)/i);
  if (!m) return null;
  return {
    heightMm: parseFloat(m[1]),
    widthMm: parseFloat(m[2]),
    thicknessMm: parseFloat(m[3]),
  };
}

const specs = await prisma.deviceSpec.findMany({
  include: { device: { select: { name: true } } },
});

let updated = 0;
for (const s of specs) {
  const dims = parseDimensions(s.dimensions);
  if (!dims) {
    console.log(`— ${s.device.name}: no parsable dimensions (${s.dimensions ?? "null"})`);
    continue;
  }
  await prisma.deviceSpec.update({ where: { id: s.id }, data: dims });
  console.log(`✓ ${s.device.name}: ${dims.heightMm} x ${dims.widthMm} x ${dims.thicknessMm} mm`);
  updated++;
}

console.log(`\n${updated}/${specs.length} devices given physical dimensions.`);
await prisma.$disconnect();
