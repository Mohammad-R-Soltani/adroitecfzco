import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fetchDevicePage, parseSpecs, num } from "./gsmarena.mjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// deviceSlug -> GSMArena page URL. Curated from a manual GSMArena search per
// device (see conversation) so every match is verified, not guessed.
const SOURCES = {
  "iphone-17-pro-max": "https://www.gsmarena.com/apple_iphone_17_pro_max-13964.php",
  "iphone-17-pro": "https://www.gsmarena.com/apple_iphone_17_pro-14049.php",
  "iphone-17": "https://www.gsmarena.com/apple_iphone_17-14050.php",
  "iphone-air": "https://www.gsmarena.com/apple_iphone_17_air-13502.php",
  "iphone-16-pro-max": "https://www.gsmarena.com/apple_iphone_16_pro_max-13123.php",
  "iphone-16-pro": "https://www.gsmarena.com/apple_iphone_16_pro-13315.php",
  "iphone-16": "https://www.gsmarena.com/apple_iphone_16-13317.php",
  "iphone-16-plus": "https://www.gsmarena.com/apple_iphone_16_plus-13316.php",
  "iphone-16e": "https://www.gsmarena.com/apple_iphone_16e-13395.php",
  "ipad-pro-m5": "https://www.gsmarena.com/apple_ipad_pro_11_5g_(2025)-14234.php",
  "ipad-pro-m4": "https://www.gsmarena.com/apple_ipad_pro_11_(2024)-12986.php",

  "xiaomi-17": "https://www.gsmarena.com/xiaomi_17_5g-14134.php",
  "xiaomi-17-pro": "https://www.gsmarena.com/xiaomi_17_pro_5g-14182.php",
  "xiaomi-17-pro-max": "https://www.gsmarena.com/xiaomi_17_pro_max_5g-14181.php",
  "xiaomi-15s-pro": "https://www.gsmarena.com/xiaomi_15s_pro_5g-13895.php",
  "xiaomi-15": "https://www.gsmarena.com/xiaomi_15-13472.php",
  "xiaomi-15-pro": "https://www.gsmarena.com/xiaomi_15_pro-13473.php",
  "xiaomi-15-ultra": "https://www.gsmarena.com/xiaomi_15_ultra-13657.php",
  "xiaomi-pad-7-ultra": "https://www.gsmarena.com/xiaomi_pad_7_ultra-13896.php",
  "redmi-k80-pro": "https://www.gsmarena.com/xiaomi_redmi_k80_pro-13524.php",
  "redmi-turbo-4": "https://www.gsmarena.com/xiaomi_redmi_turbo_4-13598.php",
  "poco-x7-pro": "https://www.gsmarena.com/xiaomi_poco_x7_pro-13582.php",

  "galaxy-s25": "https://www.gsmarena.com/samsung_galaxy_s25-13610.php",
  "galaxy-s25-plus": "https://www.gsmarena.com/samsung_galaxy_s25_plus-13609.php",
  "galaxy-s25-ultra": "https://www.gsmarena.com/samsung_galaxy_s25_ultra-13322.php",
  "galaxy-z-fold7": "https://www.gsmarena.com/samsung_galaxy_z_fold7-13826.php",
  "galaxy-z-flip7": "https://www.gsmarena.com/samsung_galaxy_z_flip7-13712.php",
  "galaxy-watch8": "https://www.gsmarena.com/samsung_galaxy_watch8-13997.php",
  "galaxy-watch-ultra-2025": "https://www.gsmarena.com/samsung_galaxy_watch_ultra-13127.php",
};

function pick(section, ...keys) {
  if (!section) return null;
  for (const k of keys) {
    if (section[k]) return section[k];
  }
  return null;
}

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
  const mainCamModules = pick(mainCam, "Triple", "Dual", "Quad", "Single");
  const selfieCamModules = pick(selfieCam, "Single", "Dual");

  return {
    networkTechnology: pick(network, "Technology"),
    network2g: pick(network, "2G bands"),
    network3g: pick(network, "3G bands"),
    network4g: pick(network, "4G bands"),
    network5g: pick(network, "5G bands"),
    networkSpeed: pick(network, "Speed"),

    announced: pick(launch, "Announced"),
    status: pick(launch, "Status"),

    dimensions: pick(body, "Dimensions"),
    weight,
    build: pick(body, "Build"),
    sim: pick(body, "SIM"),
    bodyExtra: body?.[" "] ?? null,

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
    price: pick(misc, "Price"),

    displayInches: num(/([\d.]+)\s*inches/i, displaySize),
    // Skip PWM dimming-frequency figures (e.g. "2160Hz PWM") — not the screen's
    // actual refresh rate, which is always <=180.
    refreshRateHz: (() => {
      const text = pick(display, "Type") || "";
      const re = /(\d{2,3})\s*Hz(?!\s*PWM)/gi;
      let m;
      while ((m = re.exec(text))) {
        const val = parseInt(m[1], 10);
        if (val <= 180) return val;
      }
      return null;
    })(),
    batteryMah: num(/([\d,]+)\s*mAh/i, batteryType)
      ? parseFloat(String(num(/([\d,]+)\s*mAh/i, batteryType)).replace(/,/g, ""))
      : num(/([\d,]+)\s*mAh/i, (batteryType || "").replace(/,/g, "")),
    chargingWatts: num(/(\d+)W\s*(wired)?/i, charging),
    mainCameraMp: num(/([\d.]+)\s*MP/i, mainCamModules),
    selfieCameraMp: num(/([\d.]+)\s*MP/i, selfieCamModules),
    weightGrams: num(/([\d.]+)\s*g\b/i, weight),

    sourceName: "GSMArena",
    sourceUrl,
  };
}

async function main() {
  const entries = Object.entries(SOURCES);
  let ok = 0;
  let failed = [];

  for (const [slug, url] of entries) {
    try {
      const device = await prisma.device.findUnique({ where: { slug } });
      if (!device) {
        console.log(`! no device in DB for slug "${slug}", skipping`);
        continue;
      }

      const html = await fetchDevicePage(url);
      const sections = parseSpecs(html);
      const data = mapToSpec(sections, url);

      // batteryMah regex above is clumsy with the comma-stripped string; redo cleanly.
      const mahMatch = (data.batteryType || "").replace(/,/g, "").match(/(\d{3,6})\s*mAh/i);
      data.batteryMah = mahMatch ? parseInt(mahMatch[1], 10) : null;

      await prisma.deviceSpec.upsert({
        where: { deviceId: device.id },
        update: { deviceId: device.id, ...data },
        create: { deviceId: device.id, ...data },
      });

      ok++;
      console.log(`✓ ${slug}`);
    } catch (e) {
      failed.push(slug);
      console.log(`✗ ${slug}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 900));
  }

  console.log(`\n${ok}/${entries.length} device specs imported.`);
  if (failed.length) console.log("Failed:", failed.join(", "));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
