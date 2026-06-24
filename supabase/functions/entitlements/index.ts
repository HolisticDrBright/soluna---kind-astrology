// GET /entitlements -> current entitlement state for paywall / gating
import { getUser } from "../_shared/auth.ts";
import { json, serve } from "../_shared/http.ts";
import { getEntitlement } from "../_shared/entitlements.ts";

Deno.serve(serve(async (req) => {
  const user = await getUser(req);
  const entitlement = await getEntitlement(user.id);
  return json({
    ...entitlement,
    isPremium: entitlement.entitlement === "premium",
    features: {
      unlimitedAsk: entitlement.entitlement === "premium",
      fullLenses: entitlement.entitlement === "premium",
      extraTarotSpreads: entitlement.entitlement === "premium",
    },
  });
}));
