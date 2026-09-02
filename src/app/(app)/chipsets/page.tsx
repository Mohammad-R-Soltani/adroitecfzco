import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";
import { getChipsetGeekbenchRollup } from "@/lib/chipsetRealPerf";
import ChipsetBrowser from "@/components/ChipsetBrowser";
import MarketTrendChart, { type TrendPoint } from "@/components/chipsets/MarketTrendChart";

export default async function ChipsetsPage() {
  const user = await getCurrentUser();

  const [chipsets, bookmarks, rollup] = await Promise.all([
    prisma.chipset.findMany({
      include: {
        brand: { select: { name: true, accent: true } },
        devices: {
          select: { id: true, slug: true, name: true, imageUrl: true, releaseDate: true },
        },
      },
      orderBy: [{ releaseYear: "desc" }, { brand: { name: "asc" } }],
    }),
    user
      ? prisma.bookmark.findMany({ where: { userId: user.id }, select: { chipsetId: true } })
      : Promise.resolve([]),
    getChipsetGeekbenchRollup(),
  ]);

  const trendMap = new Map<string, TrendPoint>();
  for (const chipset of chipsets) {
    for (const device of chipset.devices) {
      const year = device.releaseDate.getFullYear();
      const key = `${year}:${chipset.series}`;
      const existing = trendMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        trendMap.set(key, { year, series: chipset.series, count: 1 });
      }
    }
  }
  const trendPoints = Array.from(trendMap.values()).sort((a, b) => a.year - b.year);

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Chipsets</h1>
            <p className="mt-1.5 max-w-xl text-sm text-[var(--ink-soft)]">
              A dedicated look at the silicon itself — which chips are shipping, how fast each
              maker is releasing new devices on them, and what sets each one apart, always
              traceable to a named source.
            </p>
          </div>
          <Link
            href="/chipsets/compare"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--signal)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--signal-deep)]"
          >
            Compare chipsets
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">Where the market is moving</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Devices released per year, broken down by chipset series — which specific chip
            lines are gaining ground, counted directly from every device in the catalog, not
            an estimate.
          </p>
          <div className="mt-5">
            <MarketTrendChart points={trendPoints} />
          </div>
        </section>

        <div className="mt-10">
          <ChipsetBrowser
            chipsets={chipsets}
            bookmarkedIds={bookmarks.map((b) => b.chipsetId)}
            rollup={Object.fromEntries(rollup)}
          />
        </div>
      </div>
    </main>
  );
}
