import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CompareView, { type CompareDevice } from "@/components/compare/CompareView";
import type { PickerDevice } from "@/components/compare/DevicePicker";
import BackButton from "@/components/BackButton";

function specToRecord(spec: Record<string, unknown> | null): Record<string, string | number | null> {
  if (!spec) return {};
  const out: Record<string, string | number | null> = {};
  for (const [key, value] of Object.entries(spec)) {
    if (["id", "deviceId", "sourceName", "sourceUrl", "updatedAt"].includes(key)) continue;
    if (typeof value === "string" || typeof value === "number" || value === null) {
      out[key] = value;
    }
  }
  return out;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const requestedSlugs = (d ?? "").split(",").filter(Boolean).slice(0, 3);

  const [pickerDevices, selectedRaw, chipsetRanking] = await Promise.all([
    prisma.device.findMany({
      where: { spec: { isNot: null } },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        imageUrl: true,
        chipset: { select: { name: true, brand: { select: { name: true, accent: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    requestedSlugs.length
      ? prisma.device.findMany({
          where: { slug: { in: requestedSlugs } },
          include: {
            spec: true,
            benchmarks: { orderBy: { value: "desc" } },
            chipset: { select: { slug: true, name: true, brand: { select: { name: true, accent: true } } } },
          },
        })
      : Promise.resolve([]),
    prisma.chipset.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        releaseYear: true,
        brand: { select: { name: true, accent: true } },
        devices: {
          select: {
            benchmarks: {
              where: { family: "GEEKBENCH_6", metric: "MULTI_CORE" },
              orderBy: { value: "desc" },
              take: 1,
              select: { value: true, sourceName: true, sourceUrl: true },
            },
          },
        },
      },
    }),
  ]);

  const pickerList: PickerDevice[] = pickerDevices.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    imageUrl: d.imageUrl,
    category: d.category,
    chipsetName: d.chipset.name,
    brandName: d.chipset.brand.name,
    brandAccent: d.chipset.brand.accent,
  }));

  // Preserve the order the user picked them in (URL order), not DB order.
  const bySlug = new Map(selectedRaw.map((d) => [d.slug, d]));
  const selected: CompareDevice[] = requestedSlugs
    .map((slug) => bySlug.get(slug))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      imageUrl: d.imageUrl,
      category: d.category,
      chipsetName: d.chipset.name,
      chipsetSlug: d.chipset.slug,
      brandName: d.chipset.brand.name,
      brandAccent: d.chipset.brand.accent,
      releaseDate: d.releaseDate.toISOString(),
      spec: specToRecord(d.spec as unknown as Record<string, unknown> | null),
      benchmarks: d.benchmarks.map((b) => ({
        family: b.family,
        metric: b.metric,
        value: b.value,
        testedVariant: b.testedVariant,
        sourceName: b.sourceName,
        sourceUrl: b.sourceUrl,
        sourceDate: b.sourceDate,
        notes: b.notes,
      })),
    }));

  const ranked = chipsetRanking
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      releaseYear: c.releaseYear,
      brandName: c.brand.name,
      brandAccent: c.brand.accent,
      best: c.devices.map((d) => d.benchmarks[0]).find(Boolean) ?? null,
    }))
    .sort((a, b) => (b.best?.value ?? -1) - (a.best?.value ?? -1));

  const rankedTested = ranked.filter((c) => c.best);
  const rankedUntested = ranked.filter((c) => !c.best);
  const maxScore = rankedTested[0]?.best?.value ?? 1;

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <BackButton fallbackHref="/" />
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Compare devices</h1>
        <p className="mt-1.5 max-w-xl text-sm text-[var(--ink-soft)]">
          Pick two or three devices for a real, source-backed spec-and-benchmark battle —
          screen, battery, cameras, chipset and every lab number, each traceable to where it
          came from.
        </p>

        <div className="mt-6">
          <CompareView allDevices={pickerList} selected={selected} />
        </div>

        <section className="mt-12 border-t border-[var(--line)] pt-8">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">Chipset tier list</h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-soft)]">
            Ranked by the best verified Geekbench 6 multi-core result among that chipset&apos;s
            devices in the catalog — not an estimate. A chipset with no tested device yet is
            listed as not benchmarked rather than guessed at.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {rankedTested.map((c, i) => (
              <Link
                key={c.slug}
                href={`/chipsets/${c.slug}`}
                className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-3 shadow-sm transition hover:border-[var(--signal)]/40"
              >
                <span className="spec-value w-5 shrink-0 text-center text-[11px] font-bold text-[var(--ink-faint)]">
                  {i + 1}
                </span>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.brandAccent }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">{c.name}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--mist)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(6, Math.round(((c.best?.value ?? 0) / maxScore) * 100))}%`, background: c.brandAccent }}
                    />
                  </div>
                </div>
                <span className="spec-value shrink-0 text-[12px] font-semibold text-[var(--ink-soft)]">
                  {c.best?.value.toLocaleString()}
                </span>
              </Link>
            ))}
          </div>

          {rankedUntested.length > 0 && (
            <p className="mt-4 text-[11.5px] text-[var(--ink-faint)]">
              <span className="font-semibold text-[var(--ink-soft)]">Not yet benchmarked: </span>
              {rankedUntested.map((c) => c.name).join(", ")}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
