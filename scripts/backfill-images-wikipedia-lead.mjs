import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Fills in product photos from the lead image of the product's own Wikipedia
 * article.
 *
 * Commons' free-text search ranks by filename and happily returns a sibling
 * model; a Wikipedia article, by contrast, is *about* one product, and its lead
 * image is that product. So the risk moves from "is this the right photo?" to
 * "is this the right article?" — which is checkable. The resolved title (after
 * redirects) must normalise to the device's own name, optionally with the brand
 * word in front. Anything else is skipped: "Xiaomi 13 Pro" quietly redirecting
 * to the "Xiaomi 13" article must not hand back a photo of the wrong phone.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UA = "adroitecfzco-catalog/1.0 (internal product reference; contact via repo)";
const API = "https://en.wikipedia.org/w/api.php";

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")       // "(M3)", "(2025)" — disambiguators, not identity
    // "+" is part of the model, not punctuation. Stripping it made "Galaxy
    // S24+" equal to "Galaxy S24" and accepted the base model's photo.
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "");

/** The article title a device would live under, plus the brand-prefixed form. */
function titleCandidates(name, brand) {
  const brandWord = { xiaomi: "Xiaomi", apple: "Apple", samsung: "Samsung" }[brand] ?? brand;
  const bare = name.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const set = new Set([bare, `${brandWord} ${bare}`]);
  // Apple and Samsung articles keep the maker's own product word; Xiaomi's
  // sub-brands stand alone ("Redmi Note 14 Pro", not "Xiaomi Redmi Note 14 Pro").
  if (/^(Galaxy|Watch|Pad)/.test(bare)) set.add(`${brandWord} ${bare}`);
  return [...set];
}

async function api(params) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${API}?${new URLSearchParams(params)}`, { headers: { "User-Agent": UA } });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`wikipedia ${res.status}`);
    return res.json();
  }
  throw new Error("wikipedia 429");
}

async function findLeadImage(name, brand) {
  for (const title of titleCandidates(name, brand)) {
    const data = await api({
      action: "query",
      titles: title,
      redirects: "1",
      prop: "pageimages",
      piprop: "original",
      format: "json",
      origin: "*",
    });

    const page = Object.values(data?.query?.pages ?? {})[0];
    if (!page || page.missing !== undefined || !page.original?.source) continue;

    // The article must actually be this device, not one it redirects to.
    const resolved = norm(page.title);
    const wanted = norm(name);
    const brandWord = norm(brand);
    if (resolved !== wanted && resolved !== brandWord + wanted) continue;

    return {
      imageUrl: page.original.source,
      imageWidth: page.original.width ?? null,
      imageHeight: page.original.height ?? null,
      imageAttributionText: `Wikipedia — ${page.title}`,
      imageAttributionUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      imageLicense: null,
    };
  }
  return null;
}

const devices = await prisma.device.findMany({
  where: { imageUrl: null },
  select: { id: true, name: true, chipset: { select: { brand: { select: { slug: true } } } } },
  orderBy: { name: "asc" },
});

console.log(`${devices.length} devices without a photo\n`);

let found = 0;
const missed = [];

for (const [i, device] of devices.entries()) {
  try {
    const image = await findLeadImage(device.name, device.chipset.brand.slug);
    if (image) {
      await prisma.device.update({ where: { id: device.id }, data: image });
      found++;
      console.log(`  [${i + 1}/${devices.length}] ✓ ${device.name} → ${image.imageAttributionText}`);
    } else {
      missed.push(device.name);
      console.log(`  [${i + 1}/${devices.length}] – ${device.name} (no article of its own)`);
    }
  } catch (err) {
    missed.push(`${device.name}: ${err.message}`);
    console.log(`  [${i + 1}/${devices.length}] ! ${device.name}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 800));
}

console.log(`\n${found} photos added, ${missed.length} still without one.`);
if (missed.length) console.log("Still missing:\n  " + missed.join("\n  "));

await prisma.$disconnect();
