// Feature flags.
//
// USE_MOCK_DATA keeps the entire UI runnable WITHOUT the backend (every screen
// renders from constants/mockData). Flip it off — or set EXPO_PUBLIC_USE_MOCK_DATA
// to "false" / "0" — once the Supabase backend is reachable. When mock mode is
// off, screens read from the React Query hooks in lib/hooks.ts.
const envFlag = process.env.EXPO_PUBLIC_USE_MOCK_DATA;

export const USE_MOCK_DATA: boolean = envFlag === undefined
  ? true // default: mock on, so the app always runs out of the box
  : !(envFlag === "false" || envFlag === "0");
