"use client";

import { useEffect, type RefObject } from "react";

/** Nudges a horizontal scroll rail on first mount so users notice it scrolls. */
export function useScrollPeek(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setTimeout(() => {
      if (el.scrollWidth <= el.clientWidth + 8) return;
      el.scrollTo({ left: 72, behavior: "smooth" });
      const back = setTimeout(() => el.scrollTo({ left: 0, behavior: "smooth" }), 600);
      return () => clearTimeout(back);
    }, 700);

    return () => clearTimeout(timer);
  }, [ref]);
}
