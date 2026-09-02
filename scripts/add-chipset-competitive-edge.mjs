import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Real, sourced competitive-edge notes and one independent spec-source
// excerpt per chipset — researched via web search against named tech
// outlets (never estimated). See conversation history for the searches.
const DATA = {
  "apple-a19-pro": {
    edge: "Its 6-core GPU is the first Apple silicon with a Neural Accelerator in every core plus hardware ray tracing — on the Solar Bay Extreme ray-tracing benchmark it scores roughly 50% higher than the A18 Pro, even where Qualcomm and MediaTek's 2025 flagships lead it on raw GPU throughput.",
    edgeSourceName: "Notebookcheck",
    edgeSourceUrl:
      "https://www.notebookcheck.net/Apple-A19-Pro-hands-on-GPU-benchmarks-show-40-upgrade-versus-A18-Pro-but-the-Snapdragon-8-Elite-is-hardly-inferior.1117278.0.html",
    specSummary:
      "A19 Pro scores 2,411 on the Solar Bay Extreme ray-tracing test vs. 1,612 for the A18 Pro (~50% higher), but still trails the Dimensity 9400 and Snapdragon 8 Elite on general GPU throughput (7,003–7,156 vs. the A19 Pro).",
  },
  "xiaomi-snapdragon-8-elite-gen-5": {
    edge: "Qualcomm's 3rd-gen Oryon cores post a claimed 25% Geekbench 6 multi-core lead over Apple's A19 Pro, alongside a 23% faster Adreno GPU, 25% better ray tracing, and a 37% faster Hexagon NPU versus the prior Snapdragon 8 Elite generation.",
    edgeSourceName: "Android Authority",
    edgeSourceUrl: "https://www.androidauthority.com/snapdragon-8-elite-gen-5-benchmarks-3600242/",
    specSummary:
      "3rd-gen Oryon CPU: 4.6GHz peak, 20% faster / 35% more efficient than Gen 4. Adreno GPU: +23% performance, -20% power, +25% ray tracing, with ~18MB Adreno High Performance Memory. Hexagon NPU: +37% faster.",
  },
  "apple-m5": {
    edge: "A Neural Accelerator built into every GPU core — not one shared block — gives the M5 over 4x the peak GPU AI compute of the M4, translating to roughly 3.5x faster real-world LLM inference and image generation according to Apple's own testing.",
    edgeSourceName: "Apple Newsroom",
    edgeSourceUrl: "https://www.apple.com/newsroom/2025/10/apple-unleashes-m5-the-next-big-leap-in-ai-performance-for-apple-silicon/",
    specSummary:
      "10-core GPU with a Neural Accelerator in every core (vs. one shared Neural Engine block in prior generations); unified memory bandwidth up ~30% to 153GB/s; 16-core Neural Engine.",
  },
  "xiaomi-xring-o1": {
    edge: "Xiaomi's first fully self-designed flagship SoC lands within single-digit percentage points of the Snapdragon 8 Elite on CPU and GPU, and actually beats it on multi-core energy efficiency within a 10W power budget — a rare result for a first-generation in-house chip.",
    edgeSourceName: "Notebookcheck",
    edgeSourceUrl:
      "https://www.notebookcheck.net/Xiaomi-XRing-O1-review-sneak-peek-This-is-how-Xiaomi-s-new-SoC-compares-to-the-Snapdragon-8-Elite.1041535.0.html",
    specSummary:
      "2x Cortex-X925 prime cores up to 3.9GHz, 6x Cortex-A725 up to 3.4GHz, 2x Cortex-A520 at 1.8GHz; TSMC N3 (2nd-gen 3nm); first phone SoC on LPDDR5T memory; GPU ~11% ahead of leading competitors in MediaTek's own testing.",
  },
  "xiaomi-dimensity-9400": {
    edge: "Trades the Snapdragon 8 Elite's CPU lead for better sustained output — it edges ahead in combined AnTuTu 10 scores and by 7-8% in GPU-heavy 3DMark tests, with notably better thermal stability across long gaming sessions.",
    edgeSourceName: "Android Authority",
    edgeSourceUrl: "https://www.androidauthority.com/dimensity-9400-benchmarks-3501443/",
    specSummary:
      "1+3+4 core layout, Cortex-X925 prime core at 3.63GHz; Snapdragon 8 Elite leads 18% in single-core and 37% in multi-core Geekbench, but Dimensity 9400 leads ~6% in AnTuTu 10 and 7-8% in 3DMark GPU tests.",
  },
  "xiaomi-dimensity-8400": {
    edge: "The first mid-range MediaTek chip to go all-big-core — eight Cortex-A725 cores, no small efficiency cores — delivering a 41% multi-core performance jump and 44% lower peak power than the Dimensity 8300 it replaces.",
    edgeSourceName: "Android Central",
    edgeSourceUrl: "https://www.androidcentral.com/phones/the-dimensity-8400-is-mediateks-first-mid-range-chip-to-go-all-in-on-big-cpu-cores",
    specSummary:
      "8x Cortex-A725 all-big-core design (no efficiency cores) — unusual for a mid-range chip; Mali-G720 MC7 GPU, +24% peak performance and +42% efficiency over the Mali-G615 MC6 in the Dimensity 8300.",
  },
  "apple-a18-pro": {
    edge: "The extra GPU core plus dedicated ray-tracing hardware gave it a claimed 200% hardware-accelerated ray-tracing gain over the A17 Pro, and it was the first Apple chip built specifically to run Apple Intelligence at launch.",
    edgeSourceName: "Wccftech",
    edgeSourceUrl: "https://wccftech.com/apple-a18-pro-200-percent-faster-hardware-accelerated-ray-tracing-than-a17-pro/",
    specSummary:
      "6-core GPU (vs. 5-core on the A18) with hardware ray tracing; Apple claims the GPU is up to 20% faster and the CPU up to 15% faster than the A17 Pro, with roughly 13% higher ray-tracing throughput than the base A18.",
  },
  "apple-a18": {
    edge: "Apple Intelligence support and hardware ray tracing came to the entire iPhone 16 line via the A18, though it ships with one fewer GPU core and less memory bandwidth than the A18 Pro reserved for the Pro models.",
    edgeSourceName: "AppleInsider",
    edgeSourceUrl: "https://appleinsider.com/articles/24/09/11/compared-a18-vs-a18-pro----breaking-down-whats-powering-iphone-16",
    specSummary:
      "5-core GPU (vs. 6-core on A18 Pro); same 16-core Neural Engine as A18 Pro but with lower memory bandwidth; ray-tracing throughput trails the A18 Pro by roughly 13%.",
  },
  "apple-m4": {
    edge: "Debuted Apple's fastest Neural Engine yet at a claimed 38 TOPS — near Qualcomm's Snapdragon X Elite (45 TOPS) and well ahead of that era's Intel NPUs — though independent analysis notes the on-paper 2x jump over the M3's 18 TOPS shrinks to about 5% once both are normalized to the same INT8 precision.",
    edgeSourceName: "Apple Newsroom",
    edgeSourceUrl: "https://www.apple.com/newsroom/2024/05/apple-introduces-m4-chip/",
    specSummary:
      "16-core Neural Engine rated at 38 TOPS (INT8); M3 was rated 18 TOPS at FP16 — once equalized to INT8 the real generational gain is closer to 5%, not the 2x the headline figures imply.",
  },
  "apple-m4-pro-m4-max": {
    edge: "M4 Pro's 273GB/s memory bandwidth is a 75% jump over M3 Pro — over 2x any contemporary AI PC chip at the time — while the top M4 Max configuration reaches 546GB/s, both feeding a faster Neural Engine for on-device AI roughly 20-30% quicker than M3.",
    edgeSourceName: "Apple Newsroom",
    edgeSourceUrl: "https://www.apple.com/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/",
    specSummary:
      "M4 Pro: up to 64GB unified memory, 273GB/s bandwidth (+75% vs. M3 Pro). M4 Max: up to 546GB/s bandwidth (16-core CPU / 40-core GPU config). M4 Pro adds Thunderbolt 5 at up to 120Gb/s.",
  },
  "apple-a19": {
    edge: "For the first time, Apple's non-Pro iPhone shipped on the same A19 architecture and 3nm process as the Pro line, closing most of the historic gap to flagship-class performance instead of running a cut-down chip.",
    edgeSourceName: "HardwareZone",
    edgeSourceUrl: "https://www.hardwarezone.com.sg/mobile/smartphones/apple-a19-pro-iphone-17-pro-max-air-performance-review",
    specSummary:
      "Same TSMC N3P (3rd-gen 3nm) process and 16-core Neural Engine as the A19 Pro; ships with 8GB memory vs. 12GB on the A19 Pro, and a 5-core GPU vs. the A19 Pro's 6-core.",
  },
  "xiaomi-snapdragon-8-elite": {
    edge: "Qualcomm's first fully custom Oryon cores (not licensed Arm cores) delivered a claimed 45% CPU performance jump and 44% better efficiency over the prior generation, plus a 40% faster GPU with 35% better ray tracing.",
    edgeSourceName: "9to5Google",
    edgeSourceUrl: "https://9to5google.com/2024/10/21/qualcomm-snapdragon-8-elite/",
    specSummary:
      "2x Oryon prime cores at 4.32GHz + 6x performance cores at 3.53GHz, 24MB L2 cache; Qualcomm's first mobile chip built entirely on its own Oryon core design rather than licensed Arm cores.",
  },
};

let edgeCount = 0;
let sourceCount = 0;

for (const [slug, d] of Object.entries(DATA)) {
  const chipset = await prisma.chipset.findUnique({ where: { slug } });
  if (!chipset) {
    console.log(`  skip "${slug}" — not found`);
    continue;
  }

  await prisma.chipset.update({
    where: { slug },
    data: {
      competitiveEdge: d.edge,
      competitiveEdgeSourceName: d.edgeSourceName,
      competitiveEdgeSourceUrl: d.edgeSourceUrl,
    },
  });
  edgeCount++;

  await prisma.chipsetSpecSource.upsert({
    where: { chipsetId_sourceUrl: { chipsetId: chipset.id, sourceUrl: d.edgeSourceUrl } },
    update: { sourceName: d.edgeSourceName, summary: d.specSummary },
    create: {
      chipsetId: chipset.id,
      sourceName: d.edgeSourceName,
      sourceUrl: d.edgeSourceUrl,
      summary: d.specSummary,
    },
  });
  sourceCount++;

  console.log(`  done: ${slug}`);
}

console.log(`\ncompetitiveEdge set on ${edgeCount} chipsets, specSource added on ${sourceCount}.`);
