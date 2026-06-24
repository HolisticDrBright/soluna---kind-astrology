// HumanDesignEngine — computes the chart from planetary longitudes at birth
// (Personality) AND at the design moment (~88° of solar arc before birth, the
// "Design"). Derives gates/lines, defined centers, Type, Strategy, Authority,
// Profile, definition, and incarnation cross.
//
// Honesty: Human Design is entirely time-dependent (the Moon alone moves ~13°/day
// and the design moment is anchored to the exact birth time). With no birth time
// we return a "needs birth time" state rather than a guess.

import { celestialLongitudes } from "./astrology.ts";
import {
  type CenterName,
  CENTER_ORDER,
  CHANNELS,
  GATE_SIZE,
  GATE_TO_CENTER,
  GATE_WHEEL,
  GATE_WHEEL_START,
  LINE_SIZE,
  MOTOR_CENTERS,
} from "./humandesign-data.ts";
import type {
  BirthInput,
  HDActivation,
  HDAuthority,
  HDCenter,
  HDType,
  HumanDesignResult,
  NeedsBirthTime,
} from "./types.ts";
import { needsBirthTime } from "./types.ts";

const HD_BODIES = [
  "Sun", "Earth", "Moon", "NorthNode", "SouthNode", "Mercury", "Venus",
  "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];
const SUN_DEG_PER_DAY = 0.9856;

function gateLine(longitude: number): { gate: number; line: number } {
  const offset = (((longitude - GATE_WHEEL_START) % 360) + 360) % 360;
  const idx = Math.floor(offset / GATE_SIZE);
  const gate = GATE_WHEEL[idx];
  const within = offset - idx * GATE_SIZE;
  const line = Math.min(6, Math.floor(within / LINE_SIZE) + 1);
  return { gate, line };
}

/** Expand the 10 planets + North Node into the 13 HD body longitudes. */
function hdLongitudes(input: BirthInput): Record<string, number> {
  const raw = celestialLongitudes(input);
  const sun = raw["Sun"];
  const nn = raw["NorthNode"];
  return {
    Sun: sun,
    Earth: (sun + 180) % 360,
    Moon: raw["Moon"],
    NorthNode: nn,
    SouthNode: (nn + 180) % 360,
    Mercury: raw["Mercury"],
    Venus: raw["Venus"],
    Mars: raw["Mars"],
    Jupiter: raw["Jupiter"],
    Saturn: raw["Saturn"],
    Uranus: raw["Uranus"],
    Neptune: raw["Neptune"],
    Pluto: raw["Pluto"],
  };
}

function shiftDays(date: string, time: string, days: number): { date: string; time: string } {
  const naive = Date.parse(`${date}T${time}:00Z`) - days * 86_400_000;
  const dt = new Date(naive);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`,
    time: `${p(dt.getUTCHours())}:${p(dt.getUTCMinutes())}`,
  };
}

/** Find the design moment: when the Sun was exactly 88° earlier in longitude. */
function designInput(input: BirthInput, personalitySun: number): BirthInput {
  const target = (((personalitySun - 88) % 360) + 360) % 360;
  let n = 88.0;
  for (let i = 0; i < 8; i++) {
    const s = shiftDays(input.date, input.time!, n);
    const dSun = celestialLongitudes({ ...input, date: s.date, time: s.time })["Sun"];
    const err = (((dSun - target) % 360) + 540) % 360 - 180; // signed shortest [-180,180]
    if (Math.abs(err) < 0.005) break;
    n += err / SUN_DEG_PER_DAY; // dSun decreases as n grows
  }
  const s = shiftDays(input.date, input.time!, n);
  return { ...input, date: s.date, time: s.time };
}

// ─── center / channel graph ────────────────────────────────────────
function definedChannels(activeGates: Set<number>): Array<[number, number]> {
  return CHANNELS.filter(([a, b]) => activeGates.has(a) && activeGates.has(b));
}

/** Union-find over centers linked by defined channels -> connected components. */
function components(defChannels: Array<[number, number]>, definedCenters: Set<CenterName>) {
  const parent = new Map<CenterName, CenterName>();
  const find = (x: CenterName): CenterName => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  };
  for (const c of definedCenters) parent.set(c, c);
  for (const [a, b] of defChannels) {
    const ca = GATE_TO_CENTER[a];
    const cb = GATE_TO_CENTER[b];
    if (parent.has(ca) && parent.has(cb)) parent.set(find(ca), find(cb));
  }
  const roots = new Set<CenterName>();
  for (const c of definedCenters) roots.add(find(c));
  return { find, count: roots.size };
}

function connected(
  defChannels: Array<[number, number]>,
  definedCenters: Set<CenterName>,
  from: CenterName,
  to: CenterName,
): boolean {
  if (!definedCenters.has(from) || !definedCenters.has(to)) return false;
  const { find } = components(defChannels, definedCenters);
  return find(from) === find(to);
}

function authorityFor(defined: Set<CenterName>, type: HDType): HDAuthority {
  if (type === "Reflector") return "Lunar";
  if (defined.has("SolarPlexus")) return "Emotional";
  if (defined.has("Sacral")) return "Sacral";
  if (defined.has("Spleen")) return "Splenic";
  if (defined.has("Heart")) return "Ego";
  if (defined.has("G")) return "Self-Projected";
  return "Mental"; // mental projector (sounding-board / environmental)
}

const TYPE_TRAITS: Record<HDType, { strategy: string; signature: string; notSelf: string }> = {
  "Generator": { strategy: "To Respond", signature: "Satisfaction", notSelf: "Frustration" },
  "Manifesting Generator": { strategy: "To Respond, then inform", signature: "Satisfaction", notSelf: "Frustration" },
  "Manifestor": { strategy: "To Inform", signature: "Peace", notSelf: "Anger" },
  "Projector": { strategy: "To Wait for the Invitation", signature: "Success", notSelf: "Bitterness" },
  "Reflector": { strategy: "To Wait a Lunar Cycle", signature: "Surprise", notSelf: "Disappointment" },
};

function profileAngle(profile: string): string {
  const rightAngle = new Set(["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6"]);
  const leftAngle = new Set(["5/1", "5/2", "6/2", "6/3"]);
  if (profile === "4/1") return "Juxtaposition";
  if (rightAngle.has(profile)) return "Right Angle";
  if (leftAngle.has(profile)) return "Left Angle";
  return "Right Angle";
}

function definitionLabel(count: number): string {
  switch (count) {
    case 0: return "No Definition";
    case 1: return "Single Definition";
    case 2: return "Split Definition";
    case 3: return "Triple Split Definition";
    default: return "Quadruple Split Definition";
  }
}

export function computeHumanDesign(input: BirthInput): HumanDesignResult | NeedsBirthTime {
  if (!input.time) return needsBirthTime("Your full Human Design chart");

  const pers = hdLongitudes(input);
  const design = hdLongitudes(designInput(input, pers["Sun"]));

  const activations: HDActivation[] = [];
  const activeGates = new Set<number>();
  for (const body of HD_BODIES) {
    const { gate, line } = gateLine(pers[body]);
    activations.push({ planet: body, gate, line, side: "personality" });
    activeGates.add(gate);
  }
  for (const body of HD_BODIES) {
    const { gate, line } = gateLine(design[body]);
    activations.push({ planet: body, gate, line, side: "design" });
    activeGates.add(gate);
  }

  const defChannels = definedChannels(activeGates);
  const definedCenters = new Set<CenterName>();
  for (const [a, b] of defChannels) {
    definedCenters.add(GATE_TO_CENTER[a]);
    definedCenters.add(GATE_TO_CENTER[b]);
  }

  const centers: HDCenter[] = CENTER_ORDER.map((name) => ({
    name,
    defined: definedCenters.has(name),
    gates: [...activeGates].filter((g) => GATE_TO_CENTER[g] === name).sort((x, y) => x - y),
  }));

  // Type
  let type: HDType;
  const sacralDefined = definedCenters.has("Sacral");
  const throatToMotor = MOTOR_CENTERS.some((m) =>
    connected(defChannels, definedCenters, m, "Throat")
  );
  if (definedCenters.size === 0) {
    type = "Reflector";
  } else if (sacralDefined) {
    type = throatToMotor ? "Manifesting Generator" : "Generator";
  } else {
    type = throatToMotor ? "Manifestor" : "Projector";
  }

  const authority = authorityFor(definedCenters, type);

  const pSun = activations.find((a) => a.planet === "Sun" && a.side === "personality")!;
  const dSun = activations.find((a) => a.planet === "Sun" && a.side === "design")!;
  const pEarth = activations.find((a) => a.planet === "Earth" && a.side === "personality")!;
  const dEarth = activations.find((a) => a.planet === "Earth" && a.side === "design")!;
  const profile = `${pSun.line}/${dSun.line}`;
  const angle = profileAngle(profile);

  const { count } = components(defChannels, definedCenters);
  const traits = TYPE_TRAITS[type];

  return {
    type,
    strategy: traits.strategy,
    authority,
    profile,
    definition: definitionLabel(count),
    centers,
    definedChannels: defChannels.map(([a, b]) => `${a}-${b}`),
    activations,
    signature: traits.signature,
    notSelf: traits.notSelf,
    incarnationCross:
      `${angle} Cross of gates ${pSun.gate}/${pEarth.gate} | ${dSun.gate}/${dEarth.gate}`,
    timeKnown: true,
  };
}

export { gateLine };
