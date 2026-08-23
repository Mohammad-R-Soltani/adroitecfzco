import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildDeviceAbout } from "@/lib/deviceCopy";
import { getChipsetGeekbenchRollup } from "@/lib/chipsetRealPerf";
import ChipsetPerformanceChart from "@/components/ChipsetPerformanceChart";

const CATEGORY_LABELS: Record<string, string> = {
  PHONE: "Phone",
  TABLET: "Tablet",
  LAPTOP: "Laptop",
  WATCH: "Watch",
};

export default async function DevicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [device, allChipsets, rollup] = await Promise.all([
    prisma.device.findUnique({
      where: { slug },
      include: {
        chipset: {
          include: {
            brand: true,
            devices: { orderBy: { releaseDate: "desc" } },
          },
        },
        benchmarks: {
          where: { family: "GEEKBENCH_6", metric: "MULTI_CORE" },
          orderBy: { value: "desc" },
          take: 1,
        },
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

  if (!device) notFound();

  const { chipset } = device;
  const siblingDevices = chipset.devices.filter((d) => d.id !== device.id);
  const about = buildDeviceAbout(device.name, chipset);

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
        <div className="mb-6 flex items-center gap-2 text-xs text-[var(--ink-faint)]">
          <Link href={`/catalog?brand=${chipset.brand.slug}`} className="hover:text-[var(--signal)]">
            {chipset.brand.name}
          </Link>
          <span>/</span>
          <span>{CATEGORY_LABELS[device.category] ?? device.category}</span>
        </div>

        <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-sm">
          {device.imageUrl ? (
            <Image
              src={device.imageUrl}
              alt={device.name}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(155deg, ${chipset.gradientFrom}, ${chipset.gradientTo})` }}
            />
          )}
        </div>

        {device.imageAttributionText && (
          <p className="mb-8 -mt-4 text-xs text-[var(--ink-faint)]">
            {device.imageAttributionUrl ? (
              <a
                href={device.imageAttributionUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--ink-soft)]"
              >
                {device.imageAttributionText}
              </a>
            ) : (
              device.imageAttributionText
            )}
          </p>
        )}

        <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl">{device.name}</h1>
        <p className="spec-value mt-2 text-sm text-[var(--ink-faint)]">
          Released {device.releaseDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-6 space-y-3">
          {about.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-[var(--ink-soft)]">
              {paragraph}
            </p>
          ))}
        </div>

        <Link
          href={`/chipsets/${chipset.slug}`}
          className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm transition hover:border-[var(--signal)]/40 hover:shadow-md"
        >
          <div>
            <p className="text-xs font-medium text-[var(--ink-faint)]">Powered by</p>
            <p className="font-display text-lg font-semibold text-[var(--ink)]">{chipset.name}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">See full spec sheet &amp; power comparison</p>
          </div>
          <span className="text-[var(--signal)]">&rarr;</span>
        </Link>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {specs.map((spec) => (
            <div key={spec.label} className="rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{spec.label}</p>
              <p className="spec-value mt-0.5 text-sm font-medium text-[var(--ink)]">{spec.value}</p>
            </div>
          ))}
        </div>

        {device.benchmarks[0] && (
          <a
            href={device.benchmarks[0].sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-6 flex items-baseline gap-2 rounded-2xl border border-[var(--line)] bg-[var(--signal)]/[0.04] p-4 hover:border-[var(--signal)]/30"
          >
            <span className="spec-value text-2xl font-bold text-[var(--signal)]">
              {device.benchmarks[0].value.toLocaleString()}
            </span>
            <span className="text-[11px] font-medium text-[var(--ink-faint)]">
              Geekbench 6 multi-core, verified · {device.benchmarks[0].sourceName}
            </span>
          </a>
        )}

        <div className="mt-8">
          <ChipsetPerformanceChart
            chipsets={allChipsets}
            rollup={Object.fromEntries(rollup)}
            highlightSlug={chipset.slug}
            title={`How ${chipset.name} ranks`}
          />
        </div>

        {siblingDevices.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--ink-faint)]">
              Other devices with {chipset.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblingDevices.map((d) => (
                <Link
                  key={d.id}
                  href={`/devices/${d.slug}`}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
                >
                  {d.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
