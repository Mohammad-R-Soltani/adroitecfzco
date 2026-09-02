"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ fallbackHref, label = "Back" }: { fallbackHref: string; label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="mb-4 flex items-center gap-1.5 text-sm font-medium text-[var(--ink-soft)] transition hover:text-[var(--signal)]"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}
