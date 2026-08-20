import Link from "next/link";
import { requireAdmin } from "@/lib/dal";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto mb-8 flex max-w-3xl items-center gap-2">
        <h1 className="font-display mr-4 text-2xl font-semibold text-[var(--ink)]">Admin</h1>
        <Link
          href="/admin/users"
          className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
        >
          Users
        </Link>
        <Link
          href="/admin/chipsets"
          className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
        >
          Chipsets
        </Link>
      </div>
      {children}
    </main>
  );
}
