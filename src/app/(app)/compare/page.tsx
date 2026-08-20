import { prisma } from "@/lib/prisma";
import ChipsetPerformanceChart from "@/components/ChipsetPerformanceChart";

export default async function ComparePage() {
  const chipsets = await prisma.chipset.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      releaseYear: true,
      geekbenchMultiCore: true,
      brand: { select: { name: true, accent: true } },
    },
  });

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Compare chipsets</h1>
        <p className="mt-1.5 max-w-xl text-sm text-[var(--ink-soft)]">
          Every chipset in the catalog, ranked by relative CPU power — so you can place a
          part in its tier before you quote it.
        </p>

        <div className="mt-6">
          <ChipsetPerformanceChart chipsets={chipsets} title="All chipsets — multi-core power" />
        </div>
      </div>
    </main>
  );
}
