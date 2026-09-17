"use client";

import { useEffect, useState } from "react";

type Row = {
  key: string;
  label: string;
  value: number;
  unit: string;
  changePercent: number | null;
  sourceName: string;
};

// A stock symbol gets its brand's own colour on the name only — the value
// and the up/down indicator stay neutral/green/red, so brand identity and
// price direction never compete for the same colour.
const BRAND_COLOR: Record<string, string> = {
  AAPL: "#1D1D1F",
};

// Flags for the currencies actually shown, plus a small generic apple
// pictogram for AAPL — a simplified fruit silhouette drawn for this app, not
// a trace of Apple's own trademarked logomark, used purely to make the stock
// identifiable at a glance the same way the currency flags do.
const FLAG: Record<string, string> = { USD: "🇺🇸", EUR: "🇪🇺", AED: "🇦🇪" };

function RowIcon({ row }: { row: Row }) {
  if (row.key === "AAPL") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="#1D1D1F" aria-hidden>
        <path d="M16.4 12.3c0-2.1 1.7-3.2 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.4 2-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.2-.8-2.2-3.1zM14.2 6.1c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" />
      </svg>
    );
  }
  const [from] = row.label.split("/");
  const flag = FLAG[from];
  return flag ? <span aria-hidden className="text-[12px] leading-none">{flag}</span> : null;
}

function formatValue(row: Row) {
  const decimals = row.value >= 100 ? 2 : 4;
  const n = row.value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return row.unit === "USD" || row.unit === "AED" ? `${n} ${row.unit}` : `${row.unit} ${n}`;
}

function TickerItem({ row, showDivider }: { row: Row; showDivider: boolean }) {
  const up = (row.changePercent ?? 0) >= 0;
  const brandColor = BRAND_COLOR[row.key];

  return (
    <span className="inline-flex shrink-0 items-center gap-4 text-[12px]">
      <span className="inline-flex items-center gap-1.5">
        <RowIcon row={row} />
        <span className="font-semibold" style={{ color: brandColor ?? "var(--ink-soft)" }}>
          {row.label}
        </span>
        <span className="spec-value font-medium text-[var(--ink)]">{formatValue(row)}</span>
        {row.changePercent != null && (
          <span
            className="spec-value inline-flex items-center gap-0.5 font-semibold"
            style={{ color: up ? "#1baf7a" : "#e34948" }}
          >
            <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
              {up ? (
                <path d="M6 2.5L10 8.5H2L6 2.5Z" fill="currentColor" />
              ) : (
                <path d="M6 9.5L2 3.5H10L6 9.5Z" fill="currentColor" />
              )}
            </svg>
            {Math.abs(row.changePercent).toFixed(2)}%
          </span>
        )}
      </span>
      {/* A visible rule between items — the previous plain gap read as one
          run-on line once several numbers sat next to each other. */}
      {showDivider && (
        <span aria-hidden className="h-3 w-px bg-[var(--line)]">
          &nbsp;
        </span>
      )}
    </span>
  );
}

export default function MarketTicker() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/market-ticker", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setRows(data.rows ?? []);
      } catch {
        // A quiet header bar beats a broken one — the ticker just stays
        // empty until the next poll succeeds.
      }
    }
    load();
    // Polls the app's own DB-backed endpoint, not the external APIs — cheap,
    // and safe to run in every open tab regardless of the server's own
    // 2.5-minute refresh cadence.
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (rows.length === 0) return <div className="min-w-0 flex-1" />;

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
      <div className="flex w-max animate-[ticker-scroll_38s_linear_infinite] items-center gap-4 hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-4" aria-hidden={copy === 1}>
            {rows.map((row, i) => (
              <TickerItem key={`${copy}-${row.key}`} row={row} showDivider={i < rows.length - 1} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
