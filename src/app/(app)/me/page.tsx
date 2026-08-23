import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/dal";

export default async function MePage() {
  const user = await requireUser();

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      chipset: {
        include: {
          brand: { select: { name: true, accent: true } },
        },
      },
    },
  });

  return (
    <main className="min-h-dvh px-4 pb-16 pt-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--signal)] to-[var(--glow)] text-2xl font-semibold text-white">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">{user.displayName}</h1>
            <p className="text-sm text-[var(--ink-soft)]">
              @{user.username} · {user.role === "ADMIN" ? "Administrator" : "Team member"}
            </p>
          </div>
        </div>

        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--ink-faint)]">
          Saved chipsets ({bookmarks.length})
        </h2>

        {bookmarks.length === 0 ? (
          <div className="surface-card rounded-2xl border border-[var(--line)] p-8 text-center text-[var(--ink-soft)] shadow-sm">
            You haven&apos;t saved any chipsets yet. Tap the heart icon on any chipset card in the{" "}
            <Link href="/" className="text-[var(--signal)] underline underline-offset-4">
              feed
            </Link>{" "}
            to save one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {bookmarks.map((b) => (
              <Link
                href={`/chipsets/${b.chipset.slug}`}
                key={b.id}
                className="surface-card rounded-2xl border border-[var(--line)] p-4 shadow-sm transition hover:border-[var(--signal)]/40 hover:shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${b.chipset.gradientFrom}14, white)`,
                }}
              >
                <p className="text-xs font-medium text-[var(--ink-soft)]">
                  {b.chipset.brand.name} · {b.chipset.releaseYear}
                </p>
                <p className="font-display mt-1 text-lg font-semibold text-[var(--ink)]">
                  {b.chipset.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
