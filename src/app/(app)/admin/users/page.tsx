import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import CreateUserForm from "./CreateUserForm";
import { toggleUserActive } from "./actions";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <CreateUserForm />

      <div className="surface-card overflow-hidden rounded-2xl border border-[var(--line)] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--mist)] text-[var(--ink-soft)]">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--ink)]">{user.displayName}</p>
                  <p className="text-xs text-[var(--ink-faint)]">@{user.username}</p>
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">{user.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-[var(--mist)] text-[var(--ink-faint)]"
                    }`}
                  >
                    {user.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {user.id !== admin.id && (
                    <form action={toggleUserActive.bind(null, user.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-[var(--ink-faint)] underline underline-offset-4 hover:text-[var(--signal)]"
                      >
                        {user.isActive ? "Disable" : "Enable"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
