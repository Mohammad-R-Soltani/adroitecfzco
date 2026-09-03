"use client";

import { useActionState } from "react";
import { salesLogin, type SalesLoginState } from "./salesActions";

const initialState: SalesLoginState = {};
const inputClass =
  "rounded-xl border border-[var(--line)] bg-[var(--mist)] px-4 py-3 text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none transition focus:border-[#0f766e] focus:bg-white focus:ring-2 focus:ring-[#0f766e]/15";

export default function SalesLoginForm() {
  const [state, formAction, isPending] = useActionState(salesLogin, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      {/* Ids are prefixed because this form now shares a page with the catalog
          sign-in — duplicate ids would point both labels at the same input. */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sales-username" className="text-sm font-medium text-[var(--ink-soft)]">
          Username
        </label>
        <input
          id="sales-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className={inputClass}
          placeholder="your.username"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sales-password" className="text-sm font-medium text-[var(--ink-soft)]">
          Password
        </label>
        <input
          id="sales-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-xl bg-[#0f766e] px-4 py-3 font-semibold text-white transition hover:bg-[#115e59] disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in to sales"}
      </button>
    </form>
  );
}
