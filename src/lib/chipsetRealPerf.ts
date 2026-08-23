import "server-only";
import { prisma } from "@/lib/prisma";

export type ChipsetRealBenchmark = {
  value: number;
  deviceName: string;
  sourceName: string;
  sourceUrl: string;
};

/**
 * The best *verified* Geekbench 6 multi-core result among a chipset's
 * devices — never an estimate. A chipset with no tested device is simply
 * absent from the map; callers must render "not yet benchmarked" rather
 * than a fabricated number.
 */
export async function getChipsetGeekbenchRollup(): Promise<Map<string, ChipsetRealBenchmark>> {
  const chipsets = await prisma.chipset.findMany({
    select: {
      id: true,
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
  });

  const map = new Map<string, ChipsetRealBenchmark>();
  for (const chipset of chipsets) {
    let best: ChipsetRealBenchmark | null = null;
    for (const device of chipset.devices) {
      const b = device.benchmarks[0];
      if (b && (!best || b.value > best.value)) {
        best = { value: b.value, deviceName: device.name, sourceName: b.sourceName, sourceUrl: b.sourceUrl };
      }
    }
    if (best) map.set(chipset.id, best);
  }
  return map;
}
