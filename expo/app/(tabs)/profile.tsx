import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { ZODIAC_SYMBOLS, Fonts } from "@/constants/mockData";
import {
  Sun,
  Moon,
  Star,
  Bell,
  Clock,
  Lock,
  ChevronRight,
  Sparkles,
  Crown,
  LogOut,
  Shield,
  CircleHelp,
} from "lucide-react-native";

// ─── Setting Row ──────────────────────────────────────────────────
function SettingRow({
  icon,
  label,
  value,
  onPress,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[rowStyles.row, !isLast && rowStyles.border]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={rowStyles.icon}>{icon}</View>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.right}>
        {value && <Text style={rowStyles.value}>{value}</Text>}
        {onPress && <ChevronRight size={16} color={SolunaColors.creamSubtle} />}
      </View>
    </TouchableOpacity>
  );
}

function SettingToggle({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={[rowStyles.row, rowStyles.border]}>
      <View style={rowStyles.icon}>{icon}</View>
      <Text style={rowStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: "rgba(255,255,255,0.1)",
          true: "rgba(232,184,109,0.3)",
        }}
        thumbColor={value ? SolunaColors.warmGold : SolunaColors.creamSubtle}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
    paddingHorizontal: 4,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 13,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
});

// ─── Premium Banner ───────────────────────────────────────────────
function PremiumBanner() {
  return (
    <TouchableOpacity
      style={premStyles.wrap}
      onPress={() => router.push("/paywall")}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={["rgba(232,184,109,0.12)", "rgba(242,168,141,0.06)"]}
        style={premStyles.inner}
      >
        <View style={premStyles.topRow}>
          <Crown size={20} color={SolunaColors.warmGold} />
          <View style={premStyles.premBadge}>
            <Text style={premStyles.premBadgeText}>SOLUNA PREMIUM</Text>
          </View>
        </View>
        <Text style={premStyles.title}>
          Unlock the full experience
        </Text>
        <Text style={premStyles.body}>
          Unlimited chart readings, complete compatibility insights, all
          transits, and exclusive daily content.
        </Text>
        <View style={premStyles.cta}>
          <Text style={premStyles.ctaText}>Go Premium</Text>
          <ChevronRight size={16} color={SolunaColors.deepIndigo} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const premStyles = StyleSheet.create({
  wrap: {
    borderRadius: SolunaRadius.lg,
    overflow: "hidden",
    marginBottom: 24,
  },
  inner: {
    padding: 20,
    borderRadius: SolunaRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(232,184,109,0.15)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  premBadge: {
    backgroundColor: "rgba(232,184,109,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: SolunaColors.warmGold,
    letterSpacing: 1.5,
    fontFamily: Fonts.body,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    color: SolunaColors.creamMuted,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Fonts.body,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: SolunaColors.warmGold,
    paddingVertical: 12,
    borderRadius: SolunaRadius.md,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
    color: SolunaColors.deepIndigo,
    fontFamily: Fonts.body,
  },
});

// ─── Profile Screen ──────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, resetOnboarding } = useAppState();
  const [dailyReading, setDailyReading] = useState(true);
  const [moonAlerts, setMoonAlerts] = useState(true);
  const [transitAlerts, setTransitAlerts] = useState(false);

  if (!user) return null;

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={screenStyles.gradient}
    >
      <ScrollView
        style={screenStyles.scroll}
        contentContainerStyle={screenStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={screenStyles.profileHeader}>
          <View style={screenStyles.avatarLarge}>
            <Text style={screenStyles.avatarLargeText}>
              {user.name.charAt(0)}
            </Text>
          </View>
          <Text style={screenStyles.userName}>{user.name}</Text>
          <View style={screenStyles.bigThreeChip}>
            <Sun size={12} color={SolunaColors.warmGold} />
            <Text style={screenStyles.bigThreeChipText}>
              {ZODIAC_SYMBOLS[user.chart.sun.sign]} Sun ·{" "}
              {ZODIAC_SYMBOLS[user.chart.moon.sign]} Moon ·{" "}
              {ZODIAC_SYMBOLS[user.chart.rising]} Rising
            </Text>
          </View>
        </View>

        {/* Premium Banner */}
        <PremiumBanner />

        {/* Birth Details */}
        <Text style={screenStyles.sectionTitle}>Your Birth Details</Text>
        <View style={screenStyles.card}>
          <SettingRow
            icon={<Star size={18} color={SolunaColors.warmGold} />}
            label="Birth date"
            value={new Date(user.birthDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <SettingRow
            icon={<Clock size={18} color={SolunaColors.gentleLavender} />}
            label="Birth time"
            value={
              user.birthTimeKnown
                ? user.birthTime
                : "Unknown (noon estimate)"
            }
          />
          <SettingRow
            icon={<Star size={18} color={SolunaColors.softPeach} />}
            label="Birth place"
            value={user.birthPlace}
            isLast
          />
        </View>

        {/* Notification Settings */}
        <Text style={screenStyles.sectionTitle}>Notifications</Text>
        <View style={screenStyles.card}>
          <SettingToggle
            icon={<Bell size={18} color={SolunaColors.warmGold} />}
            label="Daily reading"
            value={dailyReading}
            onChange={setDailyReading}
          />
          <SettingRow
            icon={<Clock size={18} color={SolunaColors.creamMuted} />}
            label="Reading time"
            value="8:00 AM"
          />
          <SettingToggle
            icon={<Moon size={18} color={SolunaColors.gentleLavender} />}
            label="Moon phase alerts"
            value={moonAlerts}
            onChange={setMoonAlerts}
          />
          <SettingToggle
            icon={<Sparkles size={18} color={SolunaColors.softPeach} />}
            label="Big transit heads-up"
            value={transitAlerts}
            onChange={setTransitAlerts}
            // isLast
          />
        </View>

        {/* Widget Preview */}
        <Text style={screenStyles.sectionTitle}>Home Screen Widget</Text>
        <View style={screenStyles.widgetPreview}>
          <Text style={screenStyles.widgetPreviewText}>
            🌙 Widgets that actually work — no blank screens, no bugs. See your
            daily reading and moon phase at a glance.
          </Text>
          <Text style={screenStyles.widgetPreviewComing}>Coming soon</Text>
        </View>

        {/* About & Privacy */}
        <Text style={screenStyles.sectionTitle}>About</Text>
        <View style={screenStyles.card}>
          <SettingRow
            icon={<Lock size={18} color={SolunaColors.gentleLavender} />}
            label="Privacy"
            value="Your data stays private"
            onPress={() => {}}
          />
          <SettingRow
            icon={<Shield size={18} color={SolunaColors.softPeach} />}
            label="Data policy"
            value="We never sell your data"
            onPress={() => {}}
          />
          <SettingRow
            icon={<CircleHelp size={18} color={SolunaColors.creamMuted} />}
            label="About Soluna"
            onPress={() => {}}
            isLast
          />
        </View>

        {/* Reset */}
        <TouchableOpacity
          style={screenStyles.resetBtn}
          onPress={resetOnboarding}
        >
          <LogOut size={16} color={SolunaColors.creamSubtle} />
          <Text style={screenStyles.resetText}>Reset onboarding</Text>
        </TouchableOpacity>

        <Text style={screenStyles.version}>Soluna v1.0 · Made with care</Text>

        <View style={screenStyles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

const screenStyles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(232,184,109,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "rgba(232,184,109,0.2)",
  },
  avatarLargeText: {
    fontSize: 30,
    fontWeight: "700",
    color: SolunaColors.warmGold,
    fontFamily: Fonts.heading,
  },
  userName: {
    fontSize: 24,
    fontFamily: Fonts.heading,
    color: SolunaColors.cream,
    marginBottom: 8,
  },
  bigThreeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bigThreeChipText: {
    fontSize: 11,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  sectionTitle: {
    fontSize: 12,
    color: SolunaColors.creamSubtle,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
    fontFamily: Fonts.body,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    marginBottom: 20,
  },
  widgetPreview: {
    backgroundColor: SolunaColors.cardBg,
    borderRadius: SolunaRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    borderStyle: "dashed",
    marginBottom: 20,
    alignItems: "center",
  },
  widgetPreviewText: {
    fontSize: 13,
    color: SolunaColors.creamMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: Fonts.body,
  },
  widgetPreviewComing: {
    fontSize: 11,
    color: SolunaColors.warmGold,
    fontWeight: "600",
    fontFamily: Fonts.body,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  resetText: {
    fontSize: 13,
    color: SolunaColors.creamSubtle,
    fontFamily: Fonts.body,
  },
  version: {
    fontSize: 11,
    color: SolunaColors.creamSubtle,
    textAlign: "center",
    fontFamily: Fonts.body,
    marginTop: 4,
  },
  bottomSpacer: { height: 100 },
});
