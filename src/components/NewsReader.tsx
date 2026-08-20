"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { FeedItem } from "@/lib/rss";

export type ReaderItem = Omit<FeedItem, "pubDate"> & { pubDate: string };

export default function NewsReader({
  item,
  onClose,
}: {
  item: ReaderItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close article"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--ink)]/50 backdrop-blur-sm"
          />

          <motion.article
            initial={{ y: "100%", opacity: 0.6, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[86dvh] sm:max-w-2xl sm:rounded-3xl"
          >
            {/* Drag affordance on mobile */}
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--line)] sm:hidden" />

            <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[var(--mist)] sm:h-56">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="672px" className="object-cover" priority />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[var(--signal)] to-[var(--glow)]" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              <button
                type="button"
                onClick={onClose}
                aria-label="Close article"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink)] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
                  {item.source}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <h2 className="font-display text-xl font-semibold leading-snug text-[var(--ink)] sm:text-2xl">
                {item.title}
              </h2>
              <p className="spec-value mt-1.5 text-[11px] text-[var(--ink-faint)]">
                {new Date(item.pubDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {item.summary && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="mt-4 border-l-2 border-[var(--signal)] bg-[var(--mist)]/70 py-3 pl-4 pr-3 text-[15px] leading-relaxed text-[var(--ink)]"
                >
                  {item.summary}
                </motion.p>
              )}

              {item.keyPoints.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
                    Key details
                  </h3>
                  <ul className="space-y-2.5">
                    {item.keyPoints.map((point, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.18 + i * 0.06 }}
                        className="flex gap-2.5 text-sm leading-relaxed text-[var(--ink-soft)]"
                      >
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--signal)]/60" />
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {!item.summary && item.keyPoints.length === 0 && (
                <p className="mt-4 text-sm text-[var(--ink-soft)]">
                  This feed didn&apos;t include a preview. Open the full article to read it.
                </p>
              )}
            </div>

            <div className="shrink-0 border-t border-[var(--line)] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--signal)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--signal-deep)]"
              >
                Read the full story on {item.source}
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M7 17L17 7M17 7H9M17 7v8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </motion.article>
        </div>
      )}
    </AnimatePresence>
  );
}
