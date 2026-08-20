"use client";

import { useActionState, useEffect, useRef } from "react";
import { addDevice, type AddDeviceState } from "./actions";

const initialState: AddDeviceState = {};
const inputClass =
  "rounded-lg border border-[var(--line)] bg-[var(--mist)] px-3 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none focus:border-[var(--signal)] focus:bg-white";

export default function AddDeviceForm({ chipsetId }: { chipsetId: string }) {
  const [state, formAction, isPending] = useActionState(addDevice, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="chipsetId" value={chipsetId} />
      <input name="name" placeholder="Device name" required className={`min-w-0 flex-1 ${inputClass}`} />
      <select name="category" defaultValue="PHONE" className={inputClass}>
        <option value="PHONE">Phone</option>
        <option value="TABLET">Tablet</option>
        <option value="LAPTOP">Laptop</option>
        <option value="WATCH">Watch</option>
      </select>
      <input name="releaseDate" type="date" required className={inputClass} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:border-[var(--signal)]/40 hover:text-[var(--signal)] disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
