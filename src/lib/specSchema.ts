// Category layout mirrors the trade's reference site (GSMArena) so the sheet
// reads exactly the way the team already reads specs day to day.

export type SpecRow = { label: string; key: string };
export type SpecCategory = { name: string; rows: SpecRow[] };

export const SPEC_CATEGORIES: SpecCategory[] = [
  {
    name: "Network",
    rows: [
      { label: "Technology", key: "networkTechnology" },
      { label: "2G bands", key: "network2g" },
      { label: "3G bands", key: "network3g" },
      { label: "4G bands", key: "network4g" },
      { label: "5G bands", key: "network5g" },
      { label: "Speed", key: "networkSpeed" },
    ],
  },
  {
    name: "Launch",
    rows: [
      { label: "Announced", key: "announced" },
      { label: "Status", key: "status" },
    ],
  },
  {
    name: "Body",
    rows: [
      { label: "Dimensions", key: "dimensions" },
      { label: "Weight", key: "weight" },
      { label: "Build", key: "build" },
      { label: "SIM", key: "sim" },
    ],
  },
  {
    name: "Display",
    rows: [
      { label: "Type", key: "displayType" },
      { label: "Size", key: "displaySize" },
      { label: "Resolution", key: "displayResolution" },
      { label: "Protection", key: "displayProtection" },
    ],
  },
  {
    name: "Platform",
    rows: [
      { label: "OS", key: "os" },
      { label: "Chipset", key: "chipset" },
      { label: "CPU", key: "cpu" },
      { label: "GPU", key: "gpu" },
    ],
  },
  {
    name: "Memory",
    rows: [
      { label: "Card slot", key: "cardSlot" },
      { label: "Internal", key: "internalStorage" },
    ],
  },
  {
    name: "Main Camera",
    rows: [
      { label: "Modules", key: "mainCameraModules" },
      { label: "Features", key: "mainCameraFeatures" },
      { label: "Video", key: "mainCameraVideo" },
    ],
  },
  {
    name: "Selfie Camera",
    rows: [
      { label: "Modules", key: "selfieCameraModules" },
      { label: "Features", key: "selfieCameraFeatures" },
      { label: "Video", key: "selfieCameraVideo" },
    ],
  },
  {
    name: "Sound",
    rows: [
      { label: "Loudspeaker", key: "loudspeaker" },
      { label: "3.5mm jack", key: "jack35mm" },
    ],
  },
  {
    name: "Comms",
    rows: [
      { label: "WLAN", key: "wlan" },
      { label: "Bluetooth", key: "bluetooth" },
      { label: "Positioning", key: "positioning" },
      { label: "NFC", key: "nfc" },
      { label: "Infrared port", key: "infraredPort" },
      { label: "Radio", key: "radio" },
      { label: "USB", key: "usb" },
    ],
  },
  {
    name: "Features",
    rows: [{ label: "Sensors", key: "sensors" }],
  },
  {
    name: "Battery",
    rows: [
      { label: "Type", key: "batteryType" },
      { label: "Charging", key: "charging" },
    ],
  },
  {
    name: "Misc",
    rows: [
      { label: "Colors", key: "colors" },
      { label: "Models", key: "models" },
      { label: "SAR", key: "sar" },
      { label: "Price", key: "price" },
    ],
  },
];

export type QuickMetric = {
  label: string;
  key: "displayInches" | "refreshRateHz" | "batteryMah" | "chargingWatts" | "mainCameraMp" | "selfieCameraMp" | "weightGrams";
  unit: string;
  higherIsBetter: boolean;
  icon: "display" | "refresh" | "battery" | "bolt" | "camera" | "weight";
};

export const QUICK_METRICS: QuickMetric[] = [
  { label: "Display", key: "displayInches", unit: '"', higherIsBetter: true, icon: "display" },
  { label: "Refresh rate", key: "refreshRateHz", unit: "Hz", higherIsBetter: true, icon: "refresh" },
  { label: "Battery", key: "batteryMah", unit: " mAh", higherIsBetter: true, icon: "battery" },
  { label: "Charging", key: "chargingWatts", unit: "W", higherIsBetter: true, icon: "bolt" },
  { label: "Main camera", key: "mainCameraMp", unit: " MP", higherIsBetter: true, icon: "camera" },
  { label: "Selfie camera", key: "selfieCameraMp", unit: " MP", higherIsBetter: true, icon: "camera" },
  { label: "Weight", key: "weightGrams", unit: "g", higherIsBetter: false, icon: "weight" },
];
