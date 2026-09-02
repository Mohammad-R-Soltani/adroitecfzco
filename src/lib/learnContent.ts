/// Training material for the desk. The explanatory sections are adapted from
/// the company's own chipset primer; the market-trend section is attributed to
/// the outlets that published each claim. Nothing here invents a figure — where
/// a section needs live numbers it pulls them from the catalog instead.
export type LearnBlock = { term: string; body: string };

export type LearnSection = {
  id: string;
  title: string;
  intro: string;
  blocks: LearnBlock[];
};

export const LEARN_SECTIONS: LearnSection[] = [
  {
    id: "what-is-a-chipset",
    title: "What a chipset actually is",
    intro:
      "In a modern phone almost everything is fused into one piece of silicon — a System on Chip (SoC). When a buyer asks \"which chip does it have?\", these are the parts they are really asking about.",
    blocks: [
      {
        term: "CPU",
        body: "The general-purpose processor. Runs the operating system and app logic. Split into performance cores (fast, power-hungry) and efficiency cores (slow, frugal) — which is why core counts alone tell you very little.",
      },
      {
        term: "GPU",
        body: "Handles graphics, games and the interface itself. Also does parallel maths, which is why some makers now run AI work on the GPU rather than a separate block.",
      },
      {
        term: "NPU / Neural Engine",
        body: "A dedicated unit for machine-learning work running on the device itself — offline translation, computational photography, on-device assistants. Usually quoted in TOPS (trillion operations per second).",
      },
      {
        term: "ISP",
        body: "Image Signal Processor. Turns raw camera sensor data into a finished photo. Two phones with the same camera sensor can look very different because of it.",
      },
      {
        term: "Modem",
        body: "5G/4G, Wi-Fi and Bluetooth radios. On some chips it is integrated; on others it is a separate part, which affects both cost and power draw.",
      },
      {
        term: "Process node",
        body: "How small the transistors are — 3nm, 4nm and so on. Smaller usually means more performance per watt, but the marketing names do not map cleanly across foundries.",
      },
    ],
  },
  {
    id: "reading-benchmarks",
    title: "Reading a benchmark without being misled",
    intro:
      "Benchmark numbers are the most commonly misquoted figures in this trade. These rules are what this catalog itself enforces.",
    blocks: [
      {
        term: "Never mix versions",
        body: "Geekbench 5 and Geekbench 6 scores are not comparable — the same phone scores very differently. Same for AnTuTu v9 vs v10 vs v11, and every 3DMark variant. A score without its version is not usable.",
      },
      {
        term: "Single-core vs multi-core",
        body: "Single-core reflects responsiveness in everyday use; multi-core reflects sustained heavy work. Apple traditionally leads single-core; the gap narrows or reverses on multi-core.",
      },
      {
        term: "Peak is not sustained",
        body: "A benchmark run measures a short burst. Sustained gaming performance depends on cooling — which is why a chip that scores lower can feel better over a long session.",
      },
      {
        term: "Scores belong to a device, not a chip",
        body: "The same chipset performs differently in different bodies, RAM configurations and regions. That is why every figure in this catalog is tied to a specific tested device and a named source.",
      },
    ],
  },
  {
    id: "market-direction",
    title: "Where the industry is heading",
    intro:
      "The structural shifts worth understanding, because they shape what buyers will ask for next.",
    blocks: [
      {
        term: "On-device AI moves down-market",
        body: "AI features that needed the cloud now run locally. Qualcomm's Hexagon NPU hit 60 TOPS with the 8 Gen 3, and Apple's M5 puts a neural accelerator inside every GPU core rather than one shared block. Expect buyers to start asking about NPU capability, not just CPU speed.",
      },
      {
        term: "Chiplets replacing monolithic dies",
        body: "Rather than one large die, makers increasingly assemble several smaller ones. It lowers cost and improves yields — relevant because it is part of why pricing on newer nodes has held up better than expected.",
      },
      {
        term: "Custom cores are the new differentiator",
        body: "Qualcomm's Oryon cores are built from scratch under an Arm architectural licence rather than using Arm's off-the-shelf designs. Xiaomi's XRing O1 is a first-generation attempt at the same independence.",
      },
      {
        term: "Binning and regional variants",
        body: "The same chip name can mean different silicon. Samsung ships a factory-overclocked \"for Galaxy\" bin; the iPhone Air runs a 5-core-GPU A19 Pro while the Pro Max gets six. Always confirm the exact variant before quoting.",
      },
    ],
  },
];

/// Reference outlets, kept here so the desk knows where the catalog's own
/// figures come from and where to check something that isn't in it yet.
export const LEARN_SOURCES = [
  { name: "GSMArena", url: "https://www.gsmarena.com", note: "Full device spec sheets and lab-tested benchmark scores" },
  { name: "Notebookcheck", url: "https://www.notebookcheck.net", note: "Deep chip analysis and sustained-performance testing" },
  { name: "WikiChip", url: "https://en.wikichip.org", note: "Technical encyclopedia of chip architectures" },
  { name: "AnandTech (archive)", url: "https://www.anandtech.com", note: "Archived deep architectural analysis" },
  { name: "Counterpoint Research", url: "https://www.counterpointresearch.com", note: "Free market-share and SoC shipment reports" },
  { name: "EE Times", url: "https://www.eetimes.com", note: "Semiconductor industry news across all sectors" },
  { name: "SemiAnalysis", url: "https://www.semianalysis.com", note: "AI and datacentre silicon industry analysis" },
];
