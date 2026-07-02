/**
 * Safe haptic wrappers — subtle physical feedback is one of the strongest
 * "premium app" signals on iOS. Every call is fire-and-forget and can never
 * throw into UI code (no-ops on web / simulators without haptics).
 */
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const canHaptic = Platform.OS === "ios" || Platform.OS === "android";

/** Light tick — chips, toggles, small taps. */
export function tapLight(): void {
  if (!canHaptic) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Selection change — pickers, lens/mood switches. */
export function tapSelect(): void {
  if (!canHaptic) return;
  Haptics.selectionAsync().catch(() => {});
}

/** Medium thump — drawing cards, submitting something meaningful. */
export function tapMedium(): void {
  if (!canHaptic) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Success notification — saves, completed actions. */
export function tapSuccess(): void {
  if (!canHaptic) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
