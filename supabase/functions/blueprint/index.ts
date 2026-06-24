// GET /blueprint            -> full blueprint
// GET /blueprint/:system     -> one lens (astrology|numerology|chinese|human_design)
import { getUser } from "../_shared/auth.ts";
import { HttpError, json, serve, subPath, ValidationError } from "../_shared/http.ts";
import { loadBlueprint, loadPlacements } from "../_shared/repo.ts";

const SYSTEMS = ["astrology", "numerology", "chinese", "human_design"] as const;

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const segs = subPath(req, "blueprint");
  const bp = await loadBlueprint(user.id);
  if (!bp) throw new HttpError(409, "No blueprint yet — complete onboarding first.");

  if (segs.length === 0) {
    return json({ blueprint: bp });
  }

  const system = segs[0];
  if (!SYSTEMS.includes(system as typeof SYSTEMS[number])) {
    throw new ValidationError(`Unknown system. Use one of: ${SYSTEMS.join(", ")}`);
  }
  const data = system === "human_design"
    ? bp.humanDesign
    : (bp as unknown as Record<string, unknown>)[system];
  const placements = await loadPlacements(user.id, system);
  return json({ system, data, placements });
}));
