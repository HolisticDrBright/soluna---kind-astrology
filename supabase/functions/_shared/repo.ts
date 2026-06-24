// Data-access helpers (service-role). Centralizes blueprint (de)serialization so
// Edge Functions stay thin.
import { serviceClient } from "./supabase.ts";
import { decryptField } from "./crypto.ts";
import type { Blueprint, PlacementRow } from "./engines/blueprint.ts";
import type { BirthInput } from "./engines/types.ts";

export async function loadBlueprint(userId: string): Promise<Blueprint | null> {
  const { data } = await serviceClient()
    .from("blueprints")
    .select("astrology, numerology, chinese, human_design, biorhythm_seed, summary, accuracy")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    astrology: data.astrology,
    numerology: data.numerology,
    chinese: data.chinese,
    humanDesign: data.human_design,
    biorhythmSeed: data.biorhythm_seed,
    summary: data.summary,
    accuracy: data.accuracy,
  } as Blueprint;
}

export async function saveBlueprint(
  userId: string,
  blueprint: Blueprint,
  placements: PlacementRow[],
): Promise<void> {
  const svc = serviceClient();
  const { data: bp, error } = await svc
    .from("blueprints")
    .upsert(
      {
        user_id: userId,
        astrology: blueprint.astrology,
        numerology: blueprint.numerology,
        chinese: blueprint.chinese,
        human_design: blueprint.humanDesign,
        biorhythm_seed: blueprint.biorhythmSeed,
        summary: blueprint.summary,
        accuracy: blueprint.accuracy,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();
  if (error || !bp) throw new Error(`saveBlueprint failed: ${error?.message}`);

  await svc.from("placements").delete().eq("blueprint_id", bp.id);
  if (placements.length) {
    await svc.from("placements").insert(
      placements.map((p) => ({
        blueprint_id: bp.id,
        system: p.system,
        key: p.key,
        label: p.label,
        detail: p.detail,
      })),
    );
  }
}

export async function loadPlacements(userId: string, system?: string) {
  const svc = serviceClient();
  const { data: bp } = await svc.from("blueprints").select("id").eq("user_id", userId).maybeSingle();
  if (!bp) return [];
  let q = svc.from("placements").select("system, key, label, detail").eq("blueprint_id", bp.id);
  if (system) q = q.eq("system", system);
  const { data } = await q;
  return data ?? [];
}

export async function loadPreferredName(userId: string): Promise<string> {
  const { data } = await serviceClient()
    .from("users")
    .select("preferred_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.preferred_name ?? "friend";
}

export async function loadBirthProfile(userId: string) {
  const { data } = await serviceClient()
    .from("birth_profiles")
    .select("birth_date, birth_time, time_known, lat, lng, timezone, house_system, full_birth_name_enc")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

/** Reconstruct engine input from the stored (encrypted) birth profile. */
export async function birthInputFor(userId: string): Promise<BirthInput | null> {
  const p = await loadBirthProfile(userId);
  if (!p) return null;
  let fullName = "";
  if (p.full_birth_name_enc) {
    try {
      fullName = await decryptField(p.full_birth_name_enc);
    } catch {
      fullName = "";
    }
  }
  return {
    date: p.birth_date,
    time: p.time_known ? (p.birth_time ?? null) : null,
    lat: p.lat ?? undefined,
    lng: p.lng ?? undefined,
    timezone: p.timezone ?? undefined,
    houseSystem: (p.house_system ?? "placidus") as BirthInput["houseSystem"],
    fullName,
  };
}

export function todayISO(tz?: string): string {
  // Server-local date in the given IANA tz (defaults to UTC).
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}
