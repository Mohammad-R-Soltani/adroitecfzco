"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import AssistantBot from "./AssistantBot";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Which chipset is fastest right now?",
  "A19 Pro vs Snapdragon 8 Elite Gen 5 — how do I pitch the difference?",
  "What's the story on Xiaomi's own XRing O1?",
];

export default function Assistant({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Couldn't reach the assistant. Check your connection.");
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open assistant"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", damping: 18, stiffness: 300 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--signal)] text-white shadow-lg shadow-[var(--signal)]/25 transition hover:bg-[var(--signal-deep)] sm:bottom-6 sm:right-6"
      >
        <AssistantBot size={30} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-end sm:p-6">
            <motion.button
              type="button"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm sm:bg-[var(--ink)]/25"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="relative flex h-[85dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[600px] sm:max-h-[80dvh] sm:w-[400px] sm:rounded-3xl"
            >
              <header className="flex shrink-0 items-center justify-between border-b border-[var(--line)] bg-gradient-to-r from-[var(--signal)] to-[#3a9bff] px-4 py-3.5 text-white">
                <div className="flex items-center gap-2.5">
                  <AssistantBot size={30} />
                  <div>
                    <p className="font-display text-sm font-semibold leading-tight">Product desk</p>
                    <p className="text-[11px] text-white/70">Answers from your catalog</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </header>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="text-[var(--signal)]">
                      <AssistantBot size={64} />
                    </div>
                    <div>
                      <p className="font-display text-base font-semibold text-[var(--ink)]">
                        Hi {userName.split(" ")[0]} — what are you quoting today?
                      </p>
                      <p className="mt-1 px-4 text-sm text-[var(--ink-soft)]">
                        Ask about any chipset or device in the catalog and I&apos;ll give you the detail you need to brief a buyer.
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 px-2">
                      {STARTERS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="rounded-xl border border-[var(--line)] bg-[var(--mist)] px-3 py-2.5 text-left text-sm text-[var(--ink-soft)] transition hover:border-[var(--signal)]/40 hover:bg-white hover:text-[var(--signal)]"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "rounded-br-md bg-[var(--signal)] text-white"
                          : "rounded-bl-md bg-[var(--mist)] text-[var(--ink)]"
                      }`}
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))}

                {pending && (
                  <div className="flex justify-start">
                    <div className="flex gap-1.5 rounded-2xl rounded-bl-md bg-[var(--mist)] px-4 py-3.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-[var(--ink-faint)]"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">{error}</p>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex shrink-0 items-center gap-2 border-t border-[var(--line)] bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question…"
                  className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--mist)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none transition focus:border-[var(--signal)] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={pending || !input.trim()}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--signal)] text-white transition hover:bg-[var(--signal-deep)] disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path
                      d="M4 12l16-8-6 8 6 8-16-8z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
