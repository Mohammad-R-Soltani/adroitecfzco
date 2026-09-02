import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Read the .env file directly (not process.env) so this still finds the
// LOCAL database URL even when the shell's DATABASE_URL has been
// temporarily overridden to point at the target (e.g. Render) database.
const LOCAL_URL = parse(readFileSync(new URL("../.env", import.meta.url))).DATABASE_URL;
const TARGET_URL = process.env.DATABASE_URL;

if (!LOCAL_URL) {
  throw new Error("Could not read DATABASE_URL from .env for the local source database.");
}

if (!TARGET_URL) {
  throw new Error("DATABASE_URL is not set — this should be your Render external connection string.");
}
if (TARGET_URL.includes("localhost")) {
  throw new Error("DATABASE_URL points at localhost — set it to the Render external URL before running this script.");
}

const local = new PrismaClient({ adapter: new PrismaPg({ connectionString: LOCAL_URL }) });
const target = new PrismaClient({ adapter: new PrismaPg({ connectionString: TARGET_URL }) });

const targetDevices = await target.device.findMany({ select: { id: true, slug: true } });
const targetIdBySlug = new Map(targetDevices.map((d) => [d.slug, d.id]));

// ---- DeviceSpec ----
const specs = await local.deviceSpec.findMany({
  include: { device: { select: { slug: true } } },
});

let specsSynced = 0;
let specsSkipped = 0;
for (const s of specs) {
  const targetDeviceId = targetIdBySlug.get(s.device.slug);
  if (!targetDeviceId) {
    console.log(`  skip spec for "${s.device.slug}" — device not found on target`);
    specsSkipped++;
    continue;
  }
  const { id, deviceId, device, ...fields } = s;
  await target.deviceSpec.upsert({
    where: { deviceId: targetDeviceId },
    update: fields,
    create: { deviceId: targetDeviceId, ...fields },
  });
  specsSynced++;
}
console.log(`DeviceSpec: synced ${specsSynced}, skipped ${specsSkipped}`);

// ---- DeviceBenchmark ----
const benchmarks = await local.deviceBenchmark.findMany({
  include: { device: { select: { slug: true } } },
});

let benchSynced = 0;
let benchSkipped = 0;
for (const b of benchmarks) {
  const targetDeviceId = targetIdBySlug.get(b.device.slug);
  if (!targetDeviceId) {
    benchSkipped++;
    continue;
  }
  const { id, deviceId, device, researchedAt, ...fields } = b;
  await target.deviceBenchmark.upsert({
    where: {
      deviceId_family_metric_sourceUrl: {
        deviceId: targetDeviceId,
        family: b.family,
        metric: b.metric,
        sourceUrl: b.sourceUrl,
      },
    },
    update: fields,
    create: { deviceId: targetDeviceId, ...fields },
  });
  benchSynced++;
}
console.log(`DeviceBenchmark: synced ${benchSynced}, skipped ${benchSkipped}`);

console.log("Done.");
