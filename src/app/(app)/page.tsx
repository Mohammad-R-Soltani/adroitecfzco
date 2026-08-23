import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";
import { getIndustryUpdates } from "@/lib/rss";
import { getChipsetGeekbenchRollup } from "@/lib/chipsetRealPerf";
import NewsRail from "@/components/NewsRail";
import FeaturedChipsRail from "@/components/FeaturedChipsRail";
import ChipsetBrowser from "@/components/ChipsetBrowser";
import PowerRankSidebar from "@/components/PowerRankSidebar";

export default async function FeedPage() {
  const user = await getCurrentUser();

  const [chipsets, featuredRaw, bookmarks, updates, deviceCount, rollup] = await Promise.all([
    prisma.chipset.findMany({
      include: {
        brand: { select: { name: true, accent: true } },
        devices: {
          select: { id: true, slug: true, name: true, imageUrl: true },
        },
      },
      orderBy: [{ releaseYear: "desc" }, { brand: { name: "asc" } }],
    }),
    prisma.chipset.findMany({
      where: { featured: true },
      select: {
        id: true,
        slug: true,
        name: true,
        series: true,
        releaseYear: true,
        highlight: true,
        gradientFrom: true,
        gradientTo: true,
        brand: { select: { name: true, accent: true } },
        devices: { select: { name: true, imageUrl: true }, orderBy: { releaseDate: "desc" } },
      },
      orderBy: [{ releaseYear: "desc" }],
    }),
    user
      ? prisma.bookmark.findMany({
          where: { userId: user.id },
          select: { chipsetId: true },
        })
      : Promise.resolve([]),
    getIndustryUpdates(),
    prisma.device.count(),
    getChipsetGeekbenchRollup(),
  ]);

  // Dates can't cross the server/client boundary in these props, so send ISO strings.
  const newsItems = updates.map((item) => ({ ...item, pubDate: item.pubDate.toISOString() }));

  const featured = featuredRaw.map((c) => {
    const heroDevice = c.devices.find((d) => d.imageUrl) ?? null;
    const real = rollup.get(c.id);
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      series: c.series,
      releaseYear: c.releaseYear,
      highlight: c.highlight,
      gradientFrom: c.gradientFrom,
      gradientTo: c.gradientTo,
      brand: c.brand,
      heroImage: heroDevice?.imageUrl ?? null,
      heroDeviceName: heroDevice?.name ?? null,
      realBenchmark: real ? { value: real.value, sourceName: real.sourceName } : null,
    };
  });

  return (
    <main className="min-h-dvh pt-14">
      <NewsRail items={newsItems} />
      <FeaturedChipsRail chipsets={featured} />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0">
            <ChipsetBrowser
              chipsets={chipsets}
              bookmarkedIds={bookmarks.map((b) => b.chipsetId)}
              rollup={Object.fromEntries(rollup)}
            />
          </div>

          <div className="hidden lg:block">
            <PowerRankSidebar chipsets={chipsets} deviceCount={deviceCount} rollup={Object.fromEntries(rollup)} />
          </div>
        </div>
      </div>
    </main>
  );
}
