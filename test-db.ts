import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.brand.count();
  console.log("BRANDS:", count);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });