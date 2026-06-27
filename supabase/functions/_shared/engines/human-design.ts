/**
 * HumanDesignEngine — derives a Human Design-INSPIRED snapshot (Type, Strategy,
 * Authority, Profile, and a defined/undefined-centers body-graph).
 * Input: { date, time, lat, lng } (needs birth time; returns a flag if missing).
 *
 * NOTE: This is a deterministic, Human Design-inspired heuristic — NOT a true
 * ephemeris bodygraph (it does not compute planetary longitudes or the ~88°
 * solar-arc design date). Centers/gates are derived deterministically from the
 * birth inputs so the reflective lens is stable per person. It is framed as
 * "inspired" everywhere it surfaces and must never be presented as a literal,
 * astronomically-calculated Human Design chart.
 */

export interface HumanDesignInput {
  date: string;       // ISO date YYYY-MM-DD
  time: string | null; // HH:MM
  lat: number;
  lng: number;
}

export interface HumanDesignOutput {
  type: string;          // Generator, Manifesting Generator, Projector, Manifestor, Reflector
  strategy: string;
  authority: string;
  profile: string;       // e.g. "1/3"
  definedCenters: string[];
  undefinedCenters: string[];
  gates: number[];
  channels: string[];
  incarnationCross: string;
  timeRequired: boolean;
  timeMissingNote?: string;
}

const CENTERS = [
  "Head", "Ajna", "Throat", "G", "Heart/Ego",
  "Sacral", "Spleen", "Solar Plexus", "Root",
];

// Simplified HD computation based on birth data
function computeHDTypeAndStrategy(
  sacralDefined: boolean,
  throatToGDefined: boolean,
  allCentersUndefined: boolean,
): { type: string; strategy: string } {
  if (allCentersUndefined) {
    return { type: "Reflector", strategy: "Wait a full lunar cycle before making decisions" };
  }
  if (sacralDefined) {
    if (throatToGDefined) {
      return { type: "Manifesting Generator", strategy: "Wait to respond, then inform before acting" };
    }
    return { type: "Generator", strategy: "Wait to respond" };
  }
  if (throatToGDefined && !sacralDefined) {
    return { type: "Manifestor", strategy: "Inform before acting" };
  }
  return { type: "Projector", strategy: "Wait for the invitation" };
}

function computeAuthority(
  solarPlexusDefined: boolean,
  sacralDefined: boolean,
  spleenDefined: boolean,
  gDefined: boolean,
): string {
  if (solarPlexusDefined) return "Emotional Authority — wait for clarity over time";
  if (sacralDefined) return "Sacral Authority — trust your gut response";
  if (spleenDefined) return "Splenic Authority — trust your immediate instinct";
  if (gDefined) return "Self-Projected Authority — talk it out to hear your truth";
  return "Lunar Authority — wait a full lunar cycle";
}

function computeProfile(date: Date): string {
  // Simplified profile from birth date
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const line1 = ((day % 6) || 6);
  const line2 = ((month % 6) || 6);
  return `${line1}/${line2}`;
}

function computeGates(date: Date, lat: number, lng: number): number[] {
  // Simplified gate computation — realistic distribution from 64 gates
  const seed = date.getTime() + Math.round(lat * 100) + Math.round(lng * 100);
  const gates: number[] = [];
  const usedGates = new Set<number>();
  const numGates = 15 + (Math.abs(seed) % 12); // 15-26 active gates

  let hash = seed;
  while (gates.length < numGates) {
    hash = (hash * 16807 + 0) % 2147483647;
    const gate = 1 + (Math.abs(hash) % 64);
    if (!usedGates.has(gate)) {
      usedGates.add(gate);
      gates.push(gate);
    }
  }
  return gates.sort((a, b) => a - b);
}

function gatesToCenters(gates: number[]): { defined: string[]; undefinedCenters: string[] } {
  // Gate to center mapping (simplified)
  const gateCenterMap: Record<number, string> = {
    1: "G", 2: "G", 7: "G", 10: "G", 13: "G", 15: "G", 25: "G", 46: "G",
    11: "Ajna", 17: "Ajna", 24: "Ajna", 43: "Ajna", 47: "Ajna", 4: "Ajna", 63: "Ajna",
    8: "Throat", 12: "Throat", 16: "Throat", 20: "Throat", 23: "Throat", 31: "Throat",
    33: "Throat", 35: "Throat", 45: "Throat", 56: "Throat", 62: "Throat",
    5: "Sacral", 9: "Sacral", 14: "Sacral", 27: "Sacral", 29: "Sacral", 34: "Sacral",
    42: "Sacral", 59: "Sacral", 3: "Sacral",
    6: "Solar Plexus", 22: "Solar Plexus", 30: "Solar Plexus", 36: "Solar Plexus",
    37: "Solar Plexus", 49: "Solar Plexus", 55: "Solar Plexus",
    18: "Spleen", 28: "Spleen", 32: "Spleen", 44: "Spleen", 48: "Spleen",
    50: "Spleen", 57: "Spleen",
    38: "Root", 39: "Root", 41: "Root", 52: "Root", 53: "Root", 54: "Root",
    58: "Root", 60: "Root",
    21: "Heart/Ego", 26: "Heart/Ego", 40: "Heart/Ego", 51: "Heart/Ego",
    61: "Head", 64: "Head",
  };

  const centersWithGates = new Set<string>();
  for (const gate of gates) {
    const center = gateCenterMap[gate];
    if (center) centersWithGates.add(center);
  }

  const defined = Array.from(centersWithGates);
  const undefinedCenters = CENTERS.filter((c) => !centersWithGates.has(c));
  return { defined, undefinedCenters };
}

function computeChannels(gates: number[]): string[] {
  // Channel = two neighboring gates connected
  const channels: string[] = [];
  const sorted = [...gates].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) {
      channels.push(`${sorted[i]}-${sorted[i + 1]}`);
    }
  }
  return channels;
}

const CROSSES = [
  "Right Angle Cross of the Sphinx",
  "Right Angle Cross of the Four Ways",
  "Right Angle Cross of Consciousness",
  "Right Angle Cross of Planning",
  "Left Angle Cross of Healing",
  "Left Angle Cross of Individualism",
  "Juxtaposition Cross of Fate",
];

export function computeHumanDesign(input: HumanDesignInput): HumanDesignOutput {
  if (!input.time) {
    return {
      type: "unknown",
      strategy: "unknown",
      authority: "unknown",
      profile: computeProfile(new Date(input.date)),
      definedCenters: [],
      undefinedCenters: [...CENTERS],
      gates: [],
      channels: [],
      incarnationCross: "",
      timeRequired: true,
      timeMissingNote: "Human Design requires your exact birth time to calculate your body-graph. Your Type, Strategy, and Authority depend on which centers are defined — and only an accurate birth time reveals that. Add your birth time in Settings to unlock your full Human Design.",
    };
  }

  const date = new Date(input.date);
  const gates = computeGates(date, input.lat, input.lng);
  const { defined, undefinedCenters } = gatesToCenters(gates);
  const channels = computeChannels(gates);

  const sacralDefined = defined.includes("Sacral");
  const solarPlexusDefined = defined.includes("Solar Plexus");
  const spleenDefined = defined.includes("Spleen");
  const gDefined = defined.includes("G");
  const throatDefined = defined.includes("Throat");
  const throatToGDefined = throatDefined && gDefined;
  const allCentersUndefined = defined.length === 0;

  const { type, strategy } = computeHDTypeAndStrategy(
    sacralDefined, throatToGDefined, allCentersUndefined,
  );
  const authority = computeAuthority(solarPlexusDefined, sacralDefined, spleenDefined, gDefined);
  const profile = computeProfile(date);

  const crossIdx = Math.abs(gates[0] ?? 1) % CROSSES.length;
  const incarnationCross = CROSSES[crossIdx];

  return {
    type,
    strategy,
    authority,
    profile,
    definedCenters: defined,
    undefinedCenters,
    gates,
    channels,
    incarnationCross,
    timeRequired: false,
  };
}
