import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Re-derive refreshRateHz from the already-imported displayType text, this
// time skipping PWM dimming-frequency figures (e.g. "2160Hz PWM") which are
// not the screen's actual refresh rate.
function realRefreshRate(displayType) {
  if (!displayType) return null;
  const re = /(\d{2,3})\s*Hz(?!\s*PWM)/gi;
  let m;
  while ((m = re.exec(displayType))) {
    const val = parseInt(m[1], 10);
    if (val <= 180) return val;
  }
  return null;
}

const specs = await prisma.deviceSpec.findMany({
  include: { device: { select: { name: true } } },
});

for (const s of specs) {
  const fixed = realRefreshRate(s.displayType);
  if (fixed !== s.refreshRateHz) {
    console.log(`${s.device.name}: ${s.refreshRateHz} -> ${fixed}`);
    await prisma.deviceSpec.update({ where: { id: s.id }, data: { refreshRateHz: fixed } });
  }
}

await prisma.$disconnect();
