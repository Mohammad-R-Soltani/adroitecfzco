/**
 * The one-line answer a chart is being asked for.
 *
 * Every chart in the product desk was showing its numbers correctly and
 * leaving the reader to work out the conclusion. This states it: what was
 * measured, and which entry came out on top. Findings are computed from the
 * same data the chart plots — never written by hand — so the sentence cannot
 * drift away from the picture beside it.
 */
export type Finding = {
  /** What this finding answers, e.g. "Best value". */
  label: string;
  /** The winner — a device, chipset or year. */
  headline: string;
  /** The number that settles it, in the chart's own units. */
  detail: string;
  /** Accent for the marker; defaults to the app's signal colour. */
  color?: string;
};

export default function ChartVerdict({
  findings,
  note,
  example,
}: {
  findings: Finding[];
  /** An honest caveat, when the top line alone would mislead. */
  note?: string;
  /**
   * One concrete comparison, in the plainest words the data allows — the
   * sentence someone reads instead of studying the chart. Written from the
   * same numbers, so it stays true as the data changes.
   */
  example?: React.ReactNode;
}) {
  if (findings.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--mist)]/60 px-3.5 py-3">
      {example && (
        <p className="mb-3 border-b border-[var(--line)] pb-2.5 text-[13px] leading-relaxed text-[var(--ink)]">
          <span className="mr-1.5 font-bold text-[var(--signal)]">In plain terms:</span>
          {example}
        </p>
      )}

      <div className="flex flex-wrap gap-x-7 gap-y-3">
        {findings.map((f) => (
          <div key={f.label} className="min-w-[130px]">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: f.color ?? "var(--signal)" }}
              />
              {f.label}
            </p>
            <p className="mt-1 text-[13px] font-bold leading-tight text-[var(--ink)]">{f.headline}</p>
            <p className="spec-value mt-0.5 text-[11px] text-[var(--ink-soft)]">{f.detail}</p>
          </div>
        ))}
      </div>
      {note && (
        <p className="mt-2.5 border-t border-[var(--line)] pt-2 text-[11.5px] leading-snug text-[var(--ink-soft)]">
          {note}
        </p>
      )}
    </div>
  );
}
