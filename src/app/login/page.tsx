import LoginForm from "./LoginForm";
import Logomark from "@/components/Logomark";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--mist)] px-6">
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, #5ac8fa, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--signal), transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-[var(--line)] bg-white/90 p-8 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Logomark size={44} />
          <h1 className="font-display text-xl font-semibold text-[var(--ink)]">adroitecfzco</h1>
          <p className="text-sm text-[var(--ink-soft)]">Product knowledge for the trading desk</p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
