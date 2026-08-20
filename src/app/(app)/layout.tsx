import { requireUser } from "@/lib/dal";
import NavBar from "@/components/NavBar";
import Assistant from "@/components/Assistant";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <NavBar displayName={user.displayName} role={user.role} jobTitle={user.jobTitle} />
      {children}
      <Assistant userName={user.displayName} />
    </div>
  );
}
