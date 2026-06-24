// Expo push delivery.
export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendExpoPush(messages: ExpoMessage[]): Promise<number> {
  if (!messages.length) return 0;
  const token = Deno.env.get("EXPO_ACCESS_TOKEN");
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.error("Expo push failed:", res.status, (await res.text()).slice(0, 200));
      return 0;
    }
    return messages.length;
  } catch (e) {
    console.error("Expo push error:", e);
    return 0;
  }
}

const KIND_PREF: Record<string, string> = {
  daily_reading: "daily_reading",
  personal_day: "personal_day",
  moon: "moon_alerts",
  ritual: "moon_alerts",
  transit: "transit_alerts",
};

// deno-lint-ignore no-explicit-any
export function prefsAllow(prefs: any, kind: string): boolean {
  if (!prefs) return true;
  const col = KIND_PREF[kind];
  if (!col) return true;
  return prefs[col] !== false;
}
