import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import SolunaColors from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import type { LucideIcon } from "lucide-react-native";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={s.wrap}>
      <View style={s.iconCircle}>
        <Icon size={28} color={SolunaColors.warmGold} />
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.desc}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={s.actionBtn} onPress={onAction} activeOpacity={0.8}>
          <Text style={s.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 20 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(232,184,109,0.08)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(232,184,109,0.12)",
  },
  title: {
    fontSize: 18, fontFamily: Fonts.heading, color: SolunaColors.cream,
    marginBottom: 8, textAlign: "center",
  },
  desc: {
    fontSize: 14, color: SolunaColors.creamMuted, textAlign: "center",
    lineHeight: 21, fontFamily: Fonts.body, maxWidth: 280, marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: "rgba(232,184,109,0.1)", borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1,
    borderColor: "rgba(232,184,109,0.2)",
  },
  actionText: {
    fontSize: 14, color: SolunaColors.warmGold, fontWeight: "600",
    fontFamily: Fonts.body,
  },
});
