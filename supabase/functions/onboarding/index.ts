// POST /onboarding/blueprint
// Saves the birth profile, computes the blueprint inline (engines are in-process,
// no LLM needed), and returns the reveal summary. Honors unknown birth time.

import { getUser } from "../_shared/auth.ts";
import { json, parse, serve, subPath, ValidationError } from "../_shared/http.ts";
import { onboardingBlueprintInput, type OnboardingBlueprintInput } from "../_shared/schemas.ts";
import { encryptField } from "../_shared/crypto.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { saveBlueprint } from "../_shared/repo.ts";
import { logEvent } from "../_shared/log.ts";
import { computeBlueprint } from "../_shared/engines/blueprint.ts";
import type { BirthInput } from "../_shared/engines/types.ts";

Deno.serve(serve(async (req) => {
  const segs = subPath(req, "onboarding");
  if (req.method !== "POST" || segs[0] !== "blueprint") {
    throw new ValidationError("Use POST /onboarding/blueprint");
  }
  const user = await getUser(req);
  const body = parse<OnboardingBlueprintInput>(onboardingBlueprintInput, await req.json());

  const timeKnown = body.timeKnown ?? !!body.birthTime;
  const svc = serviceClient();

  // Persist identity + encrypted birth profile.
  await svc.from("users").upsert(
    { id: user.id, email: user.email, preferred_name: body.preferredName },
    { onConflict: "id" },
  );

  const nameEnc = await encryptField(body.fullBirthName);
  await svc.from("birth_profiles").upsert(
    {
      user_id: user.id,
      full_birth_name_enc: nameEnc,
      birth_date: body.birthDate,
      birth_time: timeKnown ? (body.birthTime ?? null) : null,
      time_known: timeKnown,
      birth_place_label: body.birthPlaceLabel ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      timezone: body.timezone ?? null,
      house_system: body.houseSystem ?? "placidus",
    },
    { onConflict: "user_id" },
  );

  // Compute + persist blueprint.
  const input: BirthInput = {
    date: body.birthDate,
    time: timeKnown ? (body.birthTime ?? null) : null,
    lat: body.lat,
    lng: body.lng,
    timezone: body.timezone,
    houseSystem: body.houseSystem ?? "placidus",
    fullName: body.fullBirthName,
  };
  const { blueprint, placements } = await computeBlueprint(input);
  await saveBlueprint(user.id, blueprint, placements);
  await logEvent("engine_compute", { source: "onboarding", timeKnown }, user.id);

  return json({
    summary: blueprint.summary,
    needsBirthTime: !timeKnown,
    accuracy: blueprint.accuracy,
    bigThree: {
      sun: blueprint.summary.sunSign,
      moon: blueprint.summary.moonSign,
      rising: blueprint.summary.rising,
    },
    lifePath: blueprint.summary.lifePath,
    chinese: { animal: blueprint.summary.animal, element: blueprint.summary.element },
    humanDesign: blueprint.summary.hdType,
  });
}));
