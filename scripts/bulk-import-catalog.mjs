import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  fetchDevicePage,
  parseSpecs,
  parseTitle,
  parseImage,
  parsePerformanceLine,
  normalizeChipsetName,
  parseProcessNode,
  num,
} from "./gsmarena.mjs";
import { listBrandDevices } from "./gsmarena-list.mjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MIN_YEAR = Number(process.env.MIN_YEAR ?? 2023);
const ONLY_BRAND = process.env.ONLY_BRAND ?? null;
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null;
const FORCE = process.env.FORCE === "1";
const DEVICE_DELAY_MS = Number(process.env.DEVICE_DELAY_MS ?? 2500);

const BRANDS = [
  { slug: "apple", listUrl: "https://www.gsmarena.com/apple-phones-48.php", gradient: ["#1d1d1f", "#0071e3"] },
  { slug: "samsung", listUrl: "https://www.gsmarena.com/samsung-phones-9.php", gradient: ["#0a1a3d", "#1428A0"] },
  { slug: "xiaomi", listUrl: "https://www.gsmarena.com/xiaomi-phones-80.php", gradient: ["#3a1a0a", "#FF6900"] },
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/["”″]/g, "")
    .replace(/\(|\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pick(section, ...keys) {
  if (!section) return null;
  for (const k of keys) if (section[k]) return section[k];
  return null;
}

/** Maps GSMArena's parsed sections onto our DeviceSpec columns. */
function mapToSpec(sections, sourceUrl) {
  const network = sections["Network"];
  const launch = sections["Launch"];
  const body = sections["Body"];
  const display = sections["Display"];
  const platform = sections["Platform"];
  const memory = sections["Memory"];
  const mainCam = sections["Main Camera"];
  const selfieCam = sections["Selfie camera"] || sections["Selfie Camera"];
  const sound = sections["Sound"];
  const comms = sections["Comms"];
  const features = sections["Features"];
  const battery = sections["Battery"];
  const misc = sections["Misc"];

  const displaySize = pick(display, "Size");
  const batteryType = pick(battery, "Type");
  const charging = pick(battery, "Charging");
  const weight = pick(body, "Weight");
  const mainCamModules = pick(mainCam, "Triple", "Dual", "Quad", "Single", "Five");
  const selfieCamModules = pick(selfieCam, "Single", "Dual");
  const dimensions = pick(body, "Dimensions");
  const price = pick(misc, "Price");

  const dims = dimensions?.match(/([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)\s*mm/i);
  const mah = (batteryType || "").replace(/,/g, "").match(/(\d{3,6})\s*mAh/i);

  // PWM dimming frequencies ("2160Hz PWM") are not refresh rates — a real panel
  // refresh is <=180Hz, so anything above that is ignored.
  let refreshRateHz = null;
  const refreshRe = /(\d{2,3})\s*Hz(?!\s*PWM)/gi;
  const displayType = pick(display, "Type") || "";
  let rm;
  while ((rm = refreshRe.exec(displayType))) {
    const v = parseInt(rm[1], 10);
    if (v <= 180) {
      refreshRateHz = v;
      break;
    }
  }

  const eurMatch = price?.match(/€\s*([\d,]+(?:\.\d+)?)/) ?? price?.match(/([\d,]+(?:\.\d+)?)\s*EUR/i);

  return {
    networkTechnology: pick(network, "Technology"),
    network2g: pick(network, "2G bands"),
    network3g: pick(network, "3G bands"),
    network4g: pick(network, "4G bands"),
    network5g: pick(network, "5G bands"),
    networkSpeed: pick(network, "Speed"),
    announced: pick(launch, "Announced"),
    status: pick(launch, "Status"),
    dimensions,
    weight,
    build: pick(body, "Build"),
    sim: pick(body, "SIM"),
    displayType: pick(display, "Type"),
    displaySize,
    displayResolution: pick(display, "Resolution"),
    displayProtection: pick(display, "Protection"),
    os: pick(platform, "OS"),
    cpu: pick(platform, "CPU"),
    gpu: pick(platform, "GPU"),
    cardSlot: pick(memory, "Card slot"),
    internalStorage: pick(memory, "Internal"),
    mainCameraModules: mainCamModules,
    mainCameraFeatures: pick(mainCam, "Features"),
    mainCameraVideo: pick(mainCam, "Video"),
    selfieCameraModules: selfieCamModules,
    selfieCameraFeatures: pick(selfieCam, "Features"),
    selfieCameraVideo: pick(selfieCam, "Video"),
    loudspeaker: pick(sound, "Loudspeaker"),
    jack35mm: pick(sound, "3.5mm jack"),
    wlan: pick(comms, "WLAN"),
    bluetooth: pick(comms, "Bluetooth"),
    positioning: pick(comms, "Positioning"),
    nfc: pick(comms, "NFC"),
    infraredPort: pick(comms, "Infrared port"),
    radio: pick(comms, "Radio"),
    usb: pick(comms, "USB"),
    sensors: pick(features, "Sensors"),
    batteryType,
    charging,
    colors: pick(misc, "Colors"),
    models: pick(misc, "Models"),
    sar: pick(misc, "SAR"),
    sarEu: pick(misc, "SAR EU"),
    price,
    priceEur: eurMatch ? Number(eurMatch[1].replace(/,/g, "")) : null,
    displayInches: num(/([\d.]+)\s*inches/i, displaySize),
    refreshRateHz,
    batteryMah: mah ? parseInt(mah[1], 10) : null,
    chargingWatts: num(/(\d+(?:\.\d+)?)W\b/i, charging),
    mainCameraMp: num(/([\d.]+)\s*MP/i, mainCamModules),
    selfieCameraMp: num(/([\d.]+)\s*MP/i, selfieCamModules),
    weightGrams: num(/([\d.]+)\s*g\b/i, weight),
    heightMm: dims ? Number(dims[1]) : null,
    widthMm: dims ? Number(dims[2]) : null,
    thicknessMm: dims ? Number(dims[3]) : null,
    sourceName: "GSMArena",
    sourceUrl,
  };
}

/** Release date from "Released 2024, January 24", falling back to the announcement. */
function parseReleaseDate(launch) {
  const status = pick(launch, "Status") || "";
  const announced = pick(launch, "Announced") || "";
  const rel = status.match(/Released\s+(\d{4}),\s*(\w+)(?:\s+(\d{1,2}))?/i);
  const ann = announced.match(/(\d{4}),\s*(\w+)(?:\s+(\d{1,2}))?/);
  const m = rel ?? ann;
  if (!m) return null;
  const date = new Date(`${m[2]} ${m[3] ?? 1}, ${m[1]} UTC`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function findOrCreateChipset(brand, chipsetRaw, spec) {
  const name = normalizeChipsetName(chipsetRaw);
  if (!name) return null;

  const existing = await prisma.chipset.findUnique({
    where: { brandId_name: { brandId: brand.id, name } },
  });
  if (existing) return existing;

  // Created from the device page's own Platform section. No competitive-edge
  // claim is invented here — that stays null until it is researched and
  // sourced, and the UI shows "not documented yet" in the meantime.
  const series =
    /snapdragon/i.test(name) ? "Snapdragon"
    : /dimensity|helio/i.test(name) ? "MediaTek Dimensity"
    : /exynos/i.test(name) ? "Exynos"
    : /^A\d+/i.test(name) ? "A-series"
    : /^M\d+/i.test(name) ? "M-series"
    : /xring/i.test(name) ? "XRing"
    : /tensor/i.test(name) ? "Tensor"
    : "Other";

  return prisma.chipset.create({
    data: {
      slug: `${brand.slug}-${slugify(name)}`,
      brandId: brand.id,
      name,
      series,
      kind: "MOBILE_SOC",
      releaseYear: new Date().getFullYear(),
      processNode: parseProcessNode(chipsetRaw) ?? "Not published",
      cpuSummary: spec.cpu ?? "Not published",
      gpuSummary: spec.gpu ?? "Not published",
      highlight: `Imported from device spec sheets — ${name}.`,
      gradientFrom: BRAND_GRADIENTS[brand.slug]?.[0] ?? "#1d1d1f",
      gradientTo: BRAND_GRADIENTS[brand.slug]?.[1] ?? "#0071e3",
      sourceNote: "Chipset identity taken from GSMArena device spec sheets; not yet independently researched.",
    },
  });
}

const BRAND_GRADIENTS = Object.fromEntries(BRANDS.map((b) => [b.slug, b.gradient]));

async function importDevice(brand, stub) {
  // Resumable: a device already imported from this exact page is left alone,
  // so the run can be stopped and restarted without re-fetching everything.
  // GSMArena rate-limits hard, and re-fetching is what triggers it.
  if (!FORCE) {
    const already = await prisma.deviceSpec.findFirst({
      where: { sourceUrl: stub.url },
      select: { device: { select: { name: true } } },
    });
    if (already) return { alreadyDone: true, title: already.device.name };
  }

  const html = await fetchDevicePage(stub.url);
  const sections = parseSpecs(html);
  const title = parseTitle(html) ?? stub.name;
  const platform = sections["Platform"];
  const chipsetRaw = pick(platform, "Chipset");

  const spec = mapToSpec(sections, stub.url);
  const chipset = await findOrCreateChipset(brand, chipsetRaw, spec);
  if (!chipset) return { skipped: `no chipset listed (${title})` };

  const releaseDate = parseReleaseDate(sections["Launch"]);
  if (!releaseDate) return { skipped: `no release date (${title})` };

  // GSMArena titles carry the maker's name ("Apple iPhone 17e"); the catalog's
  // hand-curated entries don't, and the brand is already shown beside every
  // device, so it is stripped for consistency — except where the brand word is
  // genuinely part of the product name ("Apple Watch", "Xiaomi Pad").
  const KEEPS_BRAND = /^(Apple|Samsung|Xiaomi)\s+(Watch|Pad|Buds|Book)\b/i;
  const displayName = KEEPS_BRAND.test(title)
    ? title
    : title.replace(/^(Apple|Samsung|Xiaomi)\s+/i, "");
  const slug = slugify(displayName);
  const image = parseImage(html) ?? stub.image;

  const existing = await prisma.device.findUnique({ where: { slug } });

  const device = await prisma.device.upsert({
    where: { slug },
    update: {
      chipsetId: chipset.id,
      name: displayName,
      category: stub.category ?? "PHONE",
      releaseDate,
      // An image already on file (e.g. a properly-licensed Wikimedia photo from
      // the original seed) is never overwritten.
      ...(existing?.imageUrl ? {} : { imageUrl: image }),
    },
    create: {
      slug,
      chipsetId: chipset.id,
      name: displayName,
      category: stub.category ?? "PHONE",
      releaseDate,
      imageUrl: image,
    },
  });

  await prisma.deviceSpec.upsert({
    where: { deviceId: device.id },
    update: spec,
    create: { deviceId: device.id, ...spec },
  });

  const benchmarks = parsePerformanceLine(pick(sections["Our Tests"], "Performance"));
  for (const b of benchmarks) {
    await prisma.deviceBenchmark.upsert({
      where: {
        deviceId_family_metric_sourceUrl: {
          deviceId: device.id,
          family: b.family,
          metric: b.metric,
          sourceUrl: stub.url,
        },
      },
      update: { value: b.value, sourceName: "GSMArena" },
      create: {
        deviceId: device.id,
        family: b.family,
        metric: b.metric,
        value: b.value,
        sourceName: "GSMArena",
        sourceUrl: stub.url,
      },
    });
  }

  return { ok: true, title, slug, chipset: chipset.name, benchmarks: benchmarks.length, created: !existing };
}

async function main() {
  const targets = ONLY_BRAND ? BRANDS.filter((b) => b.slug === ONLY_BRAND) : BRANDS;

  for (const brandDef of targets) {
    const brand = await prisma.brand.findUnique({ where: { slug: brandDef.slug } });
    if (!brand) {
      console.log(`! brand ${brandDef.slug} not in database, skipping`);
      continue;
    }

    console.log(`\n=== ${brand.name}: listing devices from ${MIN_YEAR} ===`);
    let stubs = await listBrandDevices(brandDef.listUrl, { minYear: MIN_YEAR });
    if (LIMIT) stubs = stubs.slice(0, LIMIT);
    console.log(`${stubs.length} devices to import\n`);

    let created = 0;
    let updated = 0;
    let alreadyDone = 0;
    const skipped = [];

    for (const [i, stub] of stubs.entries()) {
      try {
        const res = await importDevice(brand, stub);
        if (res.alreadyDone) {
          alreadyDone++;
          continue;
        }
        if (res.skipped) {
          skipped.push(res.skipped);
          console.log(`  [${i + 1}/${stubs.length}] skip — ${res.skipped}`);
        } else {
          if (res.created) created++;
          else updated++;
          console.log(
            `  [${i + 1}/${stubs.length}] ${res.created ? "new " : "upd "} ${res.title} · ${res.chipset}${res.benchmarks ? ` · ${res.benchmarks} benchmark(s)` : ""}`,
          );
        }
      } catch (err) {
        skipped.push(`${stub.name}: ${err.message}`);
        console.log(`  [${i + 1}/${stubs.length}] FAIL ${stub.name}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, DEVICE_DELAY_MS));
    }

    console.log(
      `\n${brand.name}: ${created} new, ${updated} updated, ${alreadyDone} already imported, ${skipped.length} skipped`,
    );
    if (skipped.length) skipped.forEach((s) => console.log(`   - ${s}`));
  }

  await prisma.$disconnect();
}

await main();
