import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Fills in competitiveEdge/strengthTag for the 28 mid-range/budget chipsets
 * added from the company's own sales ledger (deliberately left blank when
 * they were first catalogued) plus the two undisclosed earbuds audio chips.
 *
 * Each entry is a specific, checkable claim from a named outlet — including
 * several "this is a rebrand, not new silicon" findings, since that is
 * exactly the kind of fact a buyer comparing chip names would want and would
 * not get from the chip's own marketing name.
 *
 * None of these get a ChipsetDomainStrength (AI/Gaming/RayTracing/etc.) row:
 * that matrix is reserved for chips a named outlet put *first* in a workload,
 * and none of this tier's research supports a leadership claim — adding one
 * anyway would dilute the one part of the catalog that means "actually
 * best," not just "improved over its own predecessor."
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const EDGES = [
  { chipset: "Snapdragon 4 Gen 2", brand: "xiaomi",
    strengthTag: "CPU lead over rival Helio G99",
    competitiveEdge: "Despite the entry-tier \"4 series\" name, the Snapdragon 4 Gen 2 out-benchmarks MediaTek's Helio G99 — its Cortex-A78 cores post a higher AnTuTu score (478K vs 381K) on a smaller 4nm process versus the G99's 6nm.",
    sourceName: "AllRoundReview", sourceUrl: "https://www.allroundreview.com/mediatek-helio-g99-vs-snapdragon-4-gen-2-the-battle-for-the-midrange-is-on" },

  { chipset: "Snapdragon 6 Gen 3", brand: "xiaomi",
    strengthTag: "Efficiency vs Gen 1 (7W vs 10W)",
    competitiveEdge: "Qualcomm's own figures claim a 10% CPU gain, 30% faster Adreno rendering and 20% better AI performance over the Snapdragon 6 Gen 1, plus a lower 7W TDP (vs 10W) that keeps the phone cooler under sustained load.",
    sourceName: "PhoneArena", sourceUrl: "https://phonearena.com/news/qualcomm-snapdragon-6-gen-3-official_id162124" },

  { chipset: "Snapdragon 6s Gen 3", brand: "xiaomi",
    strengthTag: "2021 chip, rebranded",
    competitiveEdge: "Qualcomm itself has confirmed the Snapdragon 6s Gen 3 is an \"enhanced version\" of the 2021 Snapdragon 695 — same two-Cortex-A78 architecture, with the maximum CPU clock nudged from 2.2GHz to 2.3GHz. It is a refresh of four-year-old silicon, not a new design.",
    sourceName: "GSMArena", sourceUrl: "https://m.gsmarena.com/newscomm-63308.php" },

  { chipset: "Snapdragon 7+ Gen 3", brand: "xiaomi",
    strengthTag: "GPU jump vs 7 Gen 3 (+45%)",
    competitiveEdge: "A real step up from the plain Snapdragon 7 Gen 3: Qualcomm claims 15% faster CPU and 45% faster GPU, and independent AnTuTu testing shows roughly a 35% overall lead — performance lands close to the previous-generation flagship Snapdragon 8 Gen 1.",
    sourceName: "Gizmochina", sourceUrl: "https://www.gizmochina.com/2025/02/17/snapdragon-7-plus-gen-3-vs-7-gen-3-comparison/" },

  { chipset: "Snapdragon 7s Gen 2", brand: "xiaomi",
    strengthTag: "Overclocked Gen 1, not new",
    competitiveEdge: "Reviewers found the \"7s Gen 2\" name misleading: it is an overclocked Snapdragon 6 Gen 1 with an identical Adreno 710 GPU, the same X62 modem and the same FastConnect 6700 connectivity — critics argued it should have been called the \"6+ Gen 1\" instead.",
    sourceName: "Gizmochina", sourceUrl: "https://www.gizmochina.com/2023/09/24/snapdragon-7s-gen-2-rebrand-snapdragon-6-gen-1/" },

  { chipset: "Snapdragon 7s Gen 3", brand: "xiaomi",
    strengthTag: "On-device GenAI at midrange",
    competitiveEdge: "Qualcomm's own figures claim up to 40% faster Adreno graphics, over 30% better AI performance and roughly 20% faster CPU than its predecessor, while cutting power draw by around 12%. It brings on-device generative AI and a 12-bit triple ISP down from flagship tiers.",
    sourceName: "Qualcomm", sourceUrl: "https://www.qualcomm.com/smartphones/products/7-series/snapdragon-7s-gen-3-mobile-platform" },

  { chipset: "Snapdragon 7s Gen 4", brand: "xiaomi",
    strengthTag: "+66% AnTuTu gen-over-gen",
    competitiveEdge: "In the POCO M8 Pro, the 7s Gen 4 delivered a 66% AnTuTu jump over its predecessor generation, crossing 1.06 million points — with an Adreno 810 GPU and a Hexagon NPU capable of running small language models (Llama/Qwen 1B) on-device.",
    sourceName: "Beebom", sourceUrl: "https://gadgets.beebom.com/news/poco-m8-pro-with-snapdragon-7s-gen-4-launched-globally" },

  { chipset: "Snapdragon 8s Gen 3", brand: "xiaomi",
    strengthTag: "Trimmed flagship, lower clocks",
    competitiveEdge: "A deliberately trimmed Snapdragon 8 Gen 3: the prime Cortex-X4 core is clocked 300MHz lower (3.0GHz vs 3.3GHz) and the Adreno 735 GPU drops the global-illumination ray tracing the full 8 Gen 3's Adreno 750 supports — most of the flagship's performance at a lower price.",
    sourceName: "Android Authority", sourceUrl: "https://www.androidauthority.com/snapdragon-8-gen-3-vs-8s-gen-3-3426507/" },

  { chipset: "Snapdragon 8s Gen 4", brand: "xiaomi",
    strengthTag: "Sustained CPU, not peak GPU",
    competitiveEdge: "Trades peak graphics for sustained CPU throughput: the 8s Gen 4 runs about 8% faster than the older Snapdragon 8 Gen 3 in multi-threaded work and holds its clocks longer, but its Adreno 825 GPU is roughly 77% slower than the 8 Gen 3's Adreno 750 under 3DMark Wild Life Extreme's stress test.",
    sourceName: "Gizmochina", sourceUrl: "https://www.gizmochina.com/2025/05/24/snapdragon-8s-gen-4-vs-8-gen-3-benchmark-showdown/" },

  { chipset: "Unisoc T603", brand: "xiaomi",
    strengthTag: "Entry tier, Snapdragon 460 parity",
    competitiveEdge: "An entry-level 4G chip built for light use only — independent benchmarks put it ahead of Samsung's Exynos 850 and roughly level with Qualcomm's Snapdragon 460, but it is not built for anything beyond casual apps and light gaming.",
    sourceName: "Unite4Buy", sourceUrl: "https://unite4buy.com/cpu/UNISOC-T603/" },

  { chipset: "Unisoc T7250", brand: "xiaomi",
    strengthTag: "T615 refresh, ~13% behind Helio G85",
    competitiveEdge: "A rebrand of the older Unisoc T615, positioned to replace the ageing T610 against MediaTek's Helio G80/G85. Independent benchmarks put it roughly 13% behind the Helio G85 in raw performance, though both target the same budget tier.",
    sourceName: "Inquisitive Universe", sourceUrl: "https://inquisitiveuniverse.com/2025/05/11/unisoc-t7250-vs-helio-g81-a-budget-face-off/" },

  { chipset: "Helio G36", brand: "xiaomi",
    strengthTag: "Entry gaming, weaker GPU than rivals",
    competitiveEdge: "MediaTek built the G36 for entry gaming phones — HyperEngine 2.0 Lite, dual 4G SIM support and a 90Hz display ceiling on a power-sipping 12nm process — but its PowerVR GE8320 GPU trails Qualcomm's rival Snapdragon 678, whose Adreno 612 offers noticeably stronger gaming headroom.",
    sourceName: "Comparigon", sourceUrl: "https://comparigon.com/mobilesocs/helio-g36" },

  { chipset: "Helio G81 Ultra", brand: "xiaomi",
    strengthTag: "Higher camera cap, weaker GPU than G85",
    competitiveEdge: "Supports a higher-resolution 50MP main camera than the plain Helio G85's 48MP ceiling, but trades away GPU headroom to get there — the G85's Mali-G52 clocks higher (1000MHz vs 950MHz) and scores about 20% higher on 3DMark.",
    sourceName: "NanoReview", sourceUrl: "https://nanoreview.net/en/soc-compare/mediatek-helio-g85-vs-mediatek-helio-g81" },

  { chipset: "Helio G85", brand: "xiaomi",
    strengthTag: "Established 2020 budget baseline",
    competitiveEdge: "A known quantity rather than a new design: launched in 2020 and still MediaTek's reference point for the low end five years on — later \"Ultra\"-branded chips (G81 Ultra, G91 Ultra) are judged against it rather than replacing it outright.",
    sourceName: "GSMArena", sourceUrl: "https://www.gsmarena.com/xiaomi_poco_c65-review-2637.php" },

  { chipset: "Helio G91 Ultra", brand: "xiaomi",
    strengthTag: "UFS storage over G88, same core speed",
    competitiveEdge: "Nearly identical to the Helio G88 in raw CPU/GPU performance — the real upgrade is storage: the G91(+Ultra) requires at least UFS 2.1 versus the G88's slower eMMC 5.1, a meaningful difference in app-load and file-transfer speed that benchmark scores alone don't capture.",
    sourceName: "Versus", sourceUrl: "https://versus.com/en/mediatek-helio-g88-vs-mediatek-helio-g91-ultra" },

  { chipset: "Helio G95", brand: "xiaomi",
    strengthTag: "Predecessor to G96, same core layout",
    competitiveEdge: "Shares its 2x Cortex-A76 + 6x Cortex-A55 layout with the newer Helio G96, which edges ahead by roughly 13% in AnTuTu and runs its GPU about 6% faster (950MHz vs 900MHz) — the G95 is the same design a half-step earlier.",
    sourceName: "CPU-Monkey", sourceUrl: "https://www.cpu-monkey.com/en/compare_cpu-mediatek_helio_g95-vs-mediatek_helio_g96" },

  { chipset: "Helio G96", brand: "xiaomi",
    strengthTag: "120Hz + better camera than G95",
    competitiveEdge: "A modest refresh of the Helio G95 sharing the same core architecture, but adds 120Hz display support and stronger low-light camera processing that the G95 lacks — MediaTek's HyperEngine gaming layer carries over unchanged.",
    sourceName: "Bajaj Finserv", sourceUrl: "https://www.bajajfinserv.in/mediatek-helio-g95-vs-mediatek-helio-g96" },

  { chipset: "Helio G99 Ultra", brand: "xiaomi",
    strengthTag: "LPDDR5 + 200MP over base G99",
    competitiveEdge: "Same CPU/GPU core design as the standard Helio G99, but the \"Ultra\" bin pairs it with faster LPDDR5 memory (vs LPDDR4X), 120Hz display support (vs 90Hz) and a 200MP camera ceiling the base G99 cannot reach.",
    sourceName: "GadgetVersus", sourceUrl: "https://gadgetversus.com/processor/mediatek-helio-g99-ultra-vs-mediatek-mt6789-helio-g99/" },

  { chipset: "Helio G100", brand: "xiaomi",
    strengthTag: "200MP camera over G99's 108MP cap",
    competitiveEdge: "Barely faster than its own predecessor — about 2% ahead in overall benchmarks. The Helio G100 is essentially a Helio G99 on a refined process with one real gain: camera sensor support up to 200MP, versus 108MP on the G99.",
    sourceName: "91mobiles", sourceUrl: "https://www.91mobiles.com/processor/mediatek-helio-g99-vs-mediatek-helio-g100" },

  { chipset: "Helio G100 Ultra", brand: "xiaomi",
    strengthTag: "Tablet-tuned G100 variant",
    competitiveEdge: "The tablet-oriented bin of the Helio G100 line, pairing performance Cortex-A78 cores with a Mali-G610 MP4 GPU — chosen for the Redmi Pad 2 to drive its 11-inch 2.5K, 90Hz panel rather than for outright benchmark supremacy.",
    sourceName: "Beebom", sourceUrl: "https://gadgets.beebom.com/news/redmi-pad-2-launched-india-key-specs-price-availability" },

  { chipset: "Dimensity 6080", brand: "xiaomi",
    strengthTag: "5G at Helio G100's price point",
    competitiveEdge: "A 5G alternative to MediaTek's own 4G-only Helio G100 at a similar price point — built on 6nm with two Cortex-A76 performance cores and 2-lane UFS 2.2 storage that MediaTek says roughly doubles data-transfer speed over older single-lane storage.",
    sourceName: "MediaTek", sourceUrl: "https://www.mediatek.com/products/smartphones/mediatek-dimensity-6080" },

  { chipset: "Dimensity 7025 Ultra", brand: "xiaomi",
    strengthTag: "Everyday tier, below 7300/8300 Ultra",
    competitiveEdge: "Sits below the Dimensity 7300 Ultra and 8300 Ultra in Xiaomi's own chip stack — a 6nm, 2.5GHz chip with a Mali-G610 MC4 GPU built for everyday use in the Redmi Note line rather than gaming-first positioning.",
    sourceName: "Fonearena", sourceUrl: "https://www.fonearena.com/blog/436593/redmi-note-14-5g-price-specifications.html" },

  { chipset: "Dimensity 7300 Ultra", brand: "xiaomi",
    strengthTag: "Xiaomi-tuned bin, below Dimensity 8400",
    competitiveEdge: "MediaTek's own review coverage notes the plain POCO X7 runs \"older ARMv8 tech\" on this chip, unlike the POCO X7 Pro's newer Dimensity 8400 — Xiaomi positions the 7300 Ultra as the value tier within its own lineup, not as a rival to the Pro chip.",
    sourceName: "GSMArena", sourceUrl: "https://www.gsmarena.com/xiaomi_poco_x7-13604.php" },

  { chipset: "Dimensity 7400 Ultra", brand: "xiaomi",
    strengthTag: "APU 655 on-device AI camera",
    competitiveEdge: "Pairs an APU 655 (about 15% faster AI processing than the prior generation) with an Imagiq 950 ISP that supports 200MP sensors, 12-bit HDR and on-device night-mode processing — handling computational photography locally rather than in the cloud.",
    sourceName: "PhoneArena", sourceUrl: "https://www.phonearena.com/news/mediatek-dimensity-7400-7400x-6400-official_id167945" },

  { chipset: "Dimensity 8300 Ultra", brand: "xiaomi",
    strengthTag: "Xiaomi-tuned bin of Dimensity 8300",
    competitiveEdge: "MediaTek's Dimensity 8300 silicon tuned specifically for Xiaomi/POCO through its Open Resource Architecture partner program — the same die with a modest +50MHz bump on the primary Cortex-A715 core and firmware-level HyperEngine 3.0 gaming tuning, not a distinct chip design.",
    sourceName: "Voi.id", sourceUrl: "https://voi.id/en/technology/429842" },

  { chipset: "Dimensity 8500 Ultra", brand: "xiaomi",
    strengthTag: "+25% GPU / -20% power vs prior gen",
    competitiveEdge: "MediaTek's own figures claim a 25% GPU performance gain and 20% lower GPU power draw at peak load versus the prior generation, with the Immortalis-class Mali-G720 MC8 GPU built to sustain 120fps gaming.",
    sourceName: "MediaTek", sourceUrl: "https://www.mediatek.com/tek-talk-blogs/mediatek-dimensity-8500-powerful-performance-for-ultra-fast-play" },

  { chipset: "Dimensity 9300+", brand: "xiaomi",
    strengthTag: "APU 790 AI gain (modest CPU bump)",
    competitiveEdge: "A largely on-paper refresh of the Dimensity 9300 — Geekbench and AnTuTu scores are nearly unchanged — with the real gain in the APU 790's on-device AI performance (+10%) and a small clock bump on the prime Cortex-X4 core (3.25GHz to 3.4GHz).",
    sourceName: "GSMArena", sourceUrl: "https://m.gsmarena.com/mediatek_dimensity_9300_brings_increased_clock_speed_and_improved_ai_processing-news-62743.php" },

  { chipset: "Dimensity 9500s", brand: "xiaomi",
    strengthTag: "Closer to 9400 than to 9500",
    competitiveEdge: "Despite the \"9500\" name, independent benchmarks show the 9500s performs much closer to the older Dimensity 9400/9400+ than to the true flagship Dimensity 9500 — still capable (2.7M+ AnTuTu in the POCO X8 Pro Max) on TSMC's 3nm N3E node, just not the generational leap its name implies.",
    sourceName: "Beebom", sourceUrl: "https://gadgets.beebom.com/guides/mediatek-dimensity-9500s-benchmark-specs" },

  { chipset: "Galaxy Buds audio chip (undisclosed)", brand: "samsung",
    strengthTag: "Chip undisclosed by Samsung",
    competitiveEdge: "Samsung has never named the audio/ANC silicon inside the Buds3 line. The Pro model is the halo device — SSC HiFi/UHQ codec support for 24-bit/96kHz playback and Bluetooth 5.4 — features the base Buds3 and Buds3 FE do not carry, even though all three likely share the same die family.",
    sourceName: "Samsung", sourceUrl: "https://www.samsung.com/us/app/mobile/audio/galaxy-buds-pro" },

  { chipset: "Xiaomi Buds audio chip (undisclosed)", brand: "xiaomi",
    strengthTag: "55dB ANC across both models",
    competitiveEdge: "Xiaomi has not named a shared chip for this pairing, but both independently hit the same 55dB peak ANC depth in manufacturer testing. The Buds 5 Pro is confirmed to run on a Qualcomm Snapdragon S7 Gen 1 audio platform; the cheaper Redmi Buds 6 Pro's chip is not disclosed.",
    sourceName: "Gizmochina", sourceUrl: "https://www.gizmochina.com/2025/02/27/xiaomi-buds-5-pro-launch-specs-price/" },
];

let updated = 0;
const missed = [];

for (const e of EDGES) {
  const brand = await prisma.brand.findUnique({ where: { slug: e.brand } });
  if (!brand) { missed.push(`${e.chipset} (brand "${e.brand}" not found)`); continue; }

  const result = await prisma.chipset.updateMany({
    where: { name: e.chipset, brandId: brand.id },
    data: {
      competitiveEdge: e.competitiveEdge,
      competitiveEdgeSourceName: e.sourceName,
      competitiveEdgeSourceUrl: e.sourceUrl,
      strengthTag: e.strengthTag,
    },
  });
  if (result.count === 0) missed.push(`${e.chipset} (${e.brand}) — no matching row`);
  else updated += result.count;
}

console.log(`${updated} chipsets updated.`);
if (missed.length) console.log("Not matched:\n  " + missed.join("\n  "));

await prisma.$disconnect();
