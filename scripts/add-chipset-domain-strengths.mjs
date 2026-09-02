import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Each row is one published claim, with the outlet that made it. A chip gets a
// row only where a named source actually says something about that workload —
// no row is inferred from a chip merely being new or expensive, and there is
// no "weak" level, so a blank cell means "nothing published", not "bad".
const STRENGTHS = {
  "apple-a19-pro": [
    ["RAY_TRACING", "LEADING", "Scores 2,411 on Solar Bay Extreme vs 1,612 for the A18 Pro — about 50% higher ray-tracing throughput.", "Notebookcheck", "https://www.notebookcheck.net/Apple-A19-Pro-hands-on-GPU-benchmarks-show-40-upgrade-versus-A18-Pro-but-the-Snapdragon-8-Elite-is-hardly-inferior.1117278.0.html"],
    ["POWER_EFFICIENCY", "LEADING", "On performance-per-watt the A19 Pro is considerably ahead of the Snapdragon 8 Elite Gen 5, with a larger lead again over the Dimensity 9500.", "Inquisitive Universe", "https://inquisitiveuniverse.com/2025/10/13/apple-a19-pro-vs-snapdragon-8-gen-5-vs-dimensity-9500/"],
    ["SUSTAINED_PERFORMANCE", "LEADING", "Up to 40% better sustained performance in the iPhone 17 Pro/Pro Max thanks to the vapor chamber paired with A19 Pro efficiency.", "Inquisitive Universe", "https://inquisitiveuniverse.com/2025/10/13/apple-a19-pro-vs-snapdragon-8-gen-5-vs-dimensity-9500/"],
    ["ON_DEVICE_AI", "STRONG", "First Apple phone GPU with a Neural Accelerator in every core, moving AI work off a single shared block.", "Notebookcheck", "https://www.notebookcheck.net/Apple-A19-Pro-hands-on-GPU-benchmarks-show-40-upgrade-versus-A18-Pro-but-the-Snapdragon-8-Elite-is-hardly-inferior.1117278.0.html"],
  ],
  "xiaomi-snapdragon-8-elite-gen-5": [
    ["RAW_CPU", "LEADING", "Usually ahead in single-core and system tests — the workloads behind emulators, photo processing and browsing.", "Gizmochina", "https://www.gizmochina.com/2025/10/20/snapdragon-8-elite-gen-5-vs-dimensity-9500-vs-apple-a19-pro-benchmarks-and-specs/"],
    ["ON_DEVICE_AI", "LEADING", "Hexagon NPU rated 37% faster than the previous generation, with INT2 support and encrypted on-device generative AI.", "Android Authority", "https://www.androidauthority.com/snapdragon-8-elite-gen-5-benchmarks-3600242/"],
    ["CAMERA_ISP", "LEADING", "20-bit triple ISP (up from 18-bit) giving nearly four times the dynamic range, and the first mobile chip with Advanced Professional Video near-lossless recording.", "Gizmochina", "https://www.gizmochina.com/2025/10/20/snapdragon-8-elite-gen-5-vs-dimensity-9500-vs-apple-a19-pro-benchmarks-and-specs/"],
    ["GAMING_GPU", "STRONG", "Adreno GPU rated 23% faster with 20% lower power and 25% better ray tracing than the prior generation.", "Android Authority", "https://www.androidauthority.com/snapdragon-8-elite-gen-5-benchmarks-3600242/"],
    ["CONNECTIVITY", "STRONG", "Pairs the Snapdragon X80 modem with Wi-Fi 7 for the current premium 5G tier.", "Refab", "https://www.refab.me/blogs/news/2025-top-20-smartphone-processors"],
  ],
  "apple-m5": [
    ["ON_DEVICE_AI", "LEADING", "A Neural Accelerator in every GPU core delivers over 4x the peak GPU AI compute of M4, and roughly 3.5x faster real-world LLM inference.", "Apple Newsroom", "https://www.apple.com/newsroom/2025/10/apple-unleashes-m5-the-next-big-leap-in-ai-performance-for-apple-silicon/"],
  ],
  "apple-m4-pro-m4-max": [
    ["RAW_CPU", "STRONG", "M4 Pro's 273GB/s memory bandwidth is a 75% jump over M3 Pro, feeding workstation-class multi-core work.", "Apple Newsroom", "https://www.apple.com/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/"],
    ["CONNECTIVITY", "STRONG", "First Apple silicon with Thunderbolt 5 at up to 120Gb/s, double Thunderbolt 4.", "Apple Newsroom", "https://www.apple.com/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/"],
  ],
  "apple-m4": [
    ["ON_DEVICE_AI", "STRONG", "38 TOPS Neural Engine — near Snapdragon X Elite's 45 TOPS and well ahead of that era's Intel NPUs, though the gain over M3 narrows once both are normalised to INT8.", "Apple Newsroom", "https://www.apple.com/newsroom/2024/05/apple-introduces-m4-chip/"],
  ],
  "apple-m3": [
    ["GAMING_GPU", "STRONG", "Brought hardware ray tracing and mesh shading to the Mac for the first time, alongside Dynamic Caching.", "Apple Newsroom", "https://www.apple.com/newsroom/2023/10/apple-unveils-m3-m3-pro-and-m3-max-the-most-advanced-chips-for-a-personal-computer/"],
    ["RAY_TRACING", "STRONG", "First Apple Mac silicon with hardware-accelerated ray tracing.", "Apple Newsroom", "https://www.apple.com/newsroom/2023/10/apple-unveils-m3-m3-pro-and-m3-max-the-most-advanced-chips-for-a-personal-computer/"],
  ],
  "xiaomi-xring-o1": [
    ["POWER_EFFICIENCY", "LEADING", "Beats the Snapdragon 8 Elite on multi-core energy efficiency inside a 10W budget, with A725 cores under 0.2W at low frequencies.", "Notebookcheck", "https://www.notebookcheck.net/Xiaomi-XRing-O1-review-sneak-peek-This-is-how-Xiaomi-s-new-SoC-compares-to-the-Snapdragon-8-Elite.1041535.0.html"],
  ],
  "xiaomi-dimensity-9400": [
    ["SUSTAINED_PERFORMANCE", "LEADING", "Better thermal stability under sustained load than the Snapdragon 8 Elite, which matters across long gaming sessions.", "Android Authority", "https://www.androidauthority.com/dimensity-9400-benchmarks-3501443/"],
    ["GAMING_GPU", "STRONG", "Leads the Snapdragon 8 Elite by 7–8% in GPU-heavy 3DMark tests despite trailing on CPU.", "Android Authority", "https://www.androidauthority.com/dimensity-9400-benchmarks-3501443/"],
  ],
  "xiaomi-dimensity-8400": [
    ["POWER_EFFICIENCY", "STRONG", "Cuts peak power 44% versus the Dimensity 8300 while adding 41% multi-core performance.", "Android Central", "https://www.androidcentral.com/phones/the-dimensity-8400-is-mediateks-first-mid-range-chip-to-go-all-in-on-big-cpu-cores"],
    ["GAMING_GPU", "STRONG", "Mali-G720 MC7 rated 24% faster and 42% more power-efficient than the Mali-G615 MC6 it replaces.", "Android Central", "https://www.androidcentral.com/phones/the-dimensity-8400-is-mediateks-first-mid-range-chip-to-go-all-in-on-big-cpu-cores"],
  ],
  "apple-a18-pro": [
    ["RAY_TRACING", "STRONG", "Apple claims up to 200% faster hardware-accelerated ray tracing than the A17 Pro.", "Wccftech", "https://wccftech.com/apple-a18-pro-200-percent-faster-hardware-accelerated-ray-tracing-than-a17-pro/"],
    ["ON_DEVICE_AI", "STRONG", "First Apple silicon rated to run Apple Intelligence on-device at launch.", "Wccftech", "https://wccftech.com/apple-a18-pro-200-percent-faster-hardware-accelerated-ray-tracing-than-a17-pro/"],
  ],
  "apple-a17-pro": [
    ["RAY_TRACING", "STRONG", "First Apple chip with hardware ray tracing — Apple claimed up to 4x the ray-traced frame rates of the A16's software path.", "Pocketnow", "https://pocketnow.com/apple-a17-pro-vs-a16-bionic/"],
  ],
  "xiaomi-snapdragon-8-gen-3": [
    ["ON_DEVICE_AI", "LEADING", "Hexagon NPU at 60 TOPS — 98% faster at AI than the 8 Gen 2, making local generative AI practical rather than cloud-dependent.", "Android Authority", "https://www.androidauthority.com/snapdragon-8-gen-3-vs-snapdragon-8-gen-2-3381660/"],
    ["RAW_CPU", "STRONG", "30% faster CPU and 20% more efficient than the 8 Gen 2.", "Android Authority", "https://www.androidauthority.com/snapdragon-8-gen-3-vs-snapdragon-8-gen-2-3381660/"],
  ],
  "xiaomi-snapdragon-8-elite": [
    ["RAW_CPU", "LEADING", "Qualcomm's first fully custom Oryon cores — a claimed 45% CPU jump and 44% better efficiency over the prior generation.", "9to5Google", "https://9to5google.com/2024/10/21/qualcomm-snapdragon-8-elite/"],
    ["GAMING_GPU", "STRONG", "Adreno GPU 40% faster with 35% better ray tracing, extending gaming time by up to 2.5 hours.", "9to5Google", "https://9to5google.com/2024/10/21/qualcomm-snapdragon-8-elite/"],
  ],
  "xiaomi-snapdragon-8-gen-2": [
    ["RAY_TRACING", "STRONG", "Adreno 740 was Qualcomm's first mobile GPU with hardware ray tracing.", "Android Authority", "https://www.androidauthority.com/snapdragon-8-gen-3-vs-snapdragon-8-gen-2-3381660/"],
    ["CONNECTIVITY", "STRONG", "Brought Wi-Fi 7 to Android flagships.", "Android Authority", "https://www.androidauthority.com/snapdragon-8-gen-3-vs-snapdragon-8-gen-2-3381660/"],
  ],
  "samsung-snapdragon-8-elite-for-galaxy": [
    ["RAW_CPU", "LEADING", "Factory-overclocked bin running to 4.47GHz versus 4.32GHz on the standard Snapdragon 8 Elite.", "Android Authority", "https://www.androidauthority.com/samsung-galaxy-s25-snapdragon-8-elite-for-galaxy-3517978/"],
    ["CAMERA_ISP", "STRONG", "Co-developed Spatio-Temporal Filter ISP support for sharper low-light video up to 8K/30fps, which the standard part does not get.", "Android Authority", "https://www.androidauthority.com/samsung-galaxy-s25-snapdragon-8-elite-for-galaxy-3517978/"],
  ],
  "samsung-snapdragon-8-gen-3-for-galaxy": [
    ["ON_DEVICE_AI", "STRONG", "The 98%-faster AI engine is what made Galaxy AI's on-device features viable at launch.", "Android Authority", "https://www.androidauthority.com/exynos-vs-snapdragon-galaxy-s24-3411235/"],
    ["GAMING_GPU", "STRONG", "Marginally higher gaming performance than the Exynos 2400 variant, especially in non-ray-traced titles.", "Android Authority", "https://www.androidauthority.com/exynos-vs-snapdragon-galaxy-s24-3411235/"],
  ],
  "samsung-exynos-2400": [
    ["POWER_EFFICIENCY", "LEADING", "The Exynos Galaxy S24 held at least a 15% battery-life lead over the Snapdragon variant across most tests.", "Android Authority", "https://www.androidauthority.com/exynos-vs-snapdragon-galaxy-s24-3411235/"],
  ],
  "samsung-exynos-w1000": [
    ["POWER_EFFICIENCY", "STRONG", "Samsung's first 3nm wearable chip, claiming 3.4x single-core and 3.7x multi-core gains over the Exynos W920.", "Notebookcheck", "https://www.notebookcheck.com/Galaxy-Watch-7-und-Watch-Ultra-Samsung-launcht-3nm-Exynos-W1000-mit-massivem-Performance-und-Effizienz-Boost.856232.0.html"],
  ],
  "samsung-intel-core-ultra-7-series-2": [
    ["ON_DEVICE_AI", "STRONG", "47 TOPS NPU clears Microsoft's 40 TOPS Copilot+ bar, enabling Windows' on-device AI features locally.", "Expert Reviews", "https://www.expertreviews.co.uk/technology/laptops/ces-samsung-unveils-galaxy-book5-and-book5-360-powered-by-latest-intel-chips"],
    ["POWER_EFFICIENCY", "STRONG", "Samsung claims up to 25 hours of local video playback on the Galaxy Book5 line.", "Expert Reviews", "https://www.expertreviews.co.uk/technology/laptops/ces-samsung-unveils-galaxy-book5-and-book5-360-powered-by-latest-intel-chips"],
  ],
  "apple-h2": [
    ["ON_DEVICE_AI", "STRONG", "Runs real-time noise-cancellation machine learning on-chip, recomputing 48,000 times per second on AirPods Pro 3.", "Apple Newsroom", "https://www.apple.com/newsroom/2024/09/apple-introduces-airpods-4-and-a-hearing-health-experience-with-airpods-pro-2/"],
  ],
};

let rows = 0;
const missing = [];

for (const [slug, entries] of Object.entries(STRENGTHS)) {
  const chipset = await prisma.chipset.findUnique({ where: { slug } });
  if (!chipset) {
    missing.push(slug);
    continue;
  }

  for (const [domain, level, evidence, sourceName, sourceUrl] of entries) {
    await prisma.chipsetDomainStrength.upsert({
      where: { chipsetId_domain: { chipsetId: chipset.id, domain } },
      update: { level, evidence, sourceName, sourceUrl },
      create: { chipsetId: chipset.id, domain, level, evidence, sourceName, sourceUrl },
    });
    rows++;
  }
  console.log(`  ${chipset.name}: ${entries.length} domain(s)`);
}

console.log(`\n${rows} domain strengths recorded across ${Object.keys(STRENGTHS).length - missing.length} chipsets.`);
if (missing.length) console.log("Chipsets not found:", missing.join(", "));
