// pg_cron (daily): build today's two-person Bond reading for each active link
// and enqueue a push to both partners — making Bonds a daily shared ritual.
import { assertCron } from "../_shared/cron.ts";
import { json, serve } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { loadBlueprint, loadPreferredName, todayISO } from "../_shared/repo.ts";
import { computeTransits } from "../_shared/engines/astrology.ts";
import { generateBondReading, generateBondRitual, shareFacets } from "../_shared/synthesis/synthesis.ts";
import { bondConfidenceNotes, bondEvidence } from "../_shared/synthesis/evidence.ts";
import { logEvent } from "../_shared/log.ts";

Deno.serve(serve(async (req) => {
  assertCron(req);
  const svc = serviceClient();
  const date = todayISO();

  const { data: links } = await svc.from("partner_links").select("*").eq("status", "active");
  let generated = 0;

  for (const link of links ?? []) {
    try {
      const { data: existing } = await svc.from("bond_readings")
        .select("id").eq("link_id", link.id).eq("reading_date", date).maybeSingle();
      if (existing) continue;

      const [bpA, bpB, nameA, nameB] = await Promise.all([
        loadBlueprint(link.user_a),
        loadBlueprint(link.user_b),
        loadPreferredName(link.user_a),
        loadPreferredName(link.user_b),
      ]);
      if (!bpA || !bpB) continue;

      const transits = computeTransits(date);
      const weather = { moonPhase: transits.moon.phase, moonSign: transits.moon.sign };
      const a = shareFacets(nameA, bpA.summary, link.a_share_prefs);
      const b = shareFacets(nameB, bpB.summary, link.b_share_prefs);
      const [{ reading }, { ritual: ritualBody }] = await Promise.all([
        generateBondReading(a, b, link.lens, weather),
        generateBondRitual(a, b, link.lens, weather),
      ]);
      const ritual = {
        ...ritualBody,
        lens: link.lens,
        evidence: bondEvidence(a, b),
        confidenceNotes: bondConfidenceNotes(bpA.summary, bpB.summary),
      };

      await svc.from("bond_readings").upsert({
        link_id: link.id,
        reading_date: date,
        together_text: reading.togetherText,
        flow_grow: reading.flowGrow,
        shared_weather: reading.sharedWeather,
        ritual,
      }, { onConflict: "link_id,reading_date" });

      for (const uid of [link.user_a, link.user_b]) {
        await svc.rpc("queue_send", {
          p_queue: "send_push",
          p_msg: {
            user_id: uid,
            title: "Your shared reading is ready 💫",
            body: reading.togetherText.slice(0, 140),
            kind: "bond",
            data: { route: "/partner", linkId: link.id },
          },
        });
      }
      generated++;
    } catch (e) {
      console.error("bond-reading error:", e);
    }
  }

  await logEvent("cron", { fn: "bond-readings", generated });
  return json({ generated });
}));
