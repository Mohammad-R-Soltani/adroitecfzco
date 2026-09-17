import {
  requireSalesAccess,
  getSalesOverview,
  getFamilyDemand,
  getForecasts,
  getPriceAndDemand,
  getLossMakingProducts,
} from "@/lib/salesDal";
import DemandTrendChart from "@/components/sales/DemandTrendChart";
import PriceDemandChart from "@/components/sales/PriceDemandChart";

export default async function SalesDashboard() {
  await requireSalesAccess();

  const [overview, families, forecasts, priceDemand, lossMakers] = await Promise.all([
    getSalesOverview(),
    getFamilyDemand(14),
    getForecasts(15),
    getPriceAndDemand(3, 15),
    getLossMakingProducts(),
  ]);

  const totalLoss = lossMakers.reduce((sum, p) => sum + p.totalLoss, 0);

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Demand analysis</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--ink-soft)]">
          Units actually shipped out of stock, month by month, from the company&apos;s own ledger.
          Covers {overview.firstMonth?.slice(0, 7)} to {overview.lastMonth?.slice(0, 7)}.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Units shipped" value={overview.totalUnits.toLocaleString()} />
          <Stat label="Products traded" value={String(overview.productCount)} />
          <Stat label="Daily records" value={overview.dayRows.toLocaleString()} />
          <Stat label="Forecasts on file" value={String(overview.forecastCount)} />
        </div>

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
            How demand moves over time
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
            Each line is one product line. Switch to &ldquo;months since first sale&rdquo; to
            compare products that launched at different times — otherwise a newer model looks
            weak simply because it has fewer months behind it.
          </p>
          <div className="mt-5">
            <DemandTrendChart series={families} />
          </div>
        </section>

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
            What each product sells for, and how many move
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
            The price bar shows cost of goods in grey and the gross margin on top, so the
            coloured part is what the trade actually earned. Change the window to compare
            products by their first months on sale rather than by how long they have existed.
          </p>
          <div className="mt-5">
            <PriceDemandChart rows={priceDemand} />
          </div>

          {lossMakers.length > 0 && (
            <div className="mt-5 rounded-xl border border-[#e34948]/30 bg-[#e34948]/[0.04] p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#b3251f]">
                Sold below cost — {lossMakers.length} product{lossMakers.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">
                These never reach the chart above, which ranks by units sold and stops at fifteen
                rows. Together they gave up{" "}
                <strong className="text-[var(--ink)]">
                  {totalLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })} AED
                </strong>{" "}
                of gross margin across every unit shipped.
              </p>

              <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--line)] bg-white">
                <table className="w-full min-w-[520px] text-left text-[12px]">
                  <thead className="bg-[var(--mist)] text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Sale</th>
                      <th className="px-3 py-2 text-right">Cost</th>
                      <th className="px-3 py-2 text-right">Loss / unit</th>
                      <th className="px-3 py-2 text-right">Units</th>
                      <th className="px-3 py-2 text-right">Total given up</th>
                    </tr>
                  </thead>
                  <tbody className="[font-variant-numeric:tabular-nums]">
                    {lossMakers.map((p) => (
                      <tr key={p.name} className="border-t border-[var(--line)]">
                        <td className="px-3 py-2 font-medium text-[var(--ink)]">{p.name}</td>
                        <td className="px-3 py-2 text-right text-[var(--ink-soft)]">{p.saleRate.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right text-[var(--ink-soft)]">{p.costPerUnitSold.toFixed(0)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-[#b3251f]">
                          −{p.lossPerUnit.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-[var(--ink-soft)]">{p.unitsSold.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-semibold text-[#b3251f]">
                          −{p.totalLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="surface-card mt-6 rounded-2xl border border-[var(--line)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
            What the forecast expects next
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
            The company&apos;s own 30-day forecast. Each row shows the method used and its
            backtest error — a high error means treat that number with care, not as a promise.
          </p>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)]">
            <table className="w-full min-w-[560px] text-left text-[12px]">
              <thead className="bg-[var(--mist)] text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Forecast</th>
                  <th className="px-3 py-2 text-right">Range</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2 text-right">Backtest error</th>
                </tr>
              </thead>
              <tbody className="[font-variant-numeric:tabular-nums]">
                {forecasts.map((f) => {
                  const wape = f.backtestWape;
                  const reliability =
                    wape == null ? null : wape < 0.3 ? "good" : wape < 0.6 ? "fair" : "weak";
                  return (
                    <tr key={f.id} className="border-t border-[var(--line)]">
                      <td className="px-3 py-2 font-medium text-[var(--ink)]">{f.productName}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--ink)]">
                        {f.forecastQty.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--ink-faint)]">
                        {f.lowerBound != null && f.upperBound != null
                          ? `${f.lowerBound.toLocaleString()} – ${f.upperBound.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-[var(--ink-soft)]">{f.method}</td>
                      <td className="px-3 py-2 text-right">
                        {wape == null ? (
                          <span className="text-[var(--ink-faint)]">not backtested</span>
                        ) : (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                            style={{
                              background:
                                reliability === "good" ? "#1baf7a18" : reliability === "fair" ? "#eda10018" : "#e3494818",
                              color:
                                reliability === "good" ? "#0f766e" : reliability === "fair" ? "#8a6100" : "#b3251f",
                            }}
                          >
                            {Math.round(wape * 100)}% {reliability}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-2xl border border-[var(--line)] p-3.5 shadow-sm">
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{label}</p>
      <p className="spec-value mt-1 text-xl font-bold text-[var(--ink)]">{value}</p>
    </div>
  );
}
