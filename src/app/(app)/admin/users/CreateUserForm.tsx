"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser, type CreateUserState } from "./actions";

const initialState: CreateUserState = {};
const inputClass =
  "rounded-lg border border-[var(--line)] bg-[var(--mist)] px-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none focus:border-[var(--signal)] focus:bg-white focus:ring-2 focus:ring-[var(--signal)]/15";

export default function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(createUser, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="surface-card grid grid-cols-1 gap-3 rounded-2xl border border-[var(--line)] p-5 shadow-sm sm:grid-cols-2"
    >
      <input name="username" placeholder="Username" required className={inputClass} />
      <input name="displayName" placeholder="Full name" required className={inputClass} />
      <input name="password" type="password" placeholder="Temporary password" required className={inputClass} />
      <select name="role" defaultValue="STAFF" className={inputClass}>
        <option value="STAFF">Staff</option>
        <option value="ADMIN">Admin</option>
      </select>

      {state.error && (
        <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="sm:col-span-2 text-sm text-emerald-600">Account created.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="sm:col-span-2 rounded-lg bg-[var(--signal)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--signal-deep)] disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
