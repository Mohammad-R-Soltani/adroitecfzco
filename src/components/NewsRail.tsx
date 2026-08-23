"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { useRef, useState } from "react";
import type { FeedItem } from "@/lib/rss";
import { useScrollPeek } from "@/lib/useScrollPeek";
import NewsReader, { type ReaderItem } from "./NewsReader";

export type RailItem = Omit<FeedItem, "pubDate"> & { pubDate: string };

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const rail: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const card: Variants = {
  hidden: { opacity: 0, x: 28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function NewsRail({ items }: { items: RailItem[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ReaderItem | null>(null);
  useScrollPeek(railRef);

  if (items.length === 0) return null;

  return (
    <section className="relative border-b border-[var(--line)] bg-[var(--mist)]/60 py-4 sm:py-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
          Latest in mobile
        </h2>

        <div className="relative">
          <motion.div
            ref={railRef}
            variants={rail}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="rail snap-x snap-mandatory -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6"
          >
            {items.map((item, i) => (
              <motion.button
                key={item.link}
                type="button"
                variants={card}
                onClick={() => setActive(item)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                className="surface-card group flex w-[200px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[var(--line)] text-left shadow-sm transition-colors hover:border-[var(--signal)]/40 hover:shadow-md sm:w-[230px]"
              >
                <div className="relative h-24 w-full shrink-0 overflow-hidden bg-[var(--mist)] sm:h-28">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 200px, 230px"
                      priority={i < 3}
                      className="object-cover transition duration-500 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-display text-lg font-semibold text-[var(--ink-faint)]">
                        {item.source.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-2 right-2 translate-y-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--signal)] opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    Read
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2.5">
                  <p className="line-clamp-2 text-[12.5px] font-medium leading-snug text-[var(--ink)]">
                    {item.title}
                  </p>
                  <p className="mt-auto text-[10.5px] font-medium text-[var(--ink-faint)]">
                    {item.source} · {timeAgo(item.pubDate)}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>

          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--mist)] to-transparent" />
        </div>
      </div>

      <NewsReader item={active} onClose={() => setActive(null)} />
    </section>
  );
}
