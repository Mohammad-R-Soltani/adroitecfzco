import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";

/**
 * The only sanctioned way into commercial data.
 *
 * Everything here is first-party and confidential — purchase prices, margins
 * and volumes — so no query in this file runs before `requireSalesAccess()`
 * has confirmed the caller holds SALES access. Reading these tables directly
 * from a page or component bypasses that check, so don't: add a function here
 * instead.
 */

export const getSalesUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user || !user.isActive) return null;
  if (!user.modules.includes("SALES")) return null;
  return user;
});

export async function requireSalesAccess() {
  const user = await getSalesUser();
  // Both modules sign in from the same page, and the sales card there states
  // plainly that it needs its own grant.
  if (!user) redirect("/login");
  return user;
}

export type DemandPoint = { month: string; qty: number; partial: boolean };

export type ProductDemand = {
  id: string;
  name: string;
  family: string;
  variant: string | null;
  colour: string | null;
  deviceSlug: string | null;
  totalQty: number;
  months: DemandPoint[];
};

/** Monthly demand per product, newest month last, for the trend views. */
export async function getProductDemand(limit = 40): Promise<ProductDemand[]> {
  await requireSalesAccess();

  const products = await prisma.tradedProduct.findMany({
    include: {
      device: { select: { slug: true } },
      months: { orderBy: { month: "asc" } },
    },
  });

  return products
    .map((p) => ({
      id: p.id,
      name: p.name,
      family: p.family,
      variant: p.variant,
      colour: p.colour,
      deviceSlug: p.device?.slug ?? null,
      totalQty: p.months.reduce((sum, m) => sum + m.outwardQty, 0),
      months: p.months.map((m) => ({
        month: m.month.toISOString().slice(0, 10),
        qty: m.outwardQty,
        partial: m.partialPeriod,
      })),
    }))
    .filter((p) => p.totalQty > 0)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, limit);
}

/** Demand rolled up to the model family, so colour variants read as one line. */
export async function getFamilyDemand(limit = 12) {
  await requireSalesAccess();

  const rows = await prisma.demandMonth.findMany({
    select: { month: true, outwardQty: true, product: { select: { family: true } } },
  });

  const byFamily = new Map<string, Map<string, number>>();
  for (const row of rows) {
    // Families are merged case-insensitively: the source spells the same
    // product both ways ("Redmi A5" / "REDMI A5").
    const family = row.product.family.toUpperCase();
    const month = row.month.toISOString().slice(0, 10);
    const months = byFamily.get(family) ?? new Map<string, number>();
    months.set(month, (months.get(month) ?? 0) + row.outwardQty);
    byFamily.set(family, months);
  }

  return [...byFamily.entries()]
    .map(([family, months]) => ({
      family,
      total: [...months.values()].reduce((a, b) => a + b, 0),
      // The ledger only ever writes a row when something moved — a month
      // with zero units sold simply has no row, rather than a row of 0. Left
      // as-is, the chart draws a straight line from the month before a gap
      // to the month after, which reads as smooth, continuing demand and
      // hides what was actually a stockout or a dead month. Filling every
      // calendar month between the family's first and last sale with an
      // explicit 0 makes that dip visible, and keeps "months since first
      // sale" numbering true to actual elapsed months instead of just
      // counting how many rows happened to exist.
      months: fillMonthlyGaps(months),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function fillMonthlyGaps(months: Map<string, number>): { month: string; qty: number }[] {
  const keys = [...months.keys()].sort();
  if (keys.length === 0) return [];

  const out: { month: string; qty: number }[] = [];
  let cursor = new Date(keys[0] + "T00:00:00Z");
  const end = new Date(keys[keys.length - 1] + "T00:00:00Z");

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    out.push({ month: key, qty: months.get(key) ?? 0 });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return out;
}

/** Headline figures for the sales landing page. */
export async function getSalesOverview() {
  await requireSalesAccess();

  const [productCount, monthAgg, dayAgg, forecastCount, range] = await Promise.all([
    prisma.tradedProduct.count(),
    prisma.demandMonth.aggregate({ _sum: { outwardQty: true } }),
    prisma.demandDay.aggregate({ _sum: { outwardQty: true }, _count: true }),
    prisma.demandForecast.count(),
    prisma.demandMonth.aggregate({ _min: { month: true }, _max: { month: true } }),
  ]);

  return {
    productCount,
    totalUnits: monthAgg._sum.outwardQty ?? 0,
    dayRows: dayAgg._count,
    forecastCount,
    firstMonth: range._min.month?.toISOString().slice(0, 10) ?? null,
    lastMonth: range._max.month?.toISOString().slice(0, 10) ?? null,
  };
}

/**
 * Price beside demand, per product.
 *
 * `windowQty` counts only the product's first N months with any trade, so
 * products that launched at different times can be compared on equal footing —
 * a product on sale for a year would otherwise always outsell a recent one.
 */
export async function getPriceAndDemand(windowMonths = 3, limit = 15) {
  await requireSalesAccess();

  const products = await prisma.tradedProduct.findMany({
    where: { financials: { some: { saleRate: { not: null } } } },
    include: {
      // Every product currently has exactly one financials row (one Stock
      // Summary period), so `[0]` happens to be safe today — but the model
      // carries a periodStart/periodEnd precisely because more than one was
      // expected eventually. Ordering explicitly means a second imported
      // period silently ranks by likely relevance instead of whatever order
      // Postgres felt like returning, which is never guaranteed.
      financials: { orderBy: { periodEnd: "desc" } },
      months: { orderBy: { month: "asc" } },
    },
  });

  return products
    .map((p) => {
      const fin = p.financials[0];
      const active = p.months.filter((m) => m.outwardQty > 0);
      return {
        name: p.name,
        saleRate: fin?.saleRate ?? 0,
        costPerUnitSold: fin?.costPerUnitSold ?? null,
        marginPercent: fin?.marginPercent ?? null,
        qty: p.months.reduce((sum, m) => sum + m.outwardQty, 0),
        windowQty: active.slice(0, windowMonths).reduce((sum, m) => sum + m.outwardQty, 0),
      };
    })
    .filter((r) => r.saleRate > 0 && r.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

/**
 * Every product that sold below what its goods cost, across the whole ledger.
 *
 * The price/demand chart ranks by units sold and stops at fifteen rows, which
 * means a product can lose money on every unit and never appear — the chart
 * showed nothing but healthy margins while eleven products were underwater.
 * This deliberately ignores the volume ranking: a loss is worth surfacing
 * whether it happened on four units or four thousand.
 */
export async function getLossMakingProducts() {
  await requireSalesAccess();

  const rows = await prisma.productFinancials.findMany({
    where: { saleRate: { not: null }, costPerUnitSold: { not: null } },
    include: { product: { select: { name: true, months: { select: { outwardQty: true } } } } },
    orderBy: { periodEnd: "desc" },
  });

  return rows
    .filter((r) => r.costPerUnitSold! > r.saleRate!)
    .map((r) => ({
      name: r.product.name,
      saleRate: r.saleRate!,
      costPerUnitSold: r.costPerUnitSold!,
      lossPerUnit: r.costPerUnitSold! - r.saleRate!,
      marginPercent: r.marginPercent,
      unitsSold: r.product.months.reduce((sum, m) => sum + m.outwardQty, 0),
    }))
    .map((r) => ({ ...r, totalLoss: r.lossPerUnit * r.unitsSold }))
    .sort((a, b) => b.totalLoss - a.totalLoss);
}

/** The company's own forecasts, with the method and backtest error attached. */
export async function getForecasts(limit = 25) {
  await requireSalesAccess();

  const rows = await prisma.demandForecast.findMany({
    include: { product: { select: { name: true, family: true } } },
    orderBy: { forecastQty: "desc" },
    take: limit,
  });

  return rows.map((f) => ({
    id: f.id,
    productName: f.product.name,
    family: f.product.family,
    periodStart: f.periodStart.toISOString().slice(0, 10),
    periodEnd: f.periodEnd.toISOString().slice(0, 10),
    forecastQty: f.forecastQty,
    lowerBound: f.lowerBound,
    upperBound: f.upperBound,
    method: f.method,
    backtestWape: f.backtestWape,
  }));
}
