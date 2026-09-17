import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Refreshes the header ticker's numbers from two free, keyless sources:
 * exchangerate-api.com's open endpoint for FX (no signup; the ECB-backed
 * Frankfurter API was tried first but does not publish an AED rate at all)
 * and Yahoo Finance's public quote endpoint for AAPL. Apple is the only
 * brand stock kept here — Samsung and Xiaomi trade on the Korean and Hong
 * Kong exchanges, which no credible free-tier API covers at 2-3 minute
 * polling frequency without a paid plan.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36";

type TickerRow = {
  key: string;
  label: string;
  value: number;
  unit: string;
  changePercent: number | null;
  sourceName: string;
};

async function fetchFx(): Promise<TickerRow[]> {
  // Daily-fixing rates (updated once a day, not tick-by-tick) — real and
  // official, but intraday moves will be flat between updates. The AED leg
  // in particular barely moves at all in reality: it has been hard-pegged
  // to the US dollar since 1997.
  const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
  if (!res.ok) throw new Error(`exchangerate-api ${res.status}`);
  const data = await res.json();
  const usdAed = data.rates.AED as number;
  const eurPerUsd = data.rates.EUR as number;
  const usdPerEur = 1 / eurPerUsd;
  // AED per 1 EUR: convert through USD, not by re-using the USD-per-EUR
  // fraction directly — that inverse was the bug that first shipped here.
  const eurAed = usdAed * usdPerEur;
  const source = "exchangerate-api.com";

  return [
    { key: "USDAED", label: "USD/AED", value: usdAed, unit: "AED", changePercent: null, sourceName: source },
    { key: "EURUSD", label: "EUR/USD", value: usdPerEur, unit: "USD", changePercent: null, sourceName: source },
    { key: "EURAED", label: "EUR/AED", value: eurAed, unit: "AED", changePercent: null, sourceName: source },
  ];
}

async function fetchStock(symbol: string, label: string): Promise<TickerRow | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      headers: { "User-Agent": UA },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return {
      key: symbol,
      label,
      value: meta.regularMarketPrice,
      unit: meta.currency ?? "USD",
      changePercent: meta.regularMarketChangePercent ?? null,
      sourceName: "Yahoo Finance",
    };
  } catch {
    return null;
  }
}

export async function refreshMarketPrices() {
  const rows: TickerRow[] = [];

  try {
    rows.push(...(await fetchFx()));
  } catch (err) {
    console.error("[marketData] FX refresh failed:", (err as Error).message);
  }

  const aapl = await fetchStock("AAPL", "Apple (AAPL)");
  if (aapl) rows.push(aapl);

  for (const row of rows) {
    await prisma.marketPrice.upsert({
      where: { key: row.key },
      update: { label: row.label, value: row.value, unit: row.unit, changePercent: row.changePercent, sourceName: row.sourceName },
      create: row,
    });
  }

  return rows.length;
}
