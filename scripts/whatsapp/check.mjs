import path from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "auth");

const targetNumber = process.argv[2];
if (!targetNumber) {
  console.error('Usage: node scripts/whatsapp/check.mjs "<phone number, no +>"');
  process.exit(1);
}

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const sock = makeWASocket({ auth: state, logger: pino({ level: "silent" }) });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;
    if (connection === "open") {
      console.log("CONNECTED as", sock.user?.id);
      try {
        const result = await sock.onWhatsApp(targetNumber);
        console.log("onWhatsApp result:", JSON.stringify(result, null, 2));
      } catch (err) {
        console.error("CHECK_FAILED:", err);
      } finally {
        sock.end(undefined);
        process.exit(0);
      }
    }
  });
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
