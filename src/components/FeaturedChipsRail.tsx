"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type FeaturedChipset = {
  id: string;
  slug: string;
  name: string;
  series: string;
  releaseYear: number;
  highlight: string;
  gradientFrom: string;
  gradientTo: string;
  brand: { name: string; accent: string };
  heroImage: string | null;
  heroDeviceName: string | null;
  realBenchmark: { value: number; sourceName: string } | null;
};

const SLIDE_MS = 4800;

export default function FeaturedChipsRail({ chipsets }: { chipsets: FeaturedChipset[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const count = chipsets.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % count);
      setProgressKey((k) => k + 1);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, count]);

  if (count === 0) return null;

  function goTo(next: number) {
    setIndex(((next % count) + count) % count);
    setProgressKey((k) => k + 1);
  }

  const chipset = chipsets[index];

  return (
    <section className="border-b border-[var(--line)] bg-gradient-to-b from-[var(--mist)] to-white py-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
            Popular chipsets
          </h2>
          <Link href="/compare" className="text-xs font-medium text-[var(--signal)] hover:underline">
            Compare all &rarr;
          </Link>
        </div>

        <div
          className="group relative h-[260px] w-full overflow-hidden rounded-3xl shadow-lg shadow-[var(--signal)]/10 sm:h-[300px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            setPaused(true);
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            if (start != null) {
              const delta = e.changedTouches[0].clientX - start;
              if (delta > 40) goTo(index - 1);
              else if (delta < -40) goTo(index + 1);
            }
            touchStartX.current = null;
            setPaused(false);
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={chipset.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Link href={`/chipsets/${chipset.slug}`} className="absolute inset-0 block">
                {chipset.heroImage ? (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.09 }}
                    transition={{ duration: SLIDE_MS / 1000 + 0.6, ease: "linear" }}
                  >
                    <Image
                      src={chipset.heroImage}
                      alt={chipset.heroDeviceName ?? chipset.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 1152px"
                      priority={index === 0}
                      className="object-cover"
                    />
                  </motion.div>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${chipset.gradientFrom}, ${chipset.gradientTo})` }}
                  />
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
                  style={{ background: `linear-gradient(110deg, ${chipset.gradientFrom}, transparent 60%)` }}
                />

                <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-8">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: chipset.brand.accent }} />
                    {chipset.brand.name} · {chipset.series} · {chipset.releaseYear}
                  </motion.span>

                  <motion.h3
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.55 }}
                    className="font-display text-3xl font-bold leading-none text-white sm:text-4xl"
                  >
                    {chipset.name}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.55 }}
                    className="mt-1.5 line-clamp-1 max-w-lg text-[13px] text-white/75 sm:text-sm"
                  >
                    {chipset.highlight}
                  </motion.p>

                  {chipset.realBenchmark && (
                    <motion.p
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.38, duration: 0.55 }}
                      className="spec-value mt-2.5 text-sm font-bold text-white"
                    >
                      {chipset.realBenchmark.value.toLocaleString()}
                      <span className="ml-1.5 text-[10.5px] font-normal text-white/60">
                        Geekbench 6 multi-core · {chipset.realBenchmark.sourceName}
                      </span>
                    </motion.p>
                  )}
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* progress segments */}
          {count > 1 && (
            <div className="absolute left-4 right-4 top-4 z-20 flex gap-1.5 sm:left-6 sm:right-6">
              {chipsets.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(i);
                  }}
                  aria-label={`Show ${c.name}`}
                  className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  {i === index ? (
                    <motion.div
                      key={progressKey}
                      className="h-full rounded-full bg-white"
                      initial={{ width: "0%" }}
                      animate={{ width: paused ? undefined : "100%" }}
                      transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                    />
                  ) : (
                    <div className={`h-full rounded-full bg-white ${i < index ? "w-full" : "w-0"}`} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* arrows */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="Previous chipset"
                className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition hover:bg-black/50 group-hover:opacity-100 sm:left-3"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="Next chipset"
                className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition hover:bg-black/50 group-hover:opacity-100 sm:right-3"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
