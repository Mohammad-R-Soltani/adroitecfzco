import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GSMArena's scraped price strings arrive HTML-entity encoded
// ("&#8364;&thinsp;1,130.09 / &#36;&thinsp;920.88"), which renders literally
// in the UI. Decode them once in the database, then parse a numeric EUR value
// so the value-for-money chart has one consistent currency to plot.
function decodeEntities(text) {
  return text
    .replace(/&#8364;/g, "€")
    .replace(/&#36;/g, "$")
    .replace(/&#163;/g, "£")
    .replace(/&#8377;/g, "₹")
    .replace(/&thinsp;/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEur(text) {
  // "€ 1,130.09 / $ 920.88 …"
  const symbol = text.match(/€\s*([\d,]+(?:\.\d+)?)/);
  if (symbol) return Number(symbol[1].replace(/,/g, ""));

  // "About 1200 EUR"
  const worded = text.match(/([\d,]+(?:\.\d+)?)\s*EUR/i);
  if (worded) return Number(worded[1].replace(/,/g, ""));

  return null;
}

const specs = await prisma.deviceSpec.findMany({
  where: { price: { not: null } },
  select: { id: true, price: true, device: { select: { slug: true } } },
});

let cleaned = 0;
let parsed = 0;

for (const spec of specs) {
  const decoded = decodeEntities(spec.price);
  const eur = parseEur(decoded);

  await prisma.deviceSpec.update({
    where: { id: spec.id },
    data: { price: decoded, priceEur: eur },
  });

  if (decoded !== spec.price) cleaned++;
  if (eur != null) parsed++;

  console.log(`${spec.device.slug.padEnd(24)} ${eur != null ? String(eur).padStart(8) : "    —   "}  ${decoded}`);
}

console.log(`\n${specs.length} price strings processed — ${cleaned} decoded, ${parsed} with a EUR figure.`);
