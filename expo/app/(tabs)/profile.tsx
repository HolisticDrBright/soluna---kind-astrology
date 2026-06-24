import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { useAuth } from "@/state/useAuth";
import { useEntitlements, useMe } from "@/lib/hooks";
import { api } from "@/lib/apiClient";
import { ZODIAC_SYMBOLS, CHINESE_ANIMAL_EMOJI, Fonts } from "@/constants/mockData";
import { getBlueprintSummary } from "@/constants/mockData";
import { Sun, Moon, Star, Bell, Clock, Lock, ChevronRight, Sparkles, Crown, LogOut, Shield, CircleHelp, Hash, Bird, Cpu, Heart, Bookmark } from "lucide-react-native";

function SettingRow({ icon, label, value, onPress, isLast }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void; isLast?: boolean }) {
  return (
    <TouchableOpacity style={[rS.row, !isLast && rS.border]} onPress={onPress} activeOpacity={0.6}>
      <View style={rS.icon}>{icon}</View>
      <Text style={rS.label}>{label}</Text>
      <View style={rS.right}>{value && <Text style={rS.value}>{value}</Text>}{onPress && <ChevronRight size={16} color={SolunaColors.creamSubtle} />}</View>
    </TouchableOpacity>
  );
}
function SettingToggle({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[rS.row, rS.border]}>
      <View style={rS.icon}>{icon}</View>
      <Text style={rS.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(232,184,109,0.3)" }} thumbColor={value ? SolunaColors.warmGold : SolunaColors.creamSubtle} />
    </View>
  );
}
const rS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14, paddingHorizontal: 4 },
  border: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: 15, color: SolunaColors.cream, fontFamily: Fonts.body },
  right: { flexDirection: "row", alignItems: "center", gap: 6 },
  value: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
});

function SystemChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={cS.wrap}>
      <Text style={[cS.value, { color }]}>{value}</Text>
      <Text style={cS.label}>{label}</Text>
    </View>
  );
}
const cS = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: 8, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", minWidth: 60 },
  value: { fontSize: 14, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 2 },
  label: { fontSize: 9, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "600", fontFamily: Fonts.body },
});

function PremiumBanner() {
  return (
    <TouchableOpacity style={pS.wrap} onPress={() => router.push("/paywall")} activeOpacity={0.8}>
      <LinearGradient colors={["rgba(232,184,109,0.12)", "rgba(242,168,141,0.06)"]} style={pS.inner}>
        <View style={pS.topRow}>
          <Crown size={20} color={SolunaColors.warmGold} />
          <View style={pS.premBadge}><Text style={pS.premBadgeText}>SOLUNA PREMIUM</Text></View>
        </View>
        <Text style={pS.title}>Unlock your full Blueprint</Text>
        <Text style={pS.body}>All four lenses fully unlocked, unlimited Ask Soluna, cross-system reports, full compatibility, and more.</Text>
        <View style={pS.cta}><Text style={pS.ctaText}>Go Premium</Text><ChevronRight size={16} color={SolunaColors.deepIndigo} /></View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const pS = StyleSheet.create({
  wrap: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginBottom: 24 },
  inner: { padding: 20, borderRadius: SolunaRadius.lg, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  premBadge: { backgroundColor: "rgba(232,184,109,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  premBadgeText: { fontSize: 9, fontWeight: "800", color: SolunaColors.warmGold, letterSpacing: 1.5, fontFamily: Fonts.body },
  title: { fontSize: 18, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 8 },
  body: { fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 20, marginBottom: 16, fontFamily: Fonts.body },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: SolunaColors.warmGold, paddingVertical: 12, borderRadius: SolunaRadius.md },
  ctaText: { fontSize: 15, fontWeight: "700", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
});

export default function ProfileScreen() {
  const { user, resetOnboarding } = useAppState();
  const { authActive, isAuthenticated, signOut } = useAuth();
  const live = authActive && isAuthenticated;
  const { data: ent } = useEntitlements();
  const { data: me } = useMe();
  const isPremium = !!ent?.isPremium;
  const [dailyReading, setDailyReading] = useState(true);
  const [moonAlerts, setMoonAlerts] = useState(true);
  const [transitAlerts, setTransitAlerts] = useState(false);
  const [personalDayAlert, setPersonalDayAlert] = useState(true);

  useEffect(() => {
    const p = me?.notificationPrefs;
    if (!p) return;
    setDailyReading(p.daily_reading !== false);
    setMoonAlerts(p.moon_alerts !== false);
    setTransitAlerts(!!p.transit_alerts);
    setPersonalDayAlert(!!p.personal_day);
  }, [me]);

  const savePref = (patch: Record<string, boolean>) => {
    if (live) api.patchMe({ notificationPrefs: patch }).catch(() => {});
  };

  if (!user) return null;
  const bp = getBlueprintSummary(user);

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={st.profileHeader}>
          <View style={st.avatarLarge}><Text style={st.avatarLargeText}>{user.preferredName.charAt(0)}</Text></View>
          <Text style={st.userName}>{user.preferredName}</Text>
          {user.fullName !== user.preferredName && <Text style={st.fullName}>{user.fullName}</Text>}

          {/* Blueprint summary chips */}
          <View style={st.summaryRow}>
            <SystemChip label="Sun" value={`${ZODIAC_SYMBOLS[bp.sunSign]} ${bp.sunSign}`} color={SolunaColors.warmGold} />
            <SystemChip label="Moon" value={`${ZODIAC_SYMBOLS[bp.moonSign]} ${bp.moonSign}`} color={SolunaColors.gentleLavender} />
            <SystemChip label="Rising" value={`${ZODIAC_SYMBOLS[bp.rising]} ${bp.rising}`} color={SolunaColors.softPeach} />
          </View>
          <View style={st.summaryRow}>
            <SystemChip label="Life Path" value={String(bp.lifePath)} color={SolunaColors.gentleLavender} />
            <SystemChip label="Chinese" value={`${CHINESE_ANIMAL_EMOJI[bp.animal]} ${bp.animal}`} color={SolunaColors.softPeach} />
            <SystemChip label="Type" value={bp.hdType} color={SolunaColors.warmGold} />
          </View>
        </View>

        {!isPremium && <PremiumBanner />}

        <Text style={st.sectionTitle}>Library</Text>
        <View style={st.card}>
          <SettingRow icon={<Bookmark size={18} color={SolunaColors.warmGold} />} label="Saved items" onPress={() => router.push("/saved")} isLast />
        </View>

        <Text style={st.sectionTitle}>Your Birth Details</Text>
        <View style={st.card}>
          <SettingRow icon={<Star size={18} color={SolunaColors.warmGold} />} label="Full name" value={user.fullName} />
          <SettingRow icon={<Heart size={18} color={SolunaColors.softPeach} />} label="Preferred name" value={user.preferredName} />
          <SettingRow icon={<Star size={18} color={SolunaColors.warmGold} />} label="Birth date" value={new Date(user.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
          <SettingRow icon={<Clock size={18} color={SolunaColors.gentleLavender} />} label="Birth time" value={user.birthTimeKnown ? user.birthTime : "Unknown (noon estimate)"} />
          <SettingRow icon={<Star size={18} color={SolunaColors.softPeach} />} label="Birth place" value={user.birthPlace} isLast />
        </View>

        <Text style={st.sectionTitle}>Notifications</Text>
        <View style={st.card}>
          <SettingToggle icon={<Bell size={18} color={SolunaColors.warmGold} />} label="Daily reading" value={dailyReading} onChange={(v) => { setDailyReading(v); savePref({ dailyReading: v }); }} />
          <SettingRow icon={<Clock size={18} color={SolunaColors.creamMuted} />} label="Reading time" value="8:00 AM" />
          <SettingToggle icon={<Hash size={18} color={SolunaColors.gentleLavender} />} label="Personal Day number" value={personalDayAlert} onChange={(v) => { setPersonalDayAlert(v); savePref({ personalDay: v }); }} />
          <SettingToggle icon={<Moon size={18} color={SolunaColors.gentleLavender} />} label="Moon phase / ritual alerts" value={moonAlerts} onChange={(v) => { setMoonAlerts(v); savePref({ moonAlerts: v }); }} />
          <SettingToggle icon={<Sparkles size={18} color={SolunaColors.softPeach} />} label="Big transit heads-up" value={transitAlerts} onChange={(v) => { setTransitAlerts(v); savePref({ transitAlerts: v }); }} />
        </View>

        <Text style={st.sectionTitle}>Home Screen Widget</Text>
        <View style={st.widgetPreview}>
          <Text style={st.widgetPreviewText}>Widgets that actually work and update — see your daily reading, moon phase, and Personal Day number at a glance. No blank screens, no bugs.</Text>
          <Text style={st.widgetPreviewComing}>Coming soon</Text>
        </View>

        <Text style={st.sectionTitle}>About</Text>
        <View style={st.card}>
          <SettingRow icon={<Lock size={18} color={SolunaColors.gentleLavender} />} label="Privacy" value="Your data stays private" onPress={() => {}} />
          <SettingRow icon={<Shield size={18} color={SolunaColors.softPeach} />} label="Data policy" value="We never sell or train on your data" onPress={() => {}} />
          <SettingRow icon={<CircleHelp size={18} color={SolunaColors.creamMuted} />} label="About Soluna" onPress={() => {}} isLast />
        </View>

        <View style={st.privacyCard}>
          <Shield size={18} color={SolunaColors.warmGold} />
          <Text style={st.privacyText}>Your birth data stays private. We never sell it, never share it, and never train AI on your chats. This is a sacred promise.</Text>
        </View>

        <TouchableOpacity
          style={st.resetBtn}
          onPress={async () => {
            if (live) await signOut();
            resetOnboarding();
          }}
        >
          <LogOut size={16} color={SolunaColors.creamSubtle} />
          <Text style={st.resetText}>{live ? "Sign out" : "Reset onboarding"}</Text>
        </TouchableOpacity>

        <Text style={st.version}>Soluna v1.0 · Made with care</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  gradient: { flex: 1 }, scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  profileHeader: { alignItems: "center", marginBottom: 24 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(232,184,109,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 2, borderColor: "rgba(232,184,109,0.2)" },
  avatarLargeText: { fontSize: 30, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.heading },
  userName: { fontSize: 24, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  fullName: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body, marginBottom: 12 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 12, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, paddingHorizontal: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 20 },
  widgetPreview: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, borderStyle: "dashed", marginBottom: 20, alignItems: "center" },
  widgetPreviewText: { fontSize: 13, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 20, marginBottom: 8, fontFamily: Fonts.body },
  widgetPreviewComing: { fontSize: 11, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  privacyCard: { flexDirection: "row", gap: 12, backgroundColor: "rgba(232,184,109,0.05)", borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.1)", marginBottom: 20, alignItems: "flex-start" },
  privacyText: { flex: 1, fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, marginTop: 8 },
  resetText: { fontSize: 13, color: SolunaColors.creamSubtle, fontFamily: Fonts.body },
  version: { fontSize: 11, color: SolunaColors.creamSubtle, textAlign: "center", fontFamily: Fonts.body, marginTop: 4 },
});
