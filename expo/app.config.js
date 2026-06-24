// Extends the static app.json with the expo-notifications plugin and passes
// public config through `extra`. EXPO_PUBLIC_* vars are already inlined by the
// bundler; this just keeps everything in one place for EAS builds.
const base = require("./app.json");

module.exports = () => {
  const expo = { ...base.expo };
  const plugins = [...(expo.plugins ?? [])];
  if (!plugins.includes("expo-notifications")) plugins.push("expo-notifications");

  return {
    ...expo,
    plugins,
    extra: {
      ...(expo.extra ?? {}),
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
      functionsUrl: process.env.EXPO_PUBLIC_FUNCTIONS_URL ?? "",
      revenuecatKey: process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? "",
    },
  };
};
