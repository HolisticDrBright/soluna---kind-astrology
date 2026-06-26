/**
 * BlueprintService — orchestrator that runs all engines and persists a normalized blueprint.
 * Single source of truth. Recompute only when birth data changes.
 */

import { computeAstrology, type AstrologyInput, type AstrologyOutput } from "./astrology.ts";
import { computeNumerology, type NumerologyInput, type NumerologyOutput } from "./numerology.ts";
import { computeChinese, type ChineseInput, type ChineseOutput } from "./chinese.ts";
import { computeHumanDesign, type HumanDesignInput, type HumanDesignOutput } from "./human-design.ts";
import { computeBiorhythm, type BiorhythmInput, type BiorhythmOutput } from "./biorhythm.ts";
import { getSupabaseAdmin, logEvent } from "../supabase.ts";

export interface BirthProfile {
  id?: string;
  user_id: string;
  full_birth_name: string;
  birth_date: string; // ISO date
  birth_time: string | null; // HH:MM
  time_known: boolean;
  birth_place_label?: string;
  lat: number;
  lng: number;
  timezone: string;
  house_system: "placidus" | "whole_sign" | "porphyry";
}

export interface ComputedBlueprint {
  astrology: AstrologyOutput;
  numerology: NumerologyOutput;
  chinese: ChineseOutput;
  humanDesign: HumanDesignOutput;
  biorhythmSeed: BiorhythmOutput;
  computedAt: string;
}

export interface PlacementRecord {
  blueprint_id: string;
  system: string;
  key: string;
  label: string;
  detail: Record<string, unknown>;
}

/**
 * Compute the full blueprint from birth data.
 * Runs ALL engines.
 */
export async function computeBlueprint(profile: BirthProfile): Promise<ComputedBlueprint> {
  const birthDate = new Date(profile.birth_date);

  // Astrology
  const astroInput: AstrologyInput = {
    date: profile.birth_date,
    time: profile.birth_time,
    lat: profile.lat,
    lng: profile.lng,
    timezone: profile.timezone,
    houseSystem: profile.house_system,
  };
  const astrology = await computeAstrology(astroInput);

  // Numerology
  const numInput: NumerologyInput = {
    fullBirthName: profile.full_birth_name,
    birthDate,
  };
  const numerology = computeNumerology(numInput);

  // Chinese
  const chiInput: ChineseInput = {
    birthDate,
    birthTime: profile.birth_time,
  };
  const chinese = computeChinese(chiInput);

  // Human Design
  const hdInput: HumanDesignInput = {
    date: profile.birth_date,
    time: profile.birth_time,
    lat: profile.lat,
    lng: profile.lng,
  };
  const humanDesign = computeHumanDesign(hdInput);

  // Biorhythm (seed for today)
  const bioInput: BiorhythmInput = { birthDate };
  const biorhythmSeed = computeBiorhythm(bioInput);

  return {
    astrology,
    numerology,
    chinese,
    humanDesign,
    biorhythmSeed,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Build queryable placement records from a blueprint.
 */
export function buildPlacements(blueprintId: string, bp: ComputedBlueprint): PlacementRecord[] {
  const placements: PlacementRecord[] = [];

  // Astrology placements
  for (const p of bp.astrology.planets) {
    placements.push({
      blueprint_id: blueprintId,
      system: "astrology",
      key: `planet_${p.planet.toLowerCase()}`,
      label: `${p.planet} in ${p.sign}${p.house ? ` (${p.house}H)` : ""}`,
      detail: { planet: p.planet, sign: p.sign, degree: p.degree, house: p.house, retrograde: p.retrograde },
    });
  }
  if (bp.astrology.ascendant) {
    placements.push({
      blueprint_id: blueprintId,
      system: "astrology",
      key: "ascendant",
      label: `Rising: ${bp.astrology.ascendant.sign}`,
      detail: { sign: bp.astrology.ascendant.sign, degree: bp.astrology.ascendant.degree },
    });
  }
  // Astrology aspect highlights
  for (const a of bp.astrology.aspects.slice(0, 5)) {
    placements.push({
      blueprint_id: blueprintId,
      system: "astrology",
      key: `aspect_${a.planetA.toLowerCase()}_${a.planetB.toLowerCase()}`,
      label: `${a.planetA} ${a.type} ${a.planetB}`,
      detail: { planetA: a.planetA, planetB: a.planetB, type: a.type, orb: a.orb },
    });
  }

  // Numerology placements
  const numFields: Array<{ key: string; label: string; value: number; master: boolean }> = [
    { key: "life_path", label: "Life Path Number", value: bp.numerology.lifePath, master: bp.numerology.lifePathMaster },
    { key: "expression", label: "Expression / Destiny Number", value: bp.numerology.expression, master: bp.numerology.expressionMaster },
    { key: "soul_urge", label: "Soul Urge Number", value: bp.numerology.soulUrge, master: bp.numerology.soulUrgeMaster },
    { key: "personality", label: "Personality Number", value: bp.numerology.personality, master: bp.numerology.personalityMaster },
    { key: "birthday", label: "Birthday Number", value: bp.numerology.birthday, master: false },
  ];
  for (const nf of numFields) {
    placements.push({
      blueprint_id: blueprintId,
      system: "numerology",
      key: nf.key,
      label: `${nf.label}: ${nf.value}${nf.master ? " (Master Number)" : ""}`,
      detail: { number: nf.value, isMaster: nf.master },
    });
  }

  // Chinese placements
  placements.push({
    blueprint_id: blueprintId,
    system: "chinese",
    key: "animal",
    label: `Zodiac Animal: ${bp.chinese.animal}`,
    detail: { animal: bp.chinese.animal, element: bp.chinese.element, yinYang: bp.chinese.yinYang, animalEmoji: bp.chinese.animalEmoji },
  });
  placements.push({
    blueprint_id: blueprintId,
    system: "chinese",
    key: "year_pillar",
    label: `Year Pillar: ${bp.chinese.fourPillars.year.stem}${bp.chinese.fourPillars.year.branch} (${bp.chinese.fourPillars.year.branchAnimal})`,
    detail: {
      type: "year",
      stem: bp.chinese.fourPillars.year.stem,
      branch: bp.chinese.fourPillars.year.branch,
      element: bp.chinese.fourPillars.year.stemElement,
      animal: bp.chinese.fourPillars.year.branchAnimal,
    },
  });
  placements.push({
    blueprint_id: blueprintId,
    system: "chinese",
    key: "month_pillar",
    label: `Month Pillar: ${bp.chinese.fourPillars.month.stem}${bp.chinese.fourPillars.month.branch}`,
    detail: {
      type: "month",
      stem: bp.chinese.fourPillars.month.stem,
      branch: bp.chinese.fourPillars.month.branch,
      element: bp.chinese.fourPillars.month.stemElement,
      animal: bp.chinese.fourPillars.month.branchAnimal,
    },
  });

  // Human Design placements
  const hdFields: Array<{ key: string; label: string; detail: Record<string, unknown> }> = [
    { key: "type", label: `Type: ${bp.humanDesign.type}`, detail: { type: bp.humanDesign.type } },
    { key: "strategy", label: `Strategy: ${bp.humanDesign.strategy}`, detail: { strategy: bp.humanDesign.strategy } },
    { key: "authority", label: `Authority: ${bp.humanDesign.authority}`, detail: { authority: bp.humanDesign.authority } },
    { key: "profile", label: `Profile: ${bp.humanDesign.profile}`, detail: { profile: bp.humanDesign.profile } },
    { key: "incarnation_cross", label: `Incarnation Cross: ${bp.humanDesign.incarnationCross}`, detail: { incarnationCross: bp.humanDesign.incarnationCross } },
  ];
  for (const hd of hdFields) {
    placements.push({
      blueprint_id: blueprintId,
      system: "human_design",
      key: hd.key,
      label: hd.label,
      detail: hd.detail,
    });
  }

  return placements;
}

/**
 * Persist blueprint and placements to the database.
 * Handles the full compute-and-store pipeline.
 */
export async function computeAndPersistBlueprint(
  profile: BirthProfile,
  userId: string,
): Promise<{ blueprintId: string; summary: Record<string, unknown> }> {
  const sb = getSupabaseAdmin();

  // Compute blueprint
  const bp = await computeBlueprint(profile);

  // Upsert blueprint
  const { data: blueprintRow, error: bpErr } = await sb.from("blueprints")
    .upsert({
      user_id: userId,
      astrology: bp.astrology,
      numerology: bp.numerology,
      chinese: bp.chinese,
      human_design: bp.humanDesign,
      biorhythm_seed: bp.biorhythmSeed,
      computed_at: bp.computedAt,
    }, { onConflict: "user_id" })
    .select("id")
    .single();

  if (bpErr || !blueprintRow) {
    throw new Error(`Failed to persist blueprint: ${bpErr?.message ?? "no row returned"}`);
  }

  const blueprintId = blueprintRow.id;

  // Build and upsert placements
  const placements = buildPlacements(blueprintId, bp);

  // Delete old placements and re-insert
  await sb.from("placements").delete().eq("blueprint_id", blueprintId);

  if (placements.length > 0) {
    const { error: pErr } = await sb.from("placements").insert(placements);
    if (pErr) {
      console.error("Failed to insert placements:", pErr.message);
    }
  }

  // Build summary for onboarding reveal
  const summary = {
    sun: bp.astrology.planets.find((p) => p.planet === "Sun")?.sign ?? "Unknown",
    moon: bp.astrology.planets.find((p) => p.planet === "Moon")?.sign ?? "Unknown",
    rising: bp.astrology.ascendant?.sign ?? "unknown",
    lifePath: bp.numerology.lifePath,
    animal: bp.chinese.animal,
    hdType: bp.humanDesign.type,
  };

  await logEvent("blueprint_computed", { blueprintId }, userId);

  return { blueprintId, summary };
}
