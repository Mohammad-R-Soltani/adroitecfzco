import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Fills in product photos from GSMArena's image CDN.
 *
 * GSMArena's site is rate-limited for us, but its image host is not. Photo
 * URLs are keyed by a slug derived from the product's own name, so a candidate
 * URL is built from the device name and then verified with a HEAD request:
 * a 200 with an image content-type proves that exact photo exists. Nothing is
 * assumed — a slug that does not resolve is simply not used, and the device is
 * left without a picture rather than pointed at someone else's phone.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CDN = "https://fdn2.gsmarena.com/vv/bigpic";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

function baseSlug(name) {
  return name
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/["”″()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * GSMArena's own slugs carry the maker prefix and often a network suffix that
 * the model name does not ("Redmi A5" -> "xiaomi-redmi-a5-4g"), so a small set
 * of shapes is tried per brand and each is verified before use.
 */
function candidateSlugs(name, brandSlug) {
  const base = baseSlug(name);
  const maker = { xiaomi: "xiaomi", apple: "apple", samsung: "samsung" }[brandSlug] ?? brandSlug;

  const shapes = new Set();
  for (const stem of [base.startsWith(maker) ? base : `${maker}-${base}`, base]) {
    shapes.add(stem);
    shapes.add(`${stem}-5g`);
    shapes.add(`${stem}-4g`);
    shapes.add(stem.replace(/-5g$/, ""));
    shapes.add(stem.replace(/-4g$/, ""));
    // Watches and tablets often drop the maker's own word: "samsung-galaxy-watch8"
    shapes.add(stem.replace(new RegExp(`^${maker}-${maker}-`), `${maker}-`));
  }
  return [...shapes].filter(Boolean);
}

async function findPhoto(name, brandSlug) {
  for (const slug of candidateSlugs(name, brandSlug)) {
    const url = `${CDN}/${slug}.jpg`;
    try {
      const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.startsWith("image/")) return { url, slug };
    } catch {
      // network hiccup on one candidate shouldn't abort the rest
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  return null;
}

// GSMArena catalogues phones, tablets and watches. Laptops and earbuds are not
// on it at all, so they are skipped here rather than sent through a round of
// requests that can only 404; Wikimedia is the source for those.
const devices = await prisma.device.findMany({
  where: { imageUrl: null, category: { in: ["PHONE", "TABLET", "WATCH"] } },
  select: { id: true, name: true, chipset: { select: { brand: { select: { slug: true } } } } },
  orderBy: { name: "asc" },
});

console.log(`${devices.length} phones/tablets/watches without a photo\n`);

let found = 0;
const missed = [];

for (const [i, device] of devices.entries()) {
  const hit = await findPhoto(device.name, device.chipset.brand.slug);
  if (hit) {
    await prisma.device.update({
      where: { id: device.id },
      data: {
        imageUrl: hit.url,
        imageAttributionText: `GSMArena — ${hit.slug}`,
        imageAttributionUrl: "https://www.gsmarena.com",
      },
    });
    found++;
    console.log(`  [${i + 1}/${devices.length}] ✓ ${device.name}  →  ${hit.slug}.jpg`);
  } else {
    missed.push(device.name);
    console.log(`  [${i + 1}/${devices.length}] –  ${device.name} (no verified photo)`);
  }
}

console.log(`\n${found} photos added, ${missed.length} still without one.`);
if (missed.length) console.log("Still missing:\n  " + missed.join("\n  "));

await prisma.$disconnect();
