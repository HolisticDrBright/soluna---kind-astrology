import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import SolunaColors from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { Bookmark, BookOpen, MessageCircle } from "lucide-react-native";

interface InsightActionBarProps {
  onSave?: () => void;
  onJournal?: () => void;
  askPrompt?: string;
}

export default function InsightActionBar({ onSave, onJournal, askPrompt }: InsightActionBarProps) {
  const actions: { icon: typeof Bookmark; label: string; onPress: () => void; color: string }[] = [];

  if (onSave) {
    actions.push({ icon: Bookmark, label: "Save", onPress: onSave, color: SolunaColors.creamMuted });
  }
  if (onJournal) {
    actions.push({ icon: BookOpen, label: "Journal", onPress: onJournal, color: SolunaColors.creamMuted });
  }
  if (askPrompt) {
    actions.push({
      icon: MessageCircle,
      label: "Ask Soluna",
      onPress: () => router.push({ pathname: "/(tabs)/ask", params: { prompt: askPrompt } }),
      color: SolunaColors.warmGold,
    });
  }

  if (actions.length === 0) return null;

  return (
    <View style={s.wrap}>
      {actions.map((action, i) => (
        <TouchableOpacity key={i} style={s.btn} onPress={action.onPress} activeOpacity={0.7}>
          <action.icon size={16} color={action.color} />
          <Text style={[s.label, { color: action.color }]}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 20, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  label: { fontSize: 12, fontWeight: "600", fontFamily: Fonts.body },
});
