import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { listBrandDevices } from "./gsmarena-list.mjs";
import { importDevice } from "./bulk-import-catalog.mjs";

/**
 * The full bulk crawl (bulk-import-catalog.mjs) walks each brand's GSMArena
 * catalog newest-first, which means it burns its per-device delay on 2026
 * flagships we already have covered before it ever reaches the specific
 * 2023-2025 devices this catalog is actually missing benchmarks for. That
 * run got interrupted by a session teardown after only 5 devices.
 *
 * This script inverts the order of work: list each brand's catalog (cheap —
 * a handful of listing-page fetches, no per-device delay), filter down to
 * just the named devices this catalog is missing, and only pay the 2.5s
 * per-device fetch delay for those matches. A crawl of ~250 Xiaomi phones
 * becomes ~60 targeted fetches.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TARGETS = JSON.parse(readFileSync(process.argv[2] ?? "/tmp/targets.json", "utf8"));

const BRAND_LIST_URL = {
  apple: "https://www.gsmarena.com/apple-phones-48.php",
  samsung: "https://www.gsmarena.com/samsung-phones-9.php",
  xiaomi: "https://www.gsmarena.com/xiaomi-phones-80.php",
};

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "");

// GSMArena's own listing title carries the maker's name ("Xiaomi Poco X7
// Pro"); our catalog strips it except where it is genuinely part of the
// product name — the same rule bulk-import-catalog.mjs applies once a
// device page is actually fetched, needed here just to match names first.
const KEEPS_BRAND = /^(Apple|Samsung|Xiaomi)\s+(Watch|Pad|Buds|Book)\b/i;
function bareName(title) {
  return KEEPS_BRAND.test(title) ? title : title.replace(/^(Apple|Samsung|Xiaomi)\s+/i, "");
}

const ONLY_BRAND = process.env.ONLY_BRAND ?? null;
const brands = ONLY_BRAND ? [ONLY_BRAND] : ["xiaomi", "samsung", "apple"];

let totalMatched = 0;
let totalOk = 0;
const stillMissing = [];

for (const brandSlug of brands) {
  const targetsForBrand = TARGETS.filter((t) => t.brand === brandSlug);
  if (targetsForBrand.length === 0) continue;

  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
  if (!brand) {
    console.log(`! brand ${brandSlug} not found, skipping ${targetsForBrand.length} targets`);
    continue;
  }

  console.log(`\n=== ${brand.name}: listing catalog to find ${targetsForBrand.length} target device(s) ===`);
  const stubs = await listBrandDevices(BRAND_LIST_URL[brandSlug], { minYear: 2022 });
  console.log(`${stubs.length} devices in ${brand.name}'s GSMArena catalog (2022+)`);

  const byKey = new Map(stubs.map((s) => [norm(bareName(s.name)), s]));
  const remaining = new Set(targetsForBrand.map((t) => t.name));

  for (const target of targetsForBrand) {
    const stub = byKey.get(norm(target.name));
    if (!stub) continue;
    remaining.delete(target.name);
    totalMatched++;

    try {
      const res = await importDevice(brand, { ...stub, category: target.category });
      if (res.alreadyDone) {
        console.log(`  = ${target.name} (already imported from this URL)`);
      } else if (res.skipped) {
        console.log(`  ! ${target.name}: ${res.skipped}`);
      } else {
        totalOk++;
        console.log(`  ✓ ${target.name} · ${res.chipset}${res.benchmarks ? ` · ${res.benchmarks} benchmark(s)` : " · no benchmark published"}`);
      }
    } catch (err) {
      console.log(`  ! ${target.name}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }

  for (const name of remaining) stillMissing.push(`${brandSlug}: ${name}`);
}

console.log(`\n${totalMatched} of ${TARGETS.length} targets found on GSMArena, ${totalOk} imported/updated.`);
if (stillMissing.length) {
  console.log(`\n${stillMissing.length} target(s) not found in the GSMArena catalog listing (name mismatch or not GSMArena-covered):`);
  stillMissing.forEach((s) => console.log(`  - ${s}`));
}

await prisma.$disconnect();
