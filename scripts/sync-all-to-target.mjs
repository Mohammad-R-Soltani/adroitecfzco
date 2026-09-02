import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Copies the whole catalog from the local database to whatever DATABASE_URL
 * points at (i.e. Render). Everything is matched by slug and upserted, so the
 * script is safe to re-run and never deletes anything on the target.
 *
 * Order matters: brands → chipsets → devices → the rows that hang off devices.
 */

// Read .env directly for the LOCAL source, because the shell's DATABASE_URL is
// deliberately overridden to point at the target when this runs.
const LOCAL_URL = parse(readFileSync(new URL("../.env", import.meta.url))).DATABASE_URL;
const TARGET_URL = process.env.DATABASE_URL;

if (!LOCAL_URL) throw new Error("Could not read DATABASE_URL from .env for the local source.");
if (!TARGET_URL) throw new Error("DATABASE_URL is not set — point it at the target database.");
if (TARGET_URL.includes("localhost")) {
  throw new Error("DATABASE_URL points at localhost — set it to the target (Render) URL.");
}

const local = new PrismaClient({ adapter: new PrismaPg({ connectionString: LOCAL_URL }) });
const target = new PrismaClient({ adapter: new PrismaPg({ connectionString: TARGET_URL }) });

const count = { brands: 0, chipsets: 0, devices: 0, specs: 0, benchmarks: 0, domains: 0, sources: 0 };

// ---------------------------------------------------------------- brands
for (const brand of await local.brand.findMany()) {
  const { id, ...data } = brand;
  await target.brand.upsert({ where: { slug: brand.slug }, update: data, create: data });
  count.brands++;
}
const targetBrandBySlug = new Map((await target.brand.findMany()).map((b) => [b.slug, b.id]));

// -------------------------------------------------------------- chipsets
const localChipsets = await local.chipset.findMany({ include: { brand: { select: { slug: true } } } });
for (const chipset of localChipsets) {
  const { id, brandId, brand, createdAt, updatedAt, ...data } = chipset;
  const targetBrandId = targetBrandBySlug.get(brand.slug);
  if (!targetBrandId) {
    console.log(`  ! no brand ${brand.slug} on target, skipping chipset ${chipset.slug}`);
    continue;
  }
  await target.chipset.upsert({
    where: { slug: chipset.slug },
    update: { ...data, brandId: targetBrandId },
    create: { ...data, brandId: targetBrandId },
  });
  count.chipsets++;
}
const targetChipsetBySlug = new Map((await target.chipset.findMany()).map((c) => [c.slug, c.id]));
const localChipsetSlugById = new Map(localChipsets.map((c) => [c.id, c.slug]));

// --------------------------------------------------------------- devices
const localDevices = await local.device.findMany({ include: { chipset: { select: { slug: true } } } });
for (const device of localDevices) {
  const { id, chipsetId, chipset, ...data } = device;
  const targetChipsetId = targetChipsetBySlug.get(chipset.slug);
  if (!targetChipsetId) {
    console.log(`  ! no chipset ${chipset.slug} on target, skipping device ${device.slug}`);
    continue;
  }
  await target.device.upsert({
    where: { slug: device.slug },
    update: { ...data, chipsetId: targetChipsetId },
    create: { ...data, chipsetId: targetChipsetId },
  });
  count.devices++;
}
const targetDeviceBySlug = new Map((await target.device.findMany()).map((d) => [d.slug, d.id]));

// ----------------------------------------------------------- device spec
for (const spec of await local.deviceSpec.findMany({ include: { device: { select: { slug: true } } } })) {
  const { id, deviceId, device, updatedAt, ...data } = spec;
  const targetDeviceId = targetDeviceBySlug.get(device.slug);
  if (!targetDeviceId) continue;
  await target.deviceSpec.upsert({
    where: { deviceId: targetDeviceId },
    update: data,
    create: { ...data, deviceId: targetDeviceId },
  });
  count.specs++;
}

// ------------------------------------------------------------ benchmarks
for (const b of await local.deviceBenchmark.findMany({ include: { device: { select: { slug: true } } } })) {
  const { id, deviceId, device, researchedAt, ...data } = b;
  const targetDeviceId = targetDeviceBySlug.get(device.slug);
  if (!targetDeviceId) continue;
  await target.deviceBenchmark.upsert({
    where: {
      deviceId_family_metric_sourceUrl: {
        deviceId: targetDeviceId,
        family: b.family,
        metric: b.metric,
        sourceUrl: b.sourceUrl,
      },
    },
    update: data,
    create: { ...data, deviceId: targetDeviceId },
  });
  count.benchmarks++;
}

// ------------------------------------------------------ chipset extras
for (const s of await local.chipsetSpecSource.findMany()) {
  const { id, chipsetId, fetchedAt, ...data } = s;
  const targetChipsetId = targetChipsetBySlug.get(localChipsetSlugById.get(chipsetId));
  if (!targetChipsetId) continue;
  await target.chipsetSpecSource.upsert({
    where: { chipsetId_sourceUrl: { chipsetId: targetChipsetId, sourceUrl: s.sourceUrl } },
    update: data,
    create: { ...data, chipsetId: targetChipsetId },
  });
  count.sources++;
}

for (const d of await local.chipsetDomainStrength.findMany()) {
  const { id, chipsetId, ...data } = d;
  const targetChipsetId = targetChipsetBySlug.get(localChipsetSlugById.get(chipsetId));
  if (!targetChipsetId) continue;
  await target.chipsetDomainStrength.upsert({
    where: { chipsetId_domain: { chipsetId: targetChipsetId, domain: d.domain } },
    update: data,
    create: { ...data, chipsetId: targetChipsetId },
  });
  count.domains++;
}

console.log("\nSynced to target:");
for (const [key, value] of Object.entries(count)) {
  console.log(`  ${key.padEnd(12)} ${value}`);
}

await local.$disconnect();
await target.$disconnect();
