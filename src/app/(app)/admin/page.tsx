import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [userCount, chipsetCount, deviceCount, bookmarkCount] = await Promise.all([
    prisma.user.count(),
    prisma.chipset.count(),
    prisma.device.count(),
    prisma.bookmark.count(),
  ]);

  const stats = [
    { label: "Users", value: userCount, href: "/admin/users" },
    { label: "Chipsets", value: chipsetCount, href: "/admin/chipsets" },
    { label: "Devices", value: deviceCount, href: "/admin/chipsets" },
    { label: "Saved by staff", value: bookmarkCount, href: null },
  ];

  return (
    <div className="mx-auto max-w-3xl grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const card = (
          <div className="surface-card rounded-2xl border border-[var(--line)] p-5 shadow-sm">
            <p className="spec-value text-3xl font-semibold text-[var(--ink)]">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-[var(--ink-soft)]">{stat.label}</p>
          </div>
        );
        return stat.href ? (
          <Link key={stat.label} href={stat.href}>
            {card}
          </Link>
        ) : (
          <div key={stat.label}>{card}</div>
        );
      })}
    </div>
  );
}
