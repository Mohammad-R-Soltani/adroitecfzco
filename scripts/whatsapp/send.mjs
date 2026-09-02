// Test-only WhatsApp sender using an unofficial library (Baileys), which
// automates a real WhatsApp Web session. Not for production notifications —
// see the official WhatsApp Business Cloud API for that. Session credentials
// are saved under scripts/whatsapp/auth/ (gitignored) so you only scan the QR
// once.
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import pino from "pino";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "auth");
const QR_PATH = path.join(__dirname, "qr.png");

const [targetNumber, ...messageParts] = process.argv.slice(2);
const message = messageParts.join(" ");

if (!targetNumber || !message) {
  console.error('Usage: node scripts/whatsapp/send.mjs "<phone number with country code, no +>" "<message text>"');
  process.exit(1);
}

const jid = `${targetNumber.replace(/\D/g, "")}@s.whatsapp.net`;

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      await QRCode.toFile(QR_PATH, qr);
      console.log(`QR_READY:${QR_PATH}`);
    }

    if (connection === "open") {
      console.log("CONNECTED");
      try {
        await sock.sendMessage(jid, { text: message });
        console.log(`SENT:${jid}`);
      } catch (err) {
        console.error("SEND_FAILED:", err);
      } finally {
        sock.end(undefined);
        process.exit(0);
      }
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`CLOSED:${statusCode}:reconnect=${shouldReconnect}`);
      if (shouldReconnect) {
        connect().catch((err) => {
          console.error("FATAL:", err);
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    }
  });
}

connect().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
