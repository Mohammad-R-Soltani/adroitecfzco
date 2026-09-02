import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";
import { getChipsetGeekbenchRollup } from "@/lib/chipsetRealPerf";
import ChipsetBrowser from "@/components/ChipsetBrowser";
import MarketTrendChart, { type TrendPoint } from "@/components/chipsets/MarketTrendChart";
import DomainMatrix, { type MatrixChipset } from "@/components/chipsets/DomainMatrix";

export default async function ChipsetsPage() {
  const user = await getCurrentUser();

  const [chipsets, bookmarks, rollup, domainRaw] = await Promise.all([
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
    prisma.chipset.findMany({
      where: { domains: { some: {} } },
      select: {
        slug: true,
        name: true,
        releaseYear: true,
        brand: { select: { name: true } },
        domains: {
          select: { domain: true, level: true, evidence: true, sourceName: true, sourceUrl: true },
        },
      },
      orderBy: [{ releaseYear: "desc" }, { name: "asc" }],
    }),
  ]);

  const domainChipsets: MatrixChipset[] = domainRaw.map((c) => ({
    slug: c.slug,
    name: c.name,
    brandName: c.brand.name,
    releaseYear: c.releaseYear,
    cells: c.domains.map((d) => ({
      domain: d.domain,
      level: d.level,
      evidence: d.evidence,
      sourceName: d.sourceName,
      sourceUrl: d.sourceUrl,
    })),
  }));

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

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
            What each chip is actually good at
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
            Every filled cell is a claim a named outlet published about that chip in that
            workload — tap one to read it and follow the source. A blank cell means nothing
            credible was published, not that the chip is weak there.
          </p>
          <div className="mt-5">
            <DomainMatrix chipsets={domainChipsets} />
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
