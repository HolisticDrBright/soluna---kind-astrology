/**
 * RLS forgery invariant (acceptance criterion): a normal authenticated user must
 * not be able to directly write generated content. We assert that every owner
 * WRITE policy (insert/update/delete/all) created on public.blueprints and
 * public.daily_readings is ultimately DROPPED by a later migration, while the
 * owner READ policy survives. Parses the real migration files in order.
 * Run: `deno test --allow-env --allow-read supabase/functions/_shared/tests`.
 */

import { assert, assertEquals } from "../test_util.ts";

const GENERATED_TABLES = new Set(["public.blueprints", "public.daily_readings"]);
const WRITE_CMDS = new Set(["insert", "update", "delete", "all"]);

function loadMigrationsInOrder(): string {
  const dir = new URL("../../../migrations/", import.meta.url);
  const names = [...Deno.readDirSync(dir)]
    .filter((e) => e.isFile && e.name.endsWith(".sql"))
    .map((e) => e.name)
    .sort(); // timestamp-prefixed filenames sort chronologically
  return names.map((n) => Deno.readTextFileSync(new URL(n, dir))).join("\n");
}

interface PolicyState {
  present: boolean;
  writeCreate: boolean;
}

Deno.test("no owner WRITE policy survives on generated-content tables", () => {
  const sql = loadMigrationsInOrder();

  // Matches both `create policy "x" on public.t for <cmd> ...` (cmd may be on the
  // next line) and `drop policy if exists "x" on public.t` (no cmd).
  const eventRe =
    /(create|drop)\s+policy\s+(?:if\s+exists\s+)?"([^"]+)"\s+on\s+(public\.\w+)(?:\s+for\s+(select|insert|update|delete|all))?/gi;

  const finalState = new Map<string, PolicyState>();
  let writeCreates = 0;
  let m: RegExpExecArray | null;
  while ((m = eventRe.exec(sql)) !== null) {
    const action = m[1].toLowerCase();
    const name = m[2];
    const table = m[3].toLowerCase();
    const cmd = (m[4] ?? "").toLowerCase();
    if (!GENERATED_TABLES.has(table)) continue;

    const key = `${table}::${name}`;
    const prev = finalState.get(key) ?? { present: false, writeCreate: false };
    if (action === "create") {
      const isWrite = WRITE_CMDS.has(cmd);
      if (isWrite) writeCreates++;
      finalState.set(key, { present: true, writeCreate: prev.writeCreate || isWrite });
    } else {
      finalState.set(key, { present: false, writeCreate: prev.writeCreate });
    }
  }

  // Guard against a vacuous pass: the owner write policies must actually exist in
  // the schema history (3 per table × 2 tables = 6).
  assert(writeCreates >= 6, `expected owner write policies to be present (found ${writeCreates})`);

  const surviving = [...finalState.entries()]
    .filter(([, v]) => v.present && v.writeCreate)
    .map(([k]) => k);
  assertEquals(surviving, [], `forgeable write policy still active: ${surviving.join(", ")}`);

  // Sanity: owners must still be able to READ their own generated content.
  assert(
    finalState.get("public.blueprints::Blueprints selectable by owner")?.present,
    "owner read policy on blueprints must remain",
  );
  assert(
    finalState.get("public.daily_readings::Daily readings selectable by owner")?.present,
    "owner read policy on daily_readings must remain",
  );
});
