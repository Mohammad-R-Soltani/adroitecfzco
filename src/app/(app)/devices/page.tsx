import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BrandSlug, DeviceCategory } from "@prisma/client";
import DeviceCard from "@/components/DeviceCard";
import RequirementMatcher, { type MatcherDevice } from "@/components/devices/RequirementMatcher";

const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  PHONE: "Phones",
  TABLET: "Tablets",
  LAPTOP: "Laptops",
  WATCH: "Watches",
  EARBUDS: "Earbuds",
};

const CATEGORY_ORDER: DeviceCategory[] = ["PHONE", "TABLET", "LAPTOP", "WATCH", "EARBUDS"];

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const params = await searchParams;
  const activeBrand: BrandSlug =
    params.brand === "xiaomi" ? "xiaomi" : params.brand === "samsung" ? "samsung" : "apple";

  const [brands, devices, allDevices] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.device.findMany({
      where: { chipset: { brand: { slug: activeBrand } } },
      orderBy: { releaseDate: "desc" },
      include: {
        chipset: { select: { name: true, slug: true, gradientFrom: true, gradientTo: true } },
      },
    }),
    // The matcher searches the whole catalog, not just the brand tab in view —
    // a buyer's requirements rarely come with a brand attached.
    prisma.device.findMany({
      select: {
        slug: true,
        name: true,
        category: true,
        chipset: { select: { name: true, brand: { select: { name: true, accent: true } } } },
        spec: {
          select: {
            batteryMah: true,
            chargingWatts: true,
            displayInches: true,
            refreshRateHz: true,
            mainCameraMp: true,
            priceEur: true,
          },
        },
        benchmarks: {
          where: { family: "GEEKBENCH_6", metric: "MULTI_CORE" },
          orderBy: { value: "desc" },
          take: 1,
          select: { value: true },
        },
      },
    }),
  ]);

  const matcherDevices: MatcherDevice[] = allDevices.map((d) => ({
    slug: d.slug,
    name: d.name,
    category: d.category,
    brandName: d.chipset.brand.name,
    brandAccent: d.chipset.brand.accent,
    chipsetName: d.chipset.name,
    batteryMah: d.spec?.batteryMah ?? null,
    chargingWatts: d.spec?.chargingWatts ?? null,
    displayInches: d.spec?.displayInches ?? null,
    refreshRateHz: d.spec?.refreshRateHz ?? null,
    mainCameraMp: d.spec?.mainCameraMp ?? null,
    priceEur: d.spec?.priceEur ?? null,
    score: d.benchmarks[0]?.value ?? null,
  }));

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    devices: devices.filter((d) => d.category === category),
  })).filter((g) => g.devices.length > 0);

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display mb-6 text-2xl font-semibold text-[var(--ink)]">Devices</h1>

        <div className="mb-8">
          <RequirementMatcher devices={matcherDevices} />
        </div>

        <div className="mb-8 flex gap-2">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/devices?brand=${brand.slug}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                activeBrand === brand.slug
                  ? "border-[var(--signal)] bg-[var(--signal)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
              }`}
            >
              {brand.name}
            </Link>
          ))}
        </div>

        {grouped.length === 0 && (
          <p className="text-[var(--ink-faint)]">No devices yet for this brand.</p>
        )}

        <div className="space-y-10">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--ink-faint)]">
                {CATEGORY_LABELS[group.category]} ({group.devices.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {group.devices.map((device) => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
