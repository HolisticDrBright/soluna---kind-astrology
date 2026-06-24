// Human Design reference data.
//
// Gate wheel: the 64 gates around the 360° ecliptic. The Rave Mandala begins
// with Gate 41 at 2°00' Aquarius (ecliptic longitude 302°), each gate spanning
// 5.625° (=360/64), each of 6 lines spanning 0.9375°. Checkpoint: 0° Aries
// falls inside Gate 25 — the standard calibration test (verified in unit tests).

export const GATE_WHEEL_START = 302; // 2° Aquarius
export const GATE_SIZE = 360 / 64; // 5.625
export const LINE_SIZE = GATE_SIZE / 6; // 0.9375

export const GATE_WHEEL: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

export type CenterName =
  | "Head" | "Ajna" | "Throat" | "G" | "Heart"
  | "Spleen" | "Sacral" | "SolarPlexus" | "Root";

export const CENTER_ORDER: CenterName[] = [
  "Head", "Ajna", "Throat", "G", "Heart", "Spleen", "Sacral", "SolarPlexus", "Root",
];

export const MOTOR_CENTERS: CenterName[] = ["Heart", "SolarPlexus", "Sacral", "Root"];

const CENTER_GATES: Record<CenterName, number[]> = {
  Head: [64, 61, 63],
  Ajna: [47, 24, 4, 17, 43, 11],
  Throat: [62, 23, 56, 16, 20, 31, 8, 33, 35, 12, 45],
  G: [10, 7, 1, 13, 25, 15, 2, 46],
  Heart: [21, 26, 40, 51],
  Spleen: [48, 57, 44, 50, 32, 28, 18],
  Sacral: [34, 5, 14, 29, 59, 27, 9, 3, 42],
  SolarPlexus: [6, 37, 36, 22, 49, 55, 30],
  Root: [53, 60, 52, 19, 39, 41, 58, 38, 54],
};

export const GATE_TO_CENTER: Record<number, CenterName> = (() => {
  const map: Record<number, CenterName> = {};
  for (const center of CENTER_ORDER) {
    for (const gate of CENTER_GATES[center]) map[gate] = center;
  }
  return map;
})();

// The 36 channels — each connects two gates (and thus two centers). A channel is
// "defined" only when BOTH gates are activated.
export const CHANNELS: Array<[number, number]> = [
  [64, 47], [61, 24], [63, 4], // Head-Ajna
  [17, 62], [43, 23], [11, 56], // Ajna-Throat
  [16, 48], [20, 57], // Throat-Spleen
  [20, 34], // Throat-Sacral
  [20, 10], [31, 7], [8, 1], [33, 13], // Throat-G
  [35, 36], [12, 22], // Throat-SolarPlexus
  [45, 21], // Throat-Heart
  [10, 34], [15, 5], [2, 14], [46, 29], // G-Sacral
  [10, 57], // G-Spleen
  [25, 51], // G-Heart
  [26, 44], // Heart-Spleen
  [40, 37], // Heart-SolarPlexus
  [59, 6], // Sacral-SolarPlexus
  [27, 50], [34, 57], // Sacral-Spleen
  [3, 60], [9, 52], [42, 53], // Sacral-Root
  [28, 38], [32, 54], [18, 58], // Spleen-Root
  [49, 19], [55, 39], [30, 41], // SolarPlexus-Root
];
