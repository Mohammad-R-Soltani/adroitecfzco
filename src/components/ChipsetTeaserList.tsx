import Link from "next/link";
import ChipsetListCard, { type ListChipset } from "./ChipsetListCard";

type RealBenchmark = { value: number; deviceName: string; sourceName: string; sourceUrl: string };

const TEASER_COUNT = 3;

export default function ChipsetTeaserList({
  chipsets,
  bookmarkedIds,
  rollup,
}: {
  chipsets: ListChipset[];
  bookmarkedIds: string[];
  rollup: Record<string, RealBenchmark>;
}) {
  const bookmarked = new Set(bookmarkedIds);
  const shown = chipsets.slice(0, TEASER_COUNT);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold text-[var(--ink)]">Latest chipsets</h2>
        <Link
          href="/chipsets"
          className="flex items-center gap-1 text-xs font-semibold text-[var(--signal)] hover:opacity-80"
        >
          Market trends, comparisons &amp; full specs
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="flex flex-col gap-5">
        {shown.map((chipset, i) => (
          <ChipsetListCard
            key={chipset.id}
            chipset={chipset}
            index={i}
            isBookmarked={bookmarked.has(chipset.id)}
            realBenchmark={rollup[chipset.id] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
