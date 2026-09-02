import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LEARN_SECTIONS, LEARN_SOURCES } from "@/lib/learnContent";
import BackButton from "@/components/BackButton";

export default async function LearnPage() {
  // The "who leads at what" table is generated from the catalog's own sourced
  // research rather than restated by hand, so it can never drift out of sync
  // with what the chipset pages say.
  const chipsets = await prisma.chipset.findMany({
    where: { strengthTag: { not: null } },
    select: {
      slug: true,
      name: true,
      strengthTag: true,
      releaseYear: true,
      brand: { select: { name: true, accent: true } },
    },
    orderBy: [{ releaseYear: "desc" }, { name: "asc" }],
  });

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <BackButton fallbackHref="/" />
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Learn</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--ink-soft)]">
          The background a salesperson needs to hold a technical conversation with a trade
          buyer — what the parts of a chip actually do, how to read a benchmark without being
          misled, and where the market is heading.
        </p>

        {LEARN_SECTIONS.map((section) => (
          <section
            key={section.id}
            className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm"
          >
            <h2 className="font-display text-lg font-semibold text-[var(--ink)]">{section.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">{section.intro}</p>

            <dl className="mt-4 flex flex-col gap-3">
              {section.blocks.map((block) => (
                <div
                  key={block.term}
                  className="rounded-xl border border-[var(--line)]/70 bg-white/70 p-3.5"
                >
                  <dt className="text-[12px] font-bold text-[var(--ink)]">{block.term}</dt>
                  <dd className="mt-1 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">
                    {block.body}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
            Who leads at what — quick reference
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Pulled straight from each chipset&apos;s sourced research in this catalog, so it stays
            in step with the chipset pages. Tap any chip for the full reasoning and its source.
          </p>

          <div className="mt-4 flex flex-col gap-1.5">
            {chipsets.map((c) => (
              <Link
                key={c.slug}
                href={`/chipsets/${c.slug}`}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-white px-3 py-2 transition hover:border-[var(--signal)]/40"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.brand.accent }} />
                <span className="w-[172px] shrink-0 truncate text-[12.5px] font-semibold text-[var(--ink)]">
                  {c.name}
                </span>
                <span className="hidden shrink-0 text-[11px] text-[var(--ink-faint)] sm:block">
                  {c.releaseYear}
                </span>
                <span className="min-w-0 flex-1 truncate text-right text-[11.5px] font-medium text-[var(--signal)]">
                  {c.strengthTag}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">Where to check things</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            The outlets this catalog sources from. If a buyer asks about something not in here
            yet, start with these rather than a search engine summary.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {LEARN_SOURCES.map((source) => (
              <li key={source.url} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-[12.5px] font-semibold text-[var(--signal)] hover:underline"
                >
                  {source.name}
                </a>
                <span className="text-[11.5px] text-[var(--ink-soft)]">— {source.note}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
