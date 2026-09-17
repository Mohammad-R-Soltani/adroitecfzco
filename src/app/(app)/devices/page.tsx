import { prisma } from "@/lib/prisma";
import RequirementMatcher, { type MatcherDevice } from "@/components/devices/RequirementMatcher";

export default async function DevicesPage() {
  // Brand, category, chipset and every slider all live inside the matcher
  // now — it owns the one device grid on this page, so there is exactly one
  // filtered view instead of a filter panel next to an unrelated static list.
  const devices = await prisma.device.findMany({
    orderBy: { releaseDate: "desc" },
    include: {
      chipset: {
        select: {
          name: true,
          slug: true,
          gradientFrom: true,
          gradientTo: true,
          brand: { select: { slug: true, name: true, accent: true } },
        },
      },
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
  });

  const matcherDevices: MatcherDevice[] = devices.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    imageUrl: d.imageUrl,
    category: d.category,
    brandSlug: d.chipset.brand.slug,
    brandName: d.chipset.brand.name,
    brandAccent: d.chipset.brand.accent,
    chipsetSlug: d.chipset.slug,
    chipsetName: d.chipset.name,
    chipsetGradientFrom: d.chipset.gradientFrom,
    chipsetGradientTo: d.chipset.gradientTo,
    batteryMah: d.spec?.batteryMah ?? null,
    chargingWatts: d.spec?.chargingWatts ?? null,
    displayInches: d.spec?.displayInches ?? null,
    refreshRateHz: d.spec?.refreshRateHz ?? null,
    mainCameraMp: d.spec?.mainCameraMp ?? null,
    priceEur: d.spec?.priceEur ?? null,
    score: d.benchmarks[0]?.value ?? null,
  }));

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display mb-6 text-2xl font-semibold text-[var(--ink)]">Devices</h1>
        <RequirementMatcher devices={matcherDevices} />
      </div>
    </main>
  );
}
