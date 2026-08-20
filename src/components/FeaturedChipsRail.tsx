"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { useRef } from "react";
import { useScrollPeek } from "@/lib/useScrollPeek";

export type FeaturedChipset = {
  id: string;
  slug: string;
  name: string;
  series: string;
  releaseYear: number;
  processNode: string;
  geekbenchMultiCore: number | null;
  gradientFrom: string;
  gradientTo: string;
  brand: { name: string; accent: string };
};

const rail: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function FeaturedChipsRail({ chipsets }: { chipsets: FeaturedChipset[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  useScrollPeek(railRef);

  if (chipsets.length === 0) return null;

  return (
    <section className="border-b border-[var(--line)] py-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
            Popular chipsets
          </h2>
          <Link href="/compare" className="text-xs font-medium text-[var(--signal)] hover:underline">
            Compare all &rarr;
          </Link>
        </div>

        <div className="relative">
          <motion.div
            ref={railRef}
            variants={rail}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="rail snap-x snap-mandatory -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6"
          >
            {chipsets.map((chipset) => (
              <motion.div key={chipset.id} variants={card} className="shrink-0 snap-start">
                <Link
                  href={`/chipsets/${chipset.slug}`}
                  className="group relative flex w-[168px] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <span
                    className="chip-sheen absolute inset-x-0 top-0 h-1.5"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${chipset.gradientFrom}, ${chipset.gradientTo}, ${chipset.gradientFrom})`,
                    }}
                  />
                  <motion.span
                    className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]"
                    whileHover={{ x: 2 }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                        style={{ background: chipset.brand.accent }}
                      />
                      <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: chipset.brand.accent }} />
                    </span>
                    {chipset.brand.name}
                  </motion.span>
                  <p className="font-display text-lg font-semibold leading-tight text-[var(--ink)] transition-colors group-hover:text-[var(--signal)]">
                    {chipset.name}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
                    {chipset.processNode.split(" ")[0]} · {chipset.releaseYear}
                  </p>
                  {chipset.geekbenchMultiCore && (
                    <p className="spec-value mt-3 text-sm font-semibold text-[var(--signal)]">
                      {chipset.geekbenchMultiCore.toLocaleString()}
                      <span className="ml-1 text-[10px] font-normal text-[var(--ink-faint)]">GB6</span>
                    </p>
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>
    </section>
  );
}
