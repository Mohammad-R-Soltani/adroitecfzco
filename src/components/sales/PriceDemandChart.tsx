"use client";

import { useState } from "react";

export type PriceDemandRow = {
  name: string;
  saleRate: number;
  costPerUnitSold: number | null;
  marginPercent: number | null;
  qty: number;
  windowQty: number | null;
};

type Window = 1 | 2 | 3 | null;

/**
 * Price beside demand, as two aligned tracks rather than one chart with two
 * y-axes. Money per unit and units sold have nothing in common numerically —
 * plotting them on a shared scale would make a cheap high-volume product look
 * identical to an expensive slow one. Each track keeps its own scale and says
 * so; the product rows line up so a row can still be read across.
 */
export default function PriceDemandChart({
  rows,
  onWindowChange,
  activeWindow,
}: {
  rows: PriceDemandRow[];
  onWindowChange?: (w: Window) => void;
  activeWindow?: Window;
}) {
  const [internal, setInternal] = useState<Window>(3);
  const windowMonths = activeWindow !== undefined ? activeWindow : internal;

  function setWindow(w: Window) {
    if (onWindowChange) onWindowChange(w);
    else setInternal(w);
  }

  const demandOf = (r: PriceDemandRow) => (windowMonths == null ? r.qty : (r.windowQty ?? 0));

  const maxPrice = Math.max(...rows.map((r) => r.saleRate), 1);
  const maxDemand = Math.max(...rows.map(demandOf), 1);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11.5px] text-[var(--ink-soft)]">
          Demand window:
        </p>
        <div className="flex gap-1.5">
          {([1, 2, 3, null] as Window[]).map((w) => (
            <button
              key={String(w)}
              type="button"
              onClick={() => setWindow(w)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                windowMonths === w
                  ? "border-[#0f766e] bg-[#0f766e] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[#0f766e]/40"
              }`}
            >
              {w ? `First ${w} month${w > 1 ? "s" : ""}` : "All time"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
              <th className="w-[190px] px-2 pb-2 text-left">Product</th>
              <th className="px-2 pb-2 text-left">Sale price per unit (AED)</th>
              <th className="px-2 pb-2 text-left">
                Units sold {windowMonths ? `(first ${windowMonths} mo)` : "(all time)"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const demand = demandOf(r);
              return (
                <tr key={r.name} className="border-t border-[var(--line)]">
                  <td className="w-[190px] max-w-[190px] px-2 py-2">
                    <p className="truncate text-[11.5px] font-medium text-[var(--ink)]" title={r.name}>
                      {r.name}
                    </p>
                    {r.marginPercent != null && (
                      <p className="text-[10px] text-[var(--ink-faint)]">
                        {r.marginPercent.toFixed(1)}% margin
                      </p>
                    )}
                  </td>

                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
                        <span className="flex h-full">
                          {/* Cost sits inside the price bar, so the visible
                              remainder is the margin rather than a second bar
                              competing for the same space. */}
                          {r.costPerUnitSold != null && (
                            <span
                              className="h-full rounded-l-full bg-[#94a3b8]"
                              style={{ width: `${(r.costPerUnitSold / maxPrice) * 100}%` }}
                            />
                          )}
                          <span
                            className="h-full bg-[#0f766e]"
                            style={{
                              width: `${((r.saleRate - (r.costPerUnitSold ?? r.saleRate)) / maxPrice) * 100}%`,
                            }}
                          />
                        </span>
                      </span>
                      <span className="spec-value w-[62px] shrink-0 text-right text-[11.5px] font-semibold text-[var(--ink)]">
                        {r.saleRate.toFixed(0)}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
                        <span
                          className="block h-full rounded-full bg-[#2a78d6]"
                          style={{ width: `${(demand / maxDemand) * 100}%` }}
                        />
                      </span>
                      <span className="spec-value w-[62px] shrink-0 text-right text-[11.5px] font-semibold text-[var(--ink)]">
                        {demand.toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-3">
        <Key color="#94a3b8" label="Cost of goods sold" />
        <Key color="#0f766e" label="Gross margin" />
        <Key color="#2a78d6" label="Units sold" />
        <p className="text-[10.5px] text-[var(--ink-faint)]">
          Each track has its own scale — price and units are not comparable to each other.
        </p>
      </div>
    </div>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-soft)]">
      <span className="h-2.5 w-4 rounded" style={{ background: color }} />
      {label}
    </span>
  );
}
