/**
 * Runs once when the Next.js server process boots. Keeps the header ticker's
 * numbers fresh without depending on any visitor's browser or an external
 * cron service — this process is already long-running, so an interval here
 * is the whole scheduler.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { refreshMarketPrices } = await import("@/lib/marketData");

  const REFRESH_MS = 150_000; // 2.5 minutes

  const tick = () => {
    refreshMarketPrices().catch((err) => console.error("[marketData] refresh failed:", err));
  };

  tick();
  setInterval(tick, REFRESH_MS);
}
