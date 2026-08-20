type ChipsetForCopy = {
  name: string;
  series: string;
  processNode: string;
  cpuSummary: string;
  gpuSummary: string;
  npuSummary: string | null;
  maxRam: string | null;
  highlight: string;
  brand: { name: string };
};

export function buildDeviceAbout(deviceName: string, chipset: ChipsetForCopy): string[] {
  const paragraphs: string[] = [];

  paragraphs.push(
    `The ${deviceName} is built around the ${chipset.name}, ${chipset.brand.name}'s ${chipset.series} chip manufactured on ${chipset.processNode}. It pairs ${chipset.cpuSummary.toLowerCase()} with ${chipset.gpuSummary.toLowerCase()}${chipset.npuSummary ? `, plus a ${chipset.npuSummary.toLowerCase()}` : ""}${chipset.maxRam ? `, and supports ${chipset.maxRam.toLowerCase()}` : ""}.`
  );

  paragraphs.push(chipset.highlight);

  return paragraphs;
}
