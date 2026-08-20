"use client";

import { useActionState, useEffect, useRef } from "react";
import { createChipset, type CreateChipsetState } from "./actions";

const initialState: CreateChipsetState = {};
const inputClass =
  "rounded-lg border border-[var(--line)] bg-[var(--mist)] px-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none focus:border-[var(--signal)] focus:bg-white focus:ring-2 focus:ring-[var(--signal)]/15";

export default function CreateChipsetForm() {
  const [state, formAction, isPending] = useActionState(createChipset, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <details className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <summary className="cursor-pointer text-sm font-medium text-[var(--ink)]">
        + Add a new chipset
      </summary>
      <form ref={formRef} action={formAction} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select name="brandSlug" defaultValue="apple" className={inputClass}>
          <option value="apple">Apple</option>
          <option value="xiaomi">Xiaomi</option>
        </select>
        <input name="series" placeholder="Series (e.g. A-series)" required className={inputClass} />
        <input name="name" placeholder="Chipset name" required className={inputClass} />
        <input name="releaseYear" type="number" placeholder="Release year" required className={inputClass} />
        <input name="processNode" placeholder="Process node" required className={inputClass} />
        <input name="cpuSummary" placeholder="CPU summary" required className={inputClass} />
        <input name="gpuSummary" placeholder="GPU summary" required className={inputClass} />
        <input name="npuSummary" placeholder="NPU / Neural engine (optional)" className={inputClass} />
        <input name="maxRam" placeholder="Max RAM (optional)" className={inputClass} />
        <input name="gradientFrom" placeholder="Gradient from (#hex)" required defaultValue="#1d1d1f" className={inputClass} />
        <input name="gradientTo" placeholder="Gradient to (#hex)" required defaultValue="#0071e3" className={inputClass} />
        <textarea
          name="highlight"
          placeholder="Highlight — one or two sentences shown on the card"
          required
          rows={2}
          className={`${inputClass} sm:col-span-2`}
        />
        <input
          name="sourceNote"
          placeholder="Source note (e.g. Apple keynote, Sept 2025)"
          required
          className={`${inputClass} sm:col-span-2`}
        />

        {state.error && <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="sm:col-span-2 text-sm text-emerald-600">Chipset added.</p>}

        <button
          type="submit"
          disabled={isPending}
          className="sm:col-span-2 rounded-lg bg-[var(--signal)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--signal-deep)] disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Add chipset"}
        </button>
      </form>
    </details>
  );
}
