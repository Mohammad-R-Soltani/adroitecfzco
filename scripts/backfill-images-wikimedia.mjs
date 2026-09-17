import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UA = "adroitecfzco-catalog/1.0 (internal product reference; contact via repo)";

/**
 * Finds a Wikimedia Commons photo for a device.
 *
 * Commons search is fuzzy and will happily return a different phone from the
 * same family, so every candidate must contain each of the device's
 * distinguishing tokens in its own filename. A wrong photo is worse than no
 * photo here — the catalog is used to show buyers what they are quoting — so
 * anything that fails the check is left empty instead.
 */
function requiredTokens(name) {
  return name
    .toLowerCase()
    // "+" is part of the model name; without this "S24+" tokenises to a term
    // no filename can contain, and the device can never match anything.
    .replace(/\+/g, " plus")
    .replace(/[()"]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    // Drop words that carry no identifying power on their own.
    .filter((t) => !["apple", "samsung", "xiaomi", "galaxy", "the", "with"].includes(t));
}

// Commons is full of charts, logos, box shots and screenshots filed under the
// same product name. None of those are the product, so they are rejected
// outright however well the name matches.
const NOT_A_PRODUCT_PHOTO =
  /(chart|diagram|graph|logo|wordmark|icon|screenshot|comparison|对比|价格|数据|infographic|timeline|map|advertisement|billboard|store|queue|line up|packaging|box art)/i;

// Commons carries a great many photos *taken with* a phone, filed under that
// phone's full name. They match every token perfectly and show a landscape.
const SHOT_ON_THE_DEVICE = /\b(sho[tp]|take[nr]?|captured|photographed|clicked)\s+(on|with|by|using)\b/i;

// Words that distinguish one model from another in the same family. If the
// candidate has one the device does not, it is a different product — "Xiaomi
// 13" must not accept a photo of the "Xiaomi 13 Ultra".
const MODEL_QUALIFIERS = ["ultra", "pro", "max", "plus", "lite", "mini", "fe", "air"];

function titleMatches(title, tokens, deviceName) {
  if (NOT_A_PRODUCT_PHOTO.test(title) || SHOT_ON_THE_DEVICE.test(title)) return false;
  const haystack = title.toLowerCase().replace(/[_\-()]/g, " ");
  const candidateWords = new Set(haystack.split(/[^a-z0-9]+/).filter(Boolean));

  // Whole words only. A substring test lets the "4" of "Redmi Turbo 4" be
  // satisfied by the "2024" in a date stamp, which is how a photo of the
  // Turbo 3 came back as a match for the Turbo 4.
  if (!tokens.every((t) => candidateWords.has(t))) return false;

  const deviceWords = new Set(deviceName.toLowerCase().split(/[^a-z0-9]+/));
  for (const q of MODEL_QUALIFIERS) {
    if (candidateWords.has(q) && !deviceWords.has(q)) return false;
  }
  return true;
}

async function findCommonsImage(deviceName) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${deviceName} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1200",
    format: "json",
    origin: "*",
  });

  // Commons throttles hard mid-run; back off and retry rather than losing the
  // device to a transient 429.
  let res;
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": UA },
    });
    if (res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
  }
  if (!res.ok) throw new Error(`commons ${res.status}`);

  const pages = Object.values((await res.json())?.query?.pages ?? {});
  const tokens = requiredTokens(deviceName);

  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info?.thumburl) continue;
    const title = String(page.title ?? "").replace(/^File:/, "");
    if (!titleMatches(title, tokens, deviceName)) continue;

    const meta = info.extmetadata ?? {};
    return {
      imageUrl: info.thumburl,
      imageWidth: info.thumbwidth ?? null,
      imageHeight: info.thumbheight ?? null,
      imageAttributionText: title,
      imageAttributionUrl: info.descriptionurl ?? null,
      imageLicense: meta.LicenseShortName?.value ?? null,
    };
  }
  return null;
}

const devices = await prisma.device.findMany({
  where: { imageUrl: null },
  select: { id: true, name: true, slug: true },
  orderBy: { name: "asc" },
});

console.log(`${devices.length} devices without an image\n`);

let found = 0;
const missed = [];

for (const [i, device] of devices.entries()) {
  try {
    const image = await findCommonsImage(device.name);
    if (image) {
      await prisma.device.update({ where: { id: device.id }, data: image });
      found++;
      console.log(`  [${i + 1}/${devices.length}] ✓ ${device.name} → ${image.imageAttributionText}`);
    } else {
      missed.push(device.name);
      console.log(`  [${i + 1}/${devices.length}] – ${device.name} (no confident match)`);
    }
  } catch (err) {
    missed.push(`${device.name}: ${err.message}`);
    console.log(`  [${i + 1}/${devices.length}] ! ${device.name}: ${err.message}`);
  }
  // Commons starts returning 429 well before its documented limits when a run
  // is this long, so the pacing is deliberately conservative.
  await new Promise((r) => setTimeout(r, 1500));
}

console.log(`\n${found} images added, ${missed.length} still without one.`);
if (missed.length) console.log("Still missing:\n  " + missed.join("\n  "));
