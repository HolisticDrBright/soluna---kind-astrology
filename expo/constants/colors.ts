export const SolunaColors = {
  // Background
  deepIndigo: "#1A1635",
  plumAubergine: "#2E2147",

  // Accents
  warmGold: "#E8B86D",
  softPeach: "#F2A88D",
  gentleLavender: "#B9A3E3",

  // Text
  cream: "#F5F0E8",
  creamMuted: "#C4BFB5",
  creamSubtle: "#8A8680",

  // Cards & surfaces
  cardBg: "rgba(255,255,255,0.06)",
  cardBgHover: "rgba(255,255,255,0.10)",
  cardBorder: "rgba(255,255,255,0.08)",

  // Tab bar
  tabBarBg: "rgba(18, 15, 40, 0.95)",
  tabInactive: "rgba(245, 240, 232, 0.35)",
  tabActive: "#E8B86D",

  // Misc
  success: "#7BC89C",
  warning: "#E8B86D",
  error: "#F28B82",
  overlay: "rgba(0, 0, 0, 0.6)",
} as const;

export const SolunaRadius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const SolunaSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export default SolunaColors;
