import { prisma } from "@/lib/prisma";
import ChipsetCompareView, { type CompareChipset } from "@/components/chipsetCompare/ChipsetCompareView";
import type { PickerChipset } from "@/components/chipsetCompare/ChipsetPicker";
import BackButton from "@/components/BackButton";

export default async function ChipsetComparePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const requestedSlugs = (c ?? "").split(",").filter(Boolean).slice(0, 3);

  const [pickerChipsets, selectedRaw] = await Promise.all([
    prisma.chipset.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        series: true,
        releaseYear: true,
        gradientFrom: true,
        gradientTo: true,
        brand: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    requestedSlugs.length
      ? prisma.chipset.findMany({
          where: { slug: { in: requestedSlugs } },
          include: {
            brand: { select: { name: true, accent: true } },
            specSources: { orderBy: { fetchedAt: "desc" } },
            devices: {
              select: {
                name: true,
                benchmarks: {
                  where: { family: "GEEKBENCH_6", metric: "MULTI_CORE" },
                  orderBy: { value: "desc" },
                  take: 1,
                  select: { value: true, sourceName: true, sourceUrl: true },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const pickerList: PickerChipset[] = pickerChipsets.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    series: c.series,
    releaseYear: c.releaseYear,
    gradientFrom: c.gradientFrom,
    gradientTo: c.gradientTo,
    brandName: c.brand.name,
  }));

  const bySlug = new Map(selectedRaw.map((c) => [c.slug, c]));
  const selected: CompareChipset[] = requestedSlugs
    .map((slug) => bySlug.get(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((chipset) => {
      let best: CompareChipset["bestBenchmark"] = null;
      for (const device of chipset.devices) {
        const b = device.benchmarks[0];
        if (b && (!best || b.value > best.value)) {
          best = { value: b.value, deviceName: device.name, sourceName: b.sourceName, sourceUrl: b.sourceUrl };
        }
      }
      return {
        id: chipset.id,
        slug: chipset.slug,
        name: chipset.name,
        series: chipset.series,
        releaseYear: chipset.releaseYear,
        gradientFrom: chipset.gradientFrom,
        gradientTo: chipset.gradientTo,
        brandName: chipset.brand.name,
        brandAccent: chipset.brand.accent,
        kind: chipset.kind,
        processNode: chipset.processNode,
        cpuSummary: chipset.cpuSummary,
        gpuSummary: chipset.gpuSummary,
        npuSummary: chipset.npuSummary,
        maxRam: chipset.maxRam,
        highlight: chipset.highlight,
        competitiveEdge: chipset.competitiveEdge,
        competitiveEdgeSourceName: chipset.competitiveEdgeSourceName,
        competitiveEdgeSourceUrl: chipset.competitiveEdgeSourceUrl,
        strengthTag: chipset.strengthTag,
        bestBenchmark: best,
        specSources: chipset.specSources.map((s) => ({
          sourceName: s.sourceName,
          sourceUrl: s.sourceUrl,
          summary: s.summary,
        })),
      };
    });

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <BackButton fallbackHref="/chipsets" />
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Compare chipsets</h1>
        <p className="mt-1.5 max-w-xl text-sm text-[var(--ink-soft)]">
          Put the silicon itself head to head — verified benchmark scores, the full technical
          sheet, and the sourced case for why each one leads.
        </p>

        <div className="mt-6">
          <ChipsetCompareView allChipsets={pickerList} selected={selected} />
        </div>
      </div>
    </main>
  );
}
