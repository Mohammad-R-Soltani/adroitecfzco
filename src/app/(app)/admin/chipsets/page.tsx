import { prisma } from "@/lib/prisma";
import CreateChipsetForm from "./CreateChipsetForm";
import AddDeviceForm from "./AddDeviceForm";

export default async function AdminChipsetsPage() {
  const chipsets = await prisma.chipset.findMany({
    include: {
      brand: { select: { name: true } },
      devices: { orderBy: { releaseDate: "desc" } },
    },
    orderBy: [{ releaseYear: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <CreateChipsetForm />

      <div className="space-y-4">
        {chipsets.map((chipset) => (
          <div key={chipset.id} className="surface-card rounded-2xl border border-[var(--line)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--ink-faint)]">
                  {chipset.brand.name} · {chipset.releaseYear}
                </p>
                <p className="font-display text-lg font-semibold text-[var(--ink)]">{chipset.name}</p>
              </div>
              <span className="text-xs text-[var(--ink-faint)]">{chipset.devices.length} device(s)</span>
            </div>

            {chipset.devices.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {chipset.devices.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-full border border-[var(--line)] bg-[var(--mist)] px-2.5 py-1 text-xs text-[var(--ink-soft)]"
                  >
                    {d.name}
                  </li>
                ))}
              </ul>
            )}

            <AddDeviceForm chipsetId={chipset.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
