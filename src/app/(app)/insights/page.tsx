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
            How much speed per euro?
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
            Each numbered dot is one device: how much it cost at launch, against how fast it
            tested. Dots higher up are faster; dots further left are cheaper — so the best value
            sits top-left. The list beside the chart ranks them.
          </p>
          <p className="mt-1.5 text-[11.5px] text-[var(--ink-faint)]">
            Launch RRP as listed by GSMArena, not today&apos;s trade price — use for positioning,
            not quoting.
          </p>
          <div className="mt-5">
            <ValueMapChart points={valuePoints} />
          </div>
        </section>

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
            Is the new model really faster?
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
            Each row compares one phone with the model it replaced, using the same benchmark on
            both. The percentage is how much faster the newer one is.
          </p>
          <p className="mt-1.5 text-[11.5px] text-[var(--ink-faint)]">
            Geekbench 6 multi-core, as tested by GSMArena. Geekbench 5 scores are never compared
            against Geekbench 6 ones.
          </p>
          <div className="mt-5">
            <GenerationalUpliftChart lines={upliftLines} />
          </div>
        </section>
      </div>
    </main>
  );
}
