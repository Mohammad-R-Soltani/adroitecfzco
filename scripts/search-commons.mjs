import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function searchCommons(query) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrsearch", `${query} filetype:bitmap`);
  url.searchParams.set("gsrlimit", "6");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|size|extmetadata|mime");
  url.searchParams.set("iiurlwidth", "1400");
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: { "User-Agent": "adroitecfzco-internal-tool/1.0 (internal sales enablement app; contact: admin@adroitecfzco.local)" },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`non-JSON response (status ${res.status}): ${text.slice(0, 120)}`);
  }
  const pages = data?.query?.pages ?? {};
  return Object.values(pages).map((p) => {
    const info = p.imageinfo?.[0];
    return {
      title: p.title,
      width: info?.width,
      height: info?.height,
      mime: info?.mime,
      url: info?.thumburl || info?.url,
      descriptionUrl: info?.descriptionurl,
      license: info?.extmetadata?.LicenseShortName?.value,
      artist: info?.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, "").trim(),
    };
  });
}

async function main() {
  const onlySlugs = process.argv.slice(2);
  const devices = await prisma.device.findMany({
    include: { chipset: { include: { brand: true } } },
    orderBy: { name: "asc" },
  });

  const filtered = onlySlugs.length
    ? devices.filter((d) => onlySlugs.includes(d.slug))
    : devices;

  for (const d of filtered) {
    const brand = d.chipset.brand.name;
    console.log(`\n=== ${d.name} (${d.slug}) ===`);
    let attempt = 0;
    while (attempt < 3) {
      try {
        const results = await searchCommons(`${brand} ${d.name}`);
        if (results.length === 0) console.log("  (no results)");
        for (const r of results) {
          console.log(
            `  - ${r.title} | ${r.width}x${r.height} | ${r.mime} | ${r.license ?? "?"} | artist: ${r.artist ?? "?"}\n    ${r.url}`
          );
        }
        break;
      } catch (e) {
        attempt++;
        console.log(`  (attempt ${attempt} error: ${e.message})`);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 4000));
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
