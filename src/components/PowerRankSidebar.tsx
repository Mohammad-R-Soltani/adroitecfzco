import Link from "next/link";

export type RankChipset = {
  id: string;
  slug: string;
  name: string;
  releaseYear: number;
  geekbenchMultiCore: number | null;
  brand: { name: string; accent: string };
};

export default function PowerRankSidebar({
  chipsets,
  deviceCount,
}: {
  chipsets: RankChipset[];
  deviceCount: number;
}) {
  const ranked = chipsets
    .filter((c) => c.geekbenchMultiCore != null)
    .sort((a, b) => (b.geekbenchMultiCore ?? 0) - (a.geekbenchMultiCore ?? 0));

  const max = ranked[0]?.geekbenchMultiCore ?? 1;
  const appleCount = chipsets.filter((c) => c.brand.name === "Apple").length;
  const xiaomiCount = chipsets.filter((c) => c.brand.name === "Xiaomi").length;

  return (
    <aside className="sticky top-[4.75rem] flex flex-col gap-4">
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/80 shadow-sm backdrop-blur-md">
        <header className="border-b border-[var(--line)] px-4 py-3">
          <span className="trace-rule mb-2 block h-[3px] w-[42px] rounded-full" />
          <h2 className="font-display text-sm font-bold text-[var(--ink)]">Power ranking</h2>
          <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">Multi-core, approximate</p>
        </header>

        <ol className="divide-y divide-[var(--line)]">
          {ranked.slice(0, 8).map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/chipsets/${c.slug}`}
                className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-[var(--mist)]"
              >
                <span className="spec-value w-4 shrink-0 text-[11px] font-bold text-[var(--ink-faint)]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-[var(--ink)] group-hover:text-[var(--signal)]">
                    {c.name}
                  </p>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--mist)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(8, Math.round(((c.geekbenchMultiCore ?? 0) / max) * 100))}%`,
                        background: c.brand.accent,
                      }}
                    />
                  </div>
                </div>
                <span className="spec-value shrink-0 text-[11px] font-semibold text-[var(--ink-soft)]">
                  {(c.geekbenchMultiCore ?? 0).toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <Link
          href="/compare"
          className="block border-t border-[var(--line)] px-4 py-2.5 text-center text-xs font-semibold text-[var(--signal)] transition hover:bg-[var(--signal)]/5"
        >
          See the full comparison &rarr;
        </Link>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/80 p-4 shadow-sm backdrop-blur-md">
        <h2 className="font-display mb-3 text-sm font-bold text-[var(--ink)]">In the catalog</h2>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[var(--mist)] px-2 py-2.5">
            <dd className="spec-value text-lg font-bold text-[var(--ink)]">{chipsets.length}</dd>
            <dt className="text-[10px] font-medium text-[var(--ink-faint)]">Chipsets</dt>
          </div>
          <div className="rounded-xl bg-[var(--mist)] px-2 py-2.5">
            <dd className="spec-value text-lg font-bold text-[var(--ink)]">{deviceCount}</dd>
            <dt className="text-[10px] font-medium text-[var(--ink-faint)]">Devices</dt>
          </div>
          <div className="rounded-xl bg-[var(--mist)] px-2 py-2.5">
            <dd className="spec-value text-lg font-bold text-[var(--ink)]">2</dd>
            <dt className="text-[10px] font-medium text-[var(--ink-faint)]">Brands</dt>
          </div>
        </dl>

        <div className="mt-3 flex h-2 overflow-hidden rounded-full">
          <div
            className="h-full"
            style={{
              width: `${(appleCount / chipsets.length) * 100}%`,
              background: "var(--signal)",
            }}
          />
          <div
            className="h-full flex-1"
            style={{ background: "var(--ember)" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10.5px] font-medium">
          <span className="flex items-center gap-1.5 text-[var(--ink-soft)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            Apple {appleCount}
          </span>
          <span className="flex items-center gap-1.5 text-[var(--ink-soft)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ember)]" />
            Xiaomi {xiaomiCount}
          </span>
        </div>
      </section>
    </aside>
  );
}
