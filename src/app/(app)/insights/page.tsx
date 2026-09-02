import { prisma } from "@/lib/prisma";
import { PRODUCT_LINES } from "@/lib/productLines";
import ValueMapChart, { type ValuePoint } from "@/components/insights/ValueMapChart";
import GenerationalUpliftChart, {
  type UpliftLine,
} from "@/components/insights/GenerationalUpliftChart";
import BackButton from "@/components/BackButton";

export default async function InsightsPage() {
  const devices = await prisma.device.findMany({
    select: {
      slug: true,
      name: true,
      releaseDate: true,
      spec: { select: { priceEur: true } },
      benchmarks: {
        where: { family: "GEEKBENCH_6", metric: "MULTI_CORE" },
        orderBy: { value: "desc" },
        take: 1,
        select: { value: true },
      },
      chipset: { select: { brand: { select: { slug: true, name: true } } } },
    },
  });

  const scoreBySlug = new Map<string, { name: string; score: number }>();
  for (const d of devices) {
    const score = d.benchmarks[0]?.value;
    if (score != null) scoreBySlug.set(d.slug, { name: d.name, score });
  }

  // Value map — only devices with BOTH a published EUR price and a verified
  // Geekbench 6 multi-core score; anything missing either is simply absent
  // rather than estimated.
  const valuePoints: ValuePoint[] = devices
    .filter((d) => d.spec?.priceEur != null && d.benchmarks[0] != null)
    .map((d) => ({
      slug: d.slug,
      name: d.name,
      brandSlug: d.chipset.brand.slug,
      brandName: d.chipset.brand.name,
      priceEur: d.spec!.priceEur!,
      score: d.benchmarks[0]!.value,
      releaseYear: d.releaseDate.getFullYear(),
    }))
    .sort((a, b) => a.priceEur - b.priceEur);

  // Generational uplift — successive devices in a hand-declared product line,
  // compared only where both generations have a Geekbench 6 multi-core score.
  const upliftLines: UpliftLine[] = PRODUCT_LINES.map((line) => {
    const steps = [];
    for (let i = 1; i < line.deviceSlugs.length; i++) {
      const from = scoreBySlug.get(line.deviceSlugs[i - 1]);
      const to = scoreBySlug.get(line.deviceSlugs[i]);
      if (!from || !to) continue;
      steps.push({
        fromName: from.name,
        toName: to.name,
        fromScore: from.score,
        toScore: to.score,
        percent: ((to.score - from.score) / from.score) * 100,
      });
    }
    return { id: line.id, label: line.label, brandSlug: line.brandSlug, steps };
  }).filter((line) => line.steps.length > 0);

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <BackButton fallbackHref="/" />
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Insights</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--ink-soft)]">
          The two questions trade buyers actually ask — &ldquo;what am I getting for the
          money?&rdquo; and &ldquo;is the new one really better?&rdquo; — answered from the
          catalog&apos;s own sourced numbers, never estimates.
        </p>

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
            Value map — price vs. performance
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
            Every device that has both a published launch price and a verified Geekbench 6
            multi-core score. Devices further up and to the left give more performance per euro.
            Prices are launch RRP as listed by GSMArena, not today&apos;s trade price — use them
            for positioning, not quoting.
          </p>
          <div className="mt-5">
            <ValueMapChart points={valuePoints} />
          </div>
        </section>

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
            Generation over generation
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
            How much real multi-core performance each new generation actually added, within the
            same product line. Only Geekbench 6 scores are compared against each other — older
            Geekbench 5 results are never mixed in.
          </p>
          <div className="mt-5">
            <GenerationalUpliftChart lines={upliftLines} />
          </div>
        </section>
      </div>
    </main>
  );
}
