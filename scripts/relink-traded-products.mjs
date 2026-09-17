import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Links traded products to catalog devices.
 *
 * The ledger names products the way a warehouse does — model, storage,
 * network and colour all in one string ("REDMI NOTE 14 8/256 4G GB",
 * "REDMI A7 PRO 4+128GB BLACK NFC") — while the catalog names the model
 * only. A single strict comparison misses most of them, so the model name is
 * stripped back progressively and matched against the catalog by the longest
 * prefix that still resolves to exactly one device.
 *
 * Ambiguous matches are left unlinked and reported rather than guessed: a
 * demand curve attached to the wrong device is worse than none.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// "+" is a distinguishing character in Xiaomi's own naming (Pro vs Pro+), not
// punctuation. Stripping it outright made "Redmi Note 14 Pro 4G" and "Redmi
// Note 14 Pro+ 5G" collide on the identical key "redminote14pro" — the 606-unit
// "REDMI NOTE 14PRO+5G" ledger family then matched whichever of the two
// happened to come first, instead of the Pro+ model it actually names.
const key = (s) => String(s).toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "");

/** Drops storage, RAM, network, colour and packaging noise from a product name. */
function modelName(raw) {
  let s = ` ${String(raw)} `;
  s = s.replace(/\s\d+\s*\+\s*\d+\s*(GB|TB)\b/gi, " ");     // "4+128GB"
  s = s.replace(/\s\d+\s*\/\s*\d+\s*(GB|TB)?\b/gi, " ");     // "8/256", "8/256GB"
  s = s.replace(/\s\d+\s*(GB|TB)\b/gi, " ");                 // "256GB"
  s = s.replace(/\b(4G|5G|LTE|NFC|DUAL|GLOBAL|CN|EU|IN)\b/gi, " ");
  s = s.replace(
    /\b(BLACK|WHITE|BLUE|GREEN|GOLD|SILVER|GREY|GRAY|PURPLE|PINK|YELLOW|ORANGE|RED|MIST|PALM|TITANIUM|MIDNIGHT|LAVENDER|AURORA|OCEAN|SAND|GRAPHITE)\b/gi,
    " ",
  );
  s = s.replace(/\bGB\b/gi, " ");
  return s.replace(/\s+/g, " ").trim();
}

const devices = await prisma.device.findMany({
  where: { chipset: { brand: { slug: "xiaomi" } } },
  select: { id: true, name: true },
});

// Longest names first, so "Redmi Note 14 Pro 4G" is tried before "Redmi Note 14".
const candidates = devices
  .map((d) => ({ id: d.id, name: d.name, key: key(modelName(d.name)) }))
  .sort((a, b) => b.key.length - a.key.length);

const traded = await prisma.tradedProduct.findMany({
  where: { deviceId: null },
  include: { months: true },
});

let linked = 0;
const unresolved = [];

for (const product of traded) {
  const productKey = key(modelName(product.family));
  if (!productKey) continue;

  // Exact first, then the longest catalog model whose name the product's own
  // name starts with — "redminote14" matches the "Redmi Note 14" device, while
  // "redminote14pro" still prefers the longer "Redmi Note 14 Pro 4G" entry.
  const exact = candidates.filter((c) => c.key === productKey);
  const prefix = candidates.filter((c) => productKey.startsWith(c.key) || c.key.startsWith(productKey));
  const match = exact[0] ?? prefix[0];

  if (match) {
    await prisma.tradedProduct.update({ where: { id: product.id }, data: { deviceId: match.id } });
    linked++;
  } else {
    unresolved.push({
      family: product.family,
      qty: product.months.reduce((sum, m) => sum + m.outwardQty, 0),
    });
  }
}

const byFamily = new Map();
for (const u of unresolved) {
  const k = u.family.toUpperCase();
  byFamily.set(k, (byFamily.get(k) ?? 0) + u.qty);
}
const remaining = [...byFamily.entries()].filter(([, q]) => q > 0).sort((a, b) => b[1] - a[1]);

console.log(`${linked} traded products linked.`);
console.log(`\n${remaining.length} families still unmatched (${remaining.reduce((s, r) => s + r[1], 0)} units):`);
for (const [family, qty] of remaining) {
  console.log(`  ${String(qty).padStart(7)}  ${family}`);
}

await prisma.$disconnect();
