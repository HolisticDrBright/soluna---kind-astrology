// Seeds TWO full mock users (blueprints + readings) and a linked Bond between
// them, for frontend dev. Run after `supabase start`:
//   SUPABASE_URL=http://127.0.0.1:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=<local service role key> \
//   APP_ENCRYPTION_KEY=$(openssl rand -base64 32) \
//   deno run --allow-env --allow-net --allow-read supabase/seed/seed_mock_user.ts
//
// Logins: maya@soluna.test / soluna-demo-pass  (and sam@soluna.test)

import { createClient } from "supabase";
import { computeBlueprint } from "../functions/_shared/engines/blueprint.ts";
import { encryptField } from "../functions/_shared/crypto.ts";
import { buildContext } from "../functions/_shared/synthesis/context.ts";
import { detectAgreement } from "../functions/_shared/synthesis/agreement.ts";
import { generateDailyReading, generateBondReading, shareFacets } from "../functions/_shared/synthesis/synthesis.ts";
import { buildReadingRow } from "../functions/_shared/daily.ts";
import { computeTransits } from "../functions/_shared/engines/astrology.ts";

const URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const svc = createClient(URL, KEY, { auth: { persistSession: false } });

interface MockProfile {
  email: string;
  password: string;
  fullName: string;
  preferredName: string;
  birthDate: string;
  birthTime: string;
  lat: number;
  lng: number;
  timezone: string;
  placeLabel: string;
}

const MAYA: MockProfile = {
  email: "maya@soluna.test", password: "soluna-demo-pass",
  fullName: "Maya Elizabeth Chen", preferredName: "Maya",
  birthDate: "1995-06-22", birthTime: "14:35",
  lat: 45.5152, lng: -122.6784, timezone: "America/Los_Angeles", placeLabel: "Portland, Oregon, USA",
};
const SAM: MockProfile = {
  email: "sam@soluna.test", password: "soluna-demo-pass",
  fullName: "Samuel Tan", preferredName: "Sam",
  birthDate: "1990-11-08", birthTime: "09:15",
  lat: 37.7749, lng: -122.4194, timezone: "America/Los_Angeles", placeLabel: "San Francisco, California, USA",
};

async function ensureUser(p: MockProfile): Promise<string> {
  const { data: created, error } = await svc.auth.admin.createUser({
    email: p.email, password: p.password, email_confirm: true,
  });
  if (created?.user) return created.user.id;
  if (error && !/already/i.test(error.message)) throw error;
  const { data } = await svc.auth.admin.listUsers();
  const found = data.users.find((u) => u.email === p.email);
  if (!found) throw new Error(`could not create or find ${p.email}`);
  return found.id;
}

async function provision(p: MockProfile) {
  const userId = await ensureUser(p);
  await svc.from("users").upsert({ id: userId, email: p.email, preferred_name: p.preferredName });
  await svc.from("birth_profiles").upsert({
    user_id: userId,
    full_birth_name_enc: await encryptField(p.fullName),
    birth_date: p.birthDate,
    birth_time: p.birthTime,
    time_known: true,
    birth_place_label: p.placeLabel,
    lat: p.lat, lng: p.lng, timezone: p.timezone, house_system: "placidus",
  }, { onConflict: "user_id" });

  const { blueprint, placements } = await computeBlueprint({
    date: p.birthDate, time: p.birthTime, lat: p.lat, lng: p.lng, timezone: p.timezone, fullName: p.fullName,
  });
  const { data: bp } = await svc.from("blueprints").upsert({
    user_id: userId,
    astrology: blueprint.astrology, numerology: blueprint.numerology, chinese: blueprint.chinese,
    human_design: blueprint.humanDesign, biorhythm_seed: blueprint.biorhythmSeed, summary: blueprint.summary,
    computed_at: new Date().toISOString(),
  }, { onConflict: "user_id" }).select("id").single();
  await svc.from("placements").delete().eq("blueprint_id", bp!.id);
  await svc.from("placements").insert(placements.map((pl) => ({ blueprint_id: bp!.id, ...pl })));
  console.log(`  ${p.preferredName}: ${blueprint.summary.sunSign} sun, ${blueprint.summary.element} ${blueprint.summary.animal}, ${blueprint.summary.hdType ?? "HD n/a"}`);
  return { userId, blueprint };
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

console.log("Seeding mock users…");
const maya = await provision(MAYA);
const sam = await provision(SAM);

// 7 days of daily readings for Maya.
const start = new Date().toISOString().slice(0, 10);
for (let i = 0; i < 7; i++) {
  const date = addDays(start, i);
  const ctx = await buildContext(maya.userId, date, maya.blueprint, MAYA.preferredName);
  const agreement = detectAgreement(ctx);
  const { reading } = await generateDailyReading(ctx, agreement);
  await svc.from("daily_readings").upsert(buildReadingRow(maya.userId, ctx, reading, agreement), {
    onConflict: "user_id,reading_date",
  });
}
console.log("  7 daily readings seeded for Maya.");

// Link Maya <-> Sam as an active romance Bond (+ invite/referral for realism).
const { data: invite } = await svc.from("partner_invites").upsert({
  inviter_user_id: maya.userId, invite_code: "DEMOBND", lens: "romance",
  status: "accepted", accepted_user_id: sam.userId, reward_granted: true,
  accepted_at: new Date().toISOString(),
}, { onConflict: "invite_code" }).select("id").single();

const { data: link } = await svc.from("partner_links").upsert({
  user_a: maya.userId, user_b: sam.userId, lens: "romance", status: "active",
}, { onConflict: "user_a,user_b" }).select("*").single();

await svc.from("referrals").upsert({
  referrer_user_id: maya.userId, referred_user_id: sam.userId, source: "partner_invite", invite_id: invite!.id,
}, { onConflict: "referrer_user_id,referred_user_id" });

// Today's bond reading.
const today = start;
const transits = computeTransits(today);
const a = shareFacets(MAYA.preferredName, maya.blueprint.summary, link!.a_share_prefs);
const b = shareFacets(SAM.preferredName, sam.blueprint.summary, link!.b_share_prefs);
const { reading: bond } = await generateBondReading(a, b, "romance", {
  moonPhase: transits.moon.phase, moonSign: transits.moon.sign,
});
await svc.from("bond_readings").upsert({
  link_id: link!.id, reading_date: today,
  together_text: bond.togetherText, flow_grow: bond.flowGrow, shared_weather: bond.sharedWeather,
}, { onConflict: "link_id,reading_date" });
console.log(`  Bond linked: ${MAYA.preferredName} ❤ ${SAM.preferredName} (romance) with today's reading.`);

console.log(`\nDone. Logins: ${MAYA.email} / ${SAM.email}  (password: soluna-demo-pass)`);
