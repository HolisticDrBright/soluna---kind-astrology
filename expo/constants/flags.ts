// Feature flags.
//
// USE_MOCK_DATA keeps the entire UI runnable WITHOUT the backend (every screen
// renders from constants/mockData). It is GATED TO DEV BUILDS: a production
// build never shows mock data, so mock can never be mistaken for real user data.
//
// In dev, mock is ON by default (so the app runs out of the box). Set
// EXPO_PUBLIC_USE_MOCK_DATA="false" (or "0") to point dev at the real backend.
declare const __DEV__: boolean;

const envFlag = process.env.EXPO_PUBLIC_USE_MOCK_DATA;
const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;
const explicitlyOff = envFlag === "false" || envFlag === "0";

export const USE_MOCK_DATA: boolean = isDev
  ? (envFlag === undefined ? true : !explicitlyOff) // dev: default on, opt out
  : false; // production: never mock
