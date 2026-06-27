import { View, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronLeft, Sparkles } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import SolunaColors, { SolunaSpacing } from "@/constants/colors";
import EmptyState from "@/components/EmptyState";

/**
 * Full-screen honest state for screens that aren't wired to live data yet.
 * In demo mode those screens render beautiful sample content; in live/production
 * mode they render this instead of fake data.
 */
export default function ComingSoon({
  title = "Coming soon",
  description = "This isn't connected to your live data yet. It'll appear here automatically once it's ready — no fake placeholders in the meantime.",
  icon = Sparkles,
  showBack = true,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  showBack?: boolean;
}) {
  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <View style={s.inner}>
        {showBack && (
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} accessibilityLabel="Go back">
            <ChevronLeft size={24} color={SolunaColors.cream} />
          </TouchableOpacity>
        )}
        <View style={s.center}>
          <EmptyState icon={icon} title={title} description={description} />
        </View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
