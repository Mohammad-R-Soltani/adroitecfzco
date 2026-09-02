"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useTransition } from "react";
import { toggleBookmark } from "@/app/bookmark-actions";

export type ListChipset = {
  id: string;
  slug: string;
  name: string;
  series: string;
  releaseYear: number;
  processNode: string;
  cpuSummary: string;
  gpuSummary: string;
  npuSummary: string | null;
  maxRam: string | null;
  highlight: string;
  strengthTag: string | null;
  competitiveEdge: string | null;
  gradientFrom: string;
  gradientTo: string;
  brand: { name: string; accent: string };
  devices: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
  }[];
};

type RealBenchmark = { value: number; deviceName: string; sourceName: string; sourceUrl: string };

export default function ChipsetListCard({
  chipset,
  isBookmarked,
  index,
  realBenchmark,
}: {
  chipset: ListChipset;
  isBookmarked: boolean;
  index: number;
  realBenchmark: RealBenchmark | null;
}) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isPending, startTransition] = useTransition();
  const cardRef = useRef<HTMLElement>(null);
  // Narrow band through the viewport middle — only one card is "focused" at a time.
  const focused = useInView(cardRef, { margin: "-42% 0px -42% 0px" });
  const heroDevice = chipset.devices.find((d) => d.imageUrl) ?? null;
  const flipped = index % 2 === 1;

  function onToggleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    setBookmarked((v) => !v);
    startTransition(() => {
      toggleBookmark(chipset.id);
    });
  }

  const specs = [
    { label: "Process", value: chipset.processNode },
    { label: "CPU", value: chipset.cpuSummary },
    { label: "GPU", value: chipset.gpuSummary },
    ...(chipset.npuSummary ? [{ label: "Neural engine", value: chipset.npuSummary }] : []),
    ...(chipset.maxRam ? [{ label: "Memory", value: chipset.maxRam }] : []),
  ];

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      animate={{
        scale: focused ? 1 : 0.955,
        opacity: focused ? 1 : 0.62,
      }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden rounded-3xl border transition-shadow duration-500 ${
        focused
          ? "border-[var(--signal)]/35 shadow-[0_18px_50px_-18px_rgba(0,113,227,0.38)]"
          : "border-[var(--line)] shadow-sm"
      }`}
      style={{
        background: flipped
          ? `linear-gradient(120deg, #ffffff 52%, ${chipset.gradientFrom}0f 100%)`
          : `linear-gradient(240deg, #ffffff 52%, ${chipset.brand.accent}12 100%)`,
      }}
    >
      {/* brand accent spine */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `linear-gradient(180deg, ${chipset.brand.accent}, ${chipset.gradientTo})` }}
      />

      <div className={`flex flex-col ${flipped ? "md:flex-row-reverse" : "md:flex-row"}`}>
        <Link
          href={`/chipsets/${chipset.slug}`}
          className="relative h-48 w-full shrink-0 overflow-hidden md:h-auto md:w-[46%]"
          aria-label={`${chipset.name} details`}
        >
          {heroDevice?.imageUrl ? (
            <>
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={focused ? { scale: 1.16, x: flipped ? "3%" : "-3%" } : { scale: 1.02, x: "0%" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src={heroDevice.imageUrl}
                  alt={heroDevice.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 46vw"
                  className="object-cover"
                />
              </motion.div>

              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent ${
                  flipped ? "md:bg-gradient-to-l" : "md:bg-gradient-to-r"
                } md:from-transparent md:via-transparent md:to-white/70`}
              />

              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={false}
                animate={focused ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.5, delay: focused ? 0.4 : 0, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="locator-dot flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white bg-[var(--signal)]/30 backdrop-blur-[2px]">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                    <rect x="7" y="7" width="10" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </motion.div>

              <motion.span
                className="spec-value pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm"
                initial={false}
                animate={focused ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.45, delay: focused ? 0.6 : 0 }}
              >
                {chipset.name} inside
              </motion.span>
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(155deg, ${chipset.gradientFrom}, ${chipset.gradientTo})` }}
            />
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${chipset.brand.accent}18`, color: chipset.brand.accent }}
              >
                {chipset.brand.name} · {chipset.series}
              </span>
              <h2 className="font-display mt-1.5 text-2xl font-bold leading-tight text-[var(--ink)] md:text-[26px]">
                <Link href={`/chipsets/${chipset.slug}`} className="hover:text-[var(--signal)]">
                  {chipset.name}
                </Link>
              </h2>
              <p className="spec-value mt-0.5 text-xs text-[var(--ink-faint)]">{chipset.releaseYear}</p>
              {chipset.strengthTag && (
                <div className="mt-1.5">
                  <span className="inline-block rounded-full bg-[var(--signal)]/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[var(--signal)]">
                    Leads in: {chipset.strengthTag}
                  </span>
                  {chipset.competitiveEdge && (
                    <p className="mt-1 max-w-md text-[11.5px] leading-snug text-[var(--ink-faint)]">
                      {firstSentence(chipset.competitiveEdge)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleBookmark}
              disabled={isPending}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? "Remove bookmark" : "Save chipset"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-white/80 transition hover:border-[var(--signal)]/40 active:scale-90"
            >
              <HeartIcon filled={bookmarked} />
            </button>
          </div>

          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{chipset.highlight}</p>

          {realBenchmark ? (
            <a
              href={realBenchmark.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              className="flex items-baseline gap-2 hover:opacity-80"
            >
              <span className="spec-value text-3xl font-bold text-[var(--signal)]">
                {realBenchmark.value.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-[var(--ink-faint)]">
                Geekbench 6 multi-core · {realBenchmark.deviceName} · {realBenchmark.sourceName}
              </span>
            </a>
          ) : (
            <p className="text-[11px] font-medium text-[var(--ink-faint)]">Not yet benchmarked</p>
          )}

          {/* Full spec sheet unfurls for the focused card */}
          <motion.div
            initial={false}
            animate={{ height: focused ? "auto" : 0, opacity: focused ? 1 : 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <dl className="grid grid-cols-1 gap-1.5 pt-1 sm:grid-cols-2">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-xl border border-[var(--line)]/70 bg-white/70 px-3 py-2 backdrop-blur-sm"
                >
                  <dt className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                    {spec.label}
                  </dt>
                  <dd className="spec-value mt-0.5 truncate text-[12px] font-medium text-[var(--ink)]">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          {chipset.devices.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {chipset.devices.map((device) => (
                <Link
                  key={device.id}
                  href={`/devices/${device.slug}`}
                  className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-medium text-[var(--ink-soft)] transition hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
                >
                  {device.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  const sentence = (match?.[0] ?? text).trim();
  return sentence.length < text.length ? sentence : text;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill={filled ? "#ff375f" : "none"}
      stroke={filled ? "#ff375f" : "#8b93a7"}
      strokeWidth="1.9"
    >
      <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.7 2 4.2 5.6 3.6c2-.3 3.9.6 5 2.3 1.1-1.7 3-2.6 5-2.3 3.6.6 5.3 4.1 3.6 7.6-2.5 4.7-10 9.3-10 9.3z" />
    </svg>
  );
}
