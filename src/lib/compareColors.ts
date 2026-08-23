// Fixed by comparison SLOT (1st / 2nd / 3rd device chosen), never by brand —
// two Xiaomi phones compared side by side must still read as clearly
// different series. Validated as an all-pairs-safe categorical triple
// (CVD ΔE >= 9.2, normal-vision ΔE >= 24.0) against both white and the
// app's mist surface; the sub-3:1 contrast WARN is mitigated by always
// pairing color with a visible numeric label, never color alone.
export const SLOT_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"] as const;
