import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TAGS = {
  "apple-a19-pro": "GPU ray tracing",
  "xiaomi-snapdragon-8-elite-gen-5": "Raw multi-core + NPU",
  "apple-m5": "On-device AI (GPU-accelerated)",
  "xiaomi-xring-o1": "Efficiency (first-gen custom silicon)",
  "xiaomi-dimensity-9400": "Sustained / thermal",
  "xiaomi-dimensity-8400": "Mid-range all-big-core efficiency",
  "apple-a18-pro": "GPU ray tracing (prior-gen)",
  "apple-a18": "On-device AI (entry tier)",
  "apple-m4": "NPU throughput (TOPS)",
  "apple-m4-pro-m4-max": "Memory bandwidth",
  "apple-a19": "Flagship-parity value",
  "xiaomi-snapdragon-8-elite": "Custom-core CPU (first-gen Oryon)",
};

let n = 0;
for (const [slug, tag] of Object.entries(TAGS)) {
  const chipset = await prisma.chipset.findUnique({ where: { slug } });
  if (!chipset) {
    console.log(`  skip "${slug}" — not found`);
    continue;
  }
  await prisma.chipset.update({ where: { slug }, data: { strengthTag: tag } });
  n++;
  console.log(`  done: ${slug}`);
}

console.log(`\nstrengthTag set on ${n} chipsets`);
