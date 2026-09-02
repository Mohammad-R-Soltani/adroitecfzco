import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DATA = {
  "samsung-snapdragon-8-elite-for-galaxy": {
    competitiveEdge:
      "This is a factory-overclocked, Samsung-exclusive bin of the Snapdragon 8 Elite — peak CPU clock at 4.47GHz and GPU at 1.2GHz versus 4.32GHz/1.1GHz on the standard chip — plus a co-developed image signal processor upgrade (Spatio-Temporal Filter) enabling sharper low-light video up to 8K/30fps that the standard chip doesn't get.",
    competitiveEdgeSourceName: "Android Authority",
    competitiveEdgeSourceUrl: "https://www.androidauthority.com/samsung-galaxy-s25-snapdragon-8-elite-for-galaxy-3517978/",
    strengthTag: "Overclocked exclusive silicon",
    specSummary:
      "Peak CPU 4.47GHz / GPU 1.2GHz vs. 4.32GHz / 1.1GHz on the standard Snapdragon 8 Elite; adds Spatio-Temporal Filter ISP support co-developed with Samsung for 8K/30fps low-light video.",
  },
  "samsung-exynos-w1000": {
    competitiveEdge:
      "Samsung's first 3nm wearable chip claimed a 3.4x single-core and 3.7x multi-core jump over the prior Exynos W920 when it launched with the Watch7 generation — a big enough leap that Samsung carried the exact same W1000 into the Watch8 a year later unchanged, with that generation's real differences coming from display brightness, battery size and software rather than a new chip.",
    competitiveEdgeSourceName: "Notebookcheck",
    competitiveEdgeSourceUrl:
      "https://www.notebookcheck.com/Galaxy-Watch-7-und-Watch-Ultra-Samsung-launcht-3nm-Exynos-W1000-mit-massivem-Performance-und-Effizienz-Boost.856232.0.html",
    strengthTag: "3nm efficiency leap (carried over, not new)",
    specSummary:
      "5-core Exynos W1000 (3nm) — same chip powers both Galaxy Watch7 (2024) and Galaxy Watch8 (2025); claimed 3.4x single-core / 3.7x multi-core gain over the prior Exynos W920.",
  },
};

let edgeCount = 0;
let sourceCount = 0;

for (const [slug, d] of Object.entries(DATA)) {
  const chipset = await prisma.chipset.findUnique({ where: { slug } });
  if (!chipset) {
    console.log(`  skip "${slug}" — not found`);
    continue;
  }

  await prisma.chipset.update({
    where: { slug },
    data: {
      competitiveEdge: d.competitiveEdge,
      competitiveEdgeSourceName: d.competitiveEdgeSourceName,
      competitiveEdgeSourceUrl: d.competitiveEdgeSourceUrl,
      strengthTag: d.strengthTag,
    },
  });
  edgeCount++;

  await prisma.chipsetSpecSource.upsert({
    where: { chipsetId_sourceUrl: { chipsetId: chipset.id, sourceUrl: d.competitiveEdgeSourceUrl } },
    update: { sourceName: d.competitiveEdgeSourceName, summary: d.specSummary },
    create: {
      chipsetId: chipset.id,
      sourceName: d.competitiveEdgeSourceName,
      sourceUrl: d.competitiveEdgeSourceUrl,
      summary: d.specSummary,
    },
  });
  sourceCount++;

  console.log(`  done: ${slug}`);
}

console.log(`\ncompetitiveEdge/strengthTag set on ${edgeCount} chipsets, specSource added on ${sourceCount}.`);
