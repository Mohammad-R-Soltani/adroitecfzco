import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getChipsetGeekbenchRollup } from "@/lib/chipsetRealPerf";
import ChipsetPerformanceChart from "@/components/ChipsetPerformanceChart";
import BackButton from "@/components/BackButton";

export default async function ChipsetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [chipset, allChipsets, rollup] = await Promise.all([
    prisma.chipset.findUnique({
      where: { slug },
      include: {
        brand: true,
        devices: { orderBy: { releaseDate: "desc" } },
        specSources: { orderBy: { fetchedAt: "desc" } },
      },
    }),
    prisma.chipset.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        releaseYear: true,
        brand: { select: { name: true, accent: true } },
      },
    }),
    getChipsetGeekbenchRollup(),
  ]);

  if (!chipset) notFound();

  const heroDevice = chipset.devices.find((d) => d.imageUrl) ?? null;

  const specs = [
    { label: "Process node", value: chipset.processNode },
    { label: "CPU", value: chipset.cpuSummary },
    { label: "GPU", value: chipset.gpuSummary },
    ...(chipset.npuSummary ? [{ label: "Neural engine", value: chipset.npuSummary }] : []),
    ...(chipset.maxRam ? [{ label: "Memory", value: chipset.maxRam }] : []),
  ];

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <BackButton fallbackHref="/chipsets" />
        <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-3xl border border-[var(--line)] shadow-sm">
          {heroDevice?.imageUrl ? (
            <>
              <Image
                src={heroDevice.imageUrl}
                alt={heroDevice.name}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: `linear-gradient(100deg, rgba(11,18,32,0.75) 25%, ${chipset.gradientFrom}66 55%, transparent 85%)` }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(155deg, ${chipset.gradientFrom}, ${chipset.gradientTo})` }}
            />
          )}
          <div className="relative z-10 flex h-full flex-col justify-end p-6">
            <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: chipset.brand.accent }} />
              {chipset.brand.name} · {chipset.series} · {chipset.releaseYear}
            </span>
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">{chipset.name}</h1>
          </div>
        </div>

        <p className="mb-8 max-w-xl text-base leading-relaxed text-[var(--ink-soft)]">{chipset.highlight}</p>

        {(chipset.competitiveEdge || chipset.strengthTag) && (
          <div className="surface-card mb-8 rounded-2xl border border-[var(--line)] p-4 shadow-sm">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
              Competitive edge
            </p>
            {chipset.strengthTag && (
              <span className="mb-2 inline-block rounded-full bg-[var(--signal)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--signal)]">
                Leads in: {chipset.strengthTag}
              </span>
            )}
            {chipset.competitiveEdge && (
              <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{chipset.competitiveEdge}</p>
            )}
            {chipset.competitiveEdgeSourceUrl && (
              <a
                href={chipset.competitiveEdgeSourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 inline-block text-[11px] font-medium text-[var(--signal)] hover:underline"
              >
                Source: {chipset.competitiveEdgeSourceName ?? "link"}
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {specs.map((spec) => (
            <div key={spec.label} className="rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">{spec.label}</p>
              <p className="spec-value mt-1 text-sm font-medium text-[var(--ink)]">{spec.value}</p>
            </div>
          ))}
        </div>

        {chipset.specSources.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--ink-faint)]">
              What sources say
            </h2>
            <ul className="flex flex-col gap-2.5">
              {chipset.specSources.map((s) => (
                <li key={s.sourceUrl} className="surface-card rounded-2xl border border-[var(--line)] p-3.5 shadow-sm">
                  <p className="text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{s.summary}</p>
                  <a
                    href={s.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-1.5 inline-block text-[11px] font-medium text-[var(--signal)] hover:underline"
                  >
                    {s.sourceName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <ChipsetPerformanceChart
            chipsets={allChipsets}
            rollup={Object.fromEntries(rollup)}
            highlightSlug={chipset.slug}
          />
        </div>

        {chipset.devices.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--ink-faint)]">
              Devices using {chipset.name} ({chipset.devices.length})
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {chipset.devices.map((device) => (
                <Link
                  key={device.id}
                  href={`/devices/${device.slug}`}
                  className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm transition hover:border-[var(--signal)]/40"
                >
                  {device.imageUrl ? (
                    <>
                      <Image
                        src={device.imageUrl}
                        alt={device.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(155deg, ${chipset.gradientFrom}, ${chipset.gradientTo})` }}
                    />
                  )}
                  <p className="relative z-10 p-3 text-sm font-semibold text-white">{device.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="mt-10 text-xs text-[var(--ink-faint)]">{chipset.sourceNote}</p>
      </div>
    </main>
  );
}
