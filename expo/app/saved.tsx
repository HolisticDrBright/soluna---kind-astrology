import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { useAuth } from "@/state/useAuth";
import { useRemoveSaved, useSaved } from "@/lib/hooks";
import { ChevronLeft, Bookmark, Trash2, Star, Hash, Sparkles, Heart, BookOpen } from "lucide-react-native";

const KIND_META: Record<string, { label: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  reading: { label: "Daily Reading", icon: Star },
  insight: { label: "Insight", icon: Hash },
  tarot: { label: "Tarot", icon: BookOpen },
  compatibility: { label: "Compatibility", icon: Heart },
  synthesis: { label: "Synthesis", icon: Sparkles },
  ritual: { label: "Ritual", icon: Sparkles },
  transit: { label: "Transit", icon: Star },
  placement: { label: "Placement", icon: Star },
};

// deno-lint-ignore no-explicit-any
function itemTitle(item: any): string {
  const p = item.payload ?? {};
  return p.title ?? p.name ?? p.affirmation ?? p.label ?? p.interpretation ?? p.hero ?? item.ref_id ?? "Saved item";
}

export default function SavedScreen() {
  const { authActive, isAuthenticated } = useAuth();
  const live = authActive && isAuthenticated;
  const { data: saved = [], isLoading } = useSaved();
  const remove = useRemoveSaved();

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color={SolunaColors.cream} /></TouchableOpacity>
        <Text style={s.title}>Saved</Text>
        <Text style={s.sub}>Readings, insights, and moments you wanted to keep.</Text>

        {!live && (
          <View style={s.empty}><Bookmark size={22} color={SolunaColors.creamSubtle} />
            <Text style={s.emptyText}>Sign in to keep a collection of your favorite readings and insights across devices.</Text>
          </View>
        )}

        {live && isLoading && <ActivityIndicator color={SolunaColors.warmGold} style={{ marginTop: 40 }} />}

        {live && !isLoading && saved.length === 0 && (
          <View style={s.empty}><Bookmark size={22} color={SolunaColors.creamSubtle} />
            <Text style={s.emptyText}>Nothing saved yet. Tap the bookmark on a reading, tarot pull, or compatibility report to keep it here.</Text>
          </View>
        )}

        {live && saved.map((item) => {
          const meta = KIND_META[item.kind] ?? { label: item.kind, icon: Bookmark };
          const Icon = meta.icon;
          return (
            <View key={item.id} style={s.card}>
              <View style={s.cardIcon}><Icon size={16} color={SolunaColors.warmGold} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardKind}>{meta.label}</Text>
                <Text style={s.cardTitle} numberOfLines={2}>{itemTitle(item)}</Text>
              </View>
              <TouchableOpacity onPress={() => remove.mutate(item.id)} style={s.removeBtn} hitSlop={8}>
                <Trash2 size={16} color={SolunaColors.creamSubtle} />
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  sub: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 20 },
  empty: { alignItems: "center", gap: 12, marginTop: 48, paddingHorizontal: 20 },
  emptyText: { fontSize: 14, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 21, fontFamily: Fonts.body },
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(232,184,109,0.1)", alignItems: "center", justifyContent: "center" },
  cardKind: { fontSize: 10, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 3 },
  cardTitle: { fontSize: 14, color: SolunaColors.cream, fontFamily: Fonts.body, lineHeight: 19 },
  removeBtn: { padding: 4 },
});
