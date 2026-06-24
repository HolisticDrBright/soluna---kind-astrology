// Seeds ONE full mock user (blueprint + 7 days of readings) for frontend dev.
//
// Run after `supabase start`:
//   SUPABASE_URL=http://127.0.0.1:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=<local service role key> \
//   APP_ENCRYPTION_KEY=$(openssl rand -base64 32) \
//   deno run --allow-env --allow-net --allow-read supabase/seed/seed_mock_user.ts
//
// Login in the app with maya@soluna.test / soluna-demo-pass to see real data.

import { createClient } from "supabase";
import { computeBlueprint } from "../functions/_shared/engines/blueprint.ts";
import { encryptField } from "../functions/_shared/crypto.ts";
import { buildContext } from "../functions/_shared/synthesis/context.ts";
import { detectAgreement } from "../functions/_shared/synthesis/agreement.ts";
import { generateDailyReading } from "../functions/_shared/synthesis/synthesis.ts";
import { buildReadingRow } from "../functions/_shared/daily.ts";

const URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL = "maya@soluna.test";
const PASSWORD = "soluna-demo-pass";

const svc = createClient(URL, KEY, { auth: { persistSession: false } });

async function ensureUser(): Promise<string> {
  const { data: created, error } = await svc.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (created?.user) return created.user.id;
  if (error && !/already/i.test(error.message)) throw error;
  // Already exists — find them.
  const { data } = await svc.auth.admin.listUsers();
  const found = data.users.find((u) => u.email === EMAIL);
  if (!found) throw new Error("could not create or find mock user");
  return found.id;
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const MOCK = {
  fullName: "Maya Elizabeth Chen",
  preferredName: "Maya",
  birthDate: "1995-06-22",
  birthTime: "14:35",
  lat: 45.5152,
  lng: -122.6784,
  timezone: "America/Los_Angeles",
  placeLabel: "Portland, Oregon, USA",
};

console.log("Seeding mock user…");
const userId = await ensureUser();

await svc.from("users").upsert({ id: userId, email: EMAIL, preferred_name: MOCK.preferredName });
await svc.from("birth_profiles").upsert({
  user_id: userId,
  full_birth_name_enc: await encryptField(MOCK.fullName),
  birth_date: MOCK.birthDate,
  birth_time: MOCK.birthTime,
  time_known: true,
  birth_place_label: MOCK.placeLabel,
  lat: MOCK.lat,
  lng: MOCK.lng,
  timezone: MOCK.timezone,
  house_system: "placidus",
}, { onConflict: "user_id" });

const input = {
  date: MOCK.birthDate,
  time: MOCK.birthTime,
  lat: MOCK.lat,
  lng: MOCK.lng,
  timezone: MOCK.timezone,
  fullName: MOCK.fullName,
};
const { blueprint, placements } = await computeBlueprint(input);

const { data: bp } = await svc.from("blueprints").upsert({
  user_id: userId,
  astrology: blueprint.astrology,
  numerology: blueprint.numerology,
  chinese: blueprint.chinese,
  human_design: blueprint.humanDesign,
  biorhythm_seed: blueprint.biorhythmSeed,
  summary: blueprint.summary,
  computed_at: new Date().toISOString(),
}, { onConflict: "user_id" }).select("id").single();

await svc.from("placements").delete().eq("blueprint_id", bp!.id);
await svc.from("placements").insert(placements.map((p) => ({ blueprint_id: bp!.id, ...p })));
console.log(`Blueprint: ${blueprint.summary.sunSign} sun, ${blueprint.summary.element} ${blueprint.summary.animal}, ${blueprint.summary.hdType ?? "HD n/a"}`);

// 7 days of readings starting today (LLM optional — falls back gracefully).
const start = new Date().toISOString().slice(0, 10);
for (let i = 0; i < 7; i++) {
  const date = addDays(start, i);
  const ctx = await buildContext(userId, date, blueprint, MOCK.preferredName);
  const agreement = detectAgreement(ctx);
  const { reading } = await generateDailyReading(ctx, agreement);
  const row = buildReadingRow(userId, ctx, reading, agreement);
  await svc.from("daily_readings").upsert(row, { onConflict: "user_id,reading_date" });
  console.log(`  reading ${date}: ${agreement.topTheme.title} (${agreement.topTheme.score} systems)`);
}

console.log(`\nDone. Login: ${EMAIL} / ${PASSWORD}`);
