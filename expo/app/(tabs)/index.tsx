import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated as RNAnimated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useEffect } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { useTodayReading } from "@/lib/hooks";
import {
  ZODIAC_SYMBOLS,
  CHINESE_ANIMAL_EMOJI,
  Fonts,
} from "@/constants/mockData";
import {
  Sun,
  Moon,
  Sparkles,
  Share2,
  MessageCircle,
  Star,
  Hash,
  Bird,
  Heart,
  BookOpen,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Systems Agree Badge ──────────────────────────────────────────
function SystemsAgreeBadge({ count }: { count: number }) {
  const systems = ["♋", "3️⃣", "🐖", "⚡"];
  return (
    <View style={sysBadgeStyles.wrap}>
      <View style={sysBadgeStyles.glyphs}>
        {systems.slice(0, count).map((g, i) => (
          <View key={i} style={sysBadgeStyles.glyph}>
            <Text style={sysBadgeStyles.glyphText}>{g}</Text>
          </View>
        ))}
      </View>
      <Text style={sysBadgeStyles.label}>{count} systems agree</Text>
    </View>
  );
}

const sysBadgeStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  glyphs: { flexDirection: "row", gap: 2 },
  glyph: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(232,184,109,0.12)",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(232,184,109,0.2)",
  },
  glyphText: { fontSize: 11 },
  label: {
    fontSize: 11, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
});

// ─── Mood Dial ────────────────────────────────────────────────────
function MoodDial({ level, caption }: { level: number; caption: string }) {
  const anim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [anim]);
  const rotation = anim.interpolate({
    inputRange: [0, 1], outputRange: ["0deg", `${(level / 5) * 180 - 90}deg`],
  });
  return (
    <View style={dStyles.wrap}>
      <View style={dStyles.dial}>
        <View style={dStyles.dialTrack} />
        <RNAnimated.View style={[dStyles.dialNeedle, { transform: [{ rotate: rotation }] }]}>
          <View style={dStyles.needleHead} />
        </RNAnimated.View>
        <Text style={dStyles.levelText}>{level}/5</Text>
      </View>
      <Text style={dStyles.caption}>{caption}</Text>
    </View>
  );
}
const dStyles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 12 },
  dial: { width: 100, height: 60, overflow: "hidden", alignItems: "center", justifyContent: "flex-end", position: "relative" },
  dialTrack: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "rgba(255,255,255,0.08)", borderBottomColor: "transparent", borderLeftColor: "transparent", transform: [{ rotate: "45deg" }] },
  dialNeedle: { position: "absolute", bottom: 0, width: 2, height: 30, backgroundColor: SolunaColors.warmGold, transformOrigin: "bottom center" },
  needleHead: { width: 8, height: 8, borderRadius: 4, backgroundColor: SolunaColors.warmGold, position: "absolute", top: -4, left: -3 },
  levelText: { position: "absolute", bottom: 4, fontSize: 14, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body },
  caption: { fontSize: 13, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 18, maxWidth: 200 },
});

// ─── Biorhythm Mini Gauge ─────────────────────────────────────────
function BiorhythmGauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={bioStyles.wrap}>
      <Text style={bioStyles.label}>{label}</Text>
      <View style={bioStyles.barTrack}>
        <View style={[bioStyles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[bioStyles.val, { color }]}>{value}%</Text>
    </View>
  );
}
const bioStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  label: { fontSize: 11, color: SolunaColors.creamMuted, width: 80, fontFamily: Fonts.body },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)" },
  barFill: { height: 6, borderRadius: 3 },
  val: { fontSize: 12, fontWeight: "700", width: 36, textAlign: "right", fontFamily: Fonts.body },
});

// ─── Card Wrapper ─────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[cardS.card, style]}>{children}</View>;
}
const cardS = StyleSheet.create({ card: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder } });

// ─── Today Screen ─────────────────────────────────────────────────
export default function TodayScreen() {
  const { user } = useAppState();
  const { data: reading, isLoading, refetch, isRefetching } = useTodayReading();
  const fadeIn = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeIn]);

  if (!user) return null;

  if (!reading) {
    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={[st.gradient, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={SolunaColors.warmGold} size="large" />
        <Text style={{ color: SolunaColors.creamMuted, marginTop: 16, fontFamily: Fonts.body }}>
          {isLoading ? "Reading today's sky…" : "Preparing your day…"}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={!!isRefetching} onRefresh={refetch} tintColor={SolunaColors.warmGold} />
        }
      >
        <RNAnimated.View style={{ opacity: fadeIn }}>
          {/* Header */}
          <View style={st.header}>
            <View>
              <Text style={st.greeting}>Good morning, {user.preferredName}</Text>
              <Text style={st.date}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>
            </View>
            <View style={st.headerRight}>
              <View style={st.sunBadge}>
                <Sun size={14} color={SolunaColors.warmGold} />
                <Text style={st.sunBadgeText}>{ZODIAC_SYMBOLS[user.chart.sun.sign]} {user.chart.sun.sign}</Text>
              </View>
            </View>
          </View>

          {/* Hero Reading Card */}
          <Card style={{ marginBottom: 16 }}>
            <View style={{ position: "absolute", top: 12, right: 16, opacity: 0.6 }}>
              <Sparkles size={20} color={SolunaColors.warmGold} />
            </View>
            <Text style={st.heroText}>{reading.reading}</Text>
          </Card>

          {/* Systems Agree Card (signature feature) */}
          <TouchableOpacity
            style={st.sysAgreeCard}
            onPress={() => router.push({ pathname: "/synthesis-detail", params: { id: "today" } })}
            activeOpacity={0.8}
          >
            <SystemsAgreeBadge count={reading.systemsAgree.systems.length} />
            <Text style={st.sysAgreeSummary}>{reading.systemsAgree.summary}</Text>
            <Text style={st.sysAgreeTap}>Tap to see why</Text>
          </TouchableOpacity>

          {/* Cosmic Weather Strip */}
          <Text style={st.sectionTitle}>Cosmic Weather</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 10, paddingRight: SolunaSpacing.md }}>
            <View style={st.weatherCard}>
              <Text style={st.weatherEmoji}>{reading.moonPhaseEmoji}</Text>
              <Text style={st.weatherLabel}>{reading.moonPhase}</Text>
              <Text style={st.weatherSub}>The moon grows toward fullness — a time for building and becoming.</Text>
            </View>
            <View style={st.weatherCard}>
              <Moon size={24} color={SolunaColors.gentleLavender} />
              <Text style={st.weatherLabel}>Moon in {reading.moonSign}</Text>
              <Text style={st.weatherSub}>Emotions run warm and nurturing — let yourself be soft.</Text>
            </View>
            <TouchableOpacity style={st.weatherCard} onPress={() => router.push({ pathname: "/transit-detail", params: { id: "venus-gemini" } })}>
              <Text style={st.weatherEmojiSmall}>{ZODIAC_SYMBOLS[reading.transit1.sign]}</Text>
              <Text style={st.weatherLabel}>{reading.transit1.planet} in {reading.transit1.sign}</Text>
              <Text style={st.weatherSub}>{reading.transit1.blurb}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.weatherCard} onPress={() => router.push({ pathname: "/transit-detail", params: { id: "mars-virgo" } })}>
              <Text style={st.weatherEmojiSmall}>{ZODIAC_SYMBOLS[reading.transit2.sign]}</Text>
              <Text style={st.weatherLabel}>{reading.transit2.planet} in {reading.transit2.sign}</Text>
              <Text style={st.weatherSub}>{reading.transit2.blurb}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Numerology of the day */}
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Hash size={16} color={SolunaColors.gentleLavender} />
              <Text style={st.cardLabel}>NUMEROLOGY OF THE DAY</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <View style={st.numCircle}>
                <Text style={st.numCircleText}>{reading.personalDay}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: SolunaColors.cream, lineHeight: 20, fontFamily: Fonts.body }}>
                <Text style={{ fontWeight: "700", color: SolunaColors.warmGold }}>Personal Day {reading.personalDay}: </Text>
                {reading.personalDayMeaning}
              </Text>
            </View>
          </Card>

          {/* Chinese note of the day */}
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Bird size={16} color={SolunaColors.softPeach} />
              <Text style={st.cardLabel}>CHINESE NOTE</Text>
            </View>
            <Text style={{ fontSize: 14, color: SolunaColors.cream, lineHeight: 20, fontFamily: Fonts.body }}>
              {reading.chineseNote}
            </Text>
          </Card>

          {/* Card of the Day */}
          <TouchableOpacity style={st.tarotCard} onPress={() => router.push("/tarot")} activeOpacity={0.8}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <BookOpen size={16} color={SolunaColors.warmGold} />
              <Text style={st.cardLabel}>CARD OF THE DAY</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
              <Text style={{ fontSize: 36 }}>{reading.cardOfTheDay.imageEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: SolunaColors.warmGold, fontFamily: Fonts.body, marginBottom: 4 }}>
                  {reading.cardOfTheDay.name}
                </Text>
                <Text style={{ fontSize: 13, color: SolunaColors.creamMuted, lineHeight: 19, fontFamily: Fonts.body }} numberOfLines={3}>
                  {reading.cardOfTheDay.uprightMeaning}
                </Text>
              </View>
            </View>
            <View style={st.tarotCta}>
              <Text style={st.tarotCtaText}>Pull a full spread</Text>
              <Star size={12} color={SolunaColors.warmGold} />
            </View>
          </TouchableOpacity>

          {/* Energy + Affirmation Row */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <Card style={{ flex: 1, minHeight: 160 }}>
              <Text style={st.cardLabel}>YOUR ENERGY TODAY</Text>
              <MoodDial level={reading.energyLevel} caption={reading.energyCaption} />
            </Card>
            <Card style={{ flex: 1, minHeight: 160 }}>
              <Text style={st.cardLabel}>TODAY'S AFFIRMATION</Text>
              <Text style={st.affirmationText}>"{reading.affirmation}"</Text>
              <TouchableOpacity style={st.shareBtn}>
                <Share2 size={16} color={SolunaColors.creamMuted} />
                <Text style={st.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </Card>
          </View>

          {/* Biorhythm */}
          <Card style={{ marginBottom: 10 }}>
            <Text style={st.cardLabel}>BIORHYTHM</Text>
            <BiorhythmGauge label="Physical" value={72} color={SolunaColors.softPeach} />
            <BiorhythmGauge label="Emotional" value={45} color={SolunaColors.gentleLavender} />
            <BiorhythmGauge label="Intellectual" value={88} color={SolunaColors.warmGold} />
          </Card>

          {/* Do / Embrace / Ease Up */}
          <Card style={{ marginBottom: 10 }}>
            {[
              { icon: Star, label: "Do", value: reading.do, color: SolunaColors.warmGold },
              { icon: Sparkles, label: "Embrace", value: reading.embrace, color: SolunaColors.gentleLavender },
              { icon: Moon, label: "Ease up on", value: reading.easeUp, color: SolunaColors.softPeach },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <View style={st.guidanceRow}>
                  <View style={st.guidanceIconWrap}>
                    <item.icon size={16} color={item.color} fill={item.label === "Do" ? item.color : "none"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.guidanceLabel}>{item.label}</Text>
                    <Text style={st.guidanceValue}>{item.value}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={st.guidanceDivider} />}
              </View>
            ))}
          </Card>

          {/* Full Moon Ritual CTA */}
          <TouchableOpacity style={st.ritualCta} onPress={() => router.push("/rituals")} activeOpacity={0.8}>
            <View style={st.ritualCtaInner}>
              <Moon size={20} color={SolunaColors.gentleLavender} />
              <View style={{ flex: 1 }}>
                <Text style={st.ritualCtaTitle}>Full Moon Ritual Available</Text>
                <Text style={st.ritualCtaSub}>A gentle, optional ritual to honor this lunar moment</Text>
              </View>
              <Star size={16} color={SolunaColors.warmGold} />
            </View>
          </TouchableOpacity>

          {/* Ask Soluna CTA */}
          <TouchableOpacity style={st.askCta} onPress={() => router.push("/(tabs)/ask")} activeOpacity={0.8}>
            <LinearGradient colors={["rgba(232, 184, 109, 0.15)", "rgba(242, 168, 141, 0.08)"]} style={st.askCtaInner}>
              <MessageCircle size={20} color={SolunaColors.warmGold} />
              <Text style={st.askCtaText}>Ask Soluna about today</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </RNAnimated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const st = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SolunaSpacing.md, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  greeting: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, marginBottom: 4 },
  date: { fontSize: 14, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  headerRight: { alignItems: "flex-end" },
  sunBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(232,184,109,0.12)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(232,184,109,0.2)" },
  sunBadgeText: { fontSize: 12, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  heroText: { fontSize: 17, fontFamily: Fonts.heading, color: SolunaColors.cream, lineHeight: 28, letterSpacing: 0.2 },
  // Systems Agree
  sysAgreeCard: { backgroundColor: "rgba(232,184,109,0.06)", borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)", marginBottom: 16 },
  sysAgreeSummary: { fontSize: 15, fontWeight: "600", color: SolunaColors.cream, fontFamily: Fonts.body, lineHeight: 22, marginBottom: 8 },
  sysAgreeTap: { fontSize: 12, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  // Section
  sectionTitle: { fontSize: 12, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 10 },
  cardLabel: { fontSize: 11, color: SolunaColors.creamSubtle, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", fontFamily: Fonts.body, marginBottom: 4 },
  // Weather
  weatherCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.md, padding: 16, borderWidth: 1, borderColor: SolunaColors.cardBorder, width: 170, gap: 6 },
  weatherEmoji: { fontSize: 28 }, weatherEmojiSmall: { fontSize: 22 },
  weatherLabel: { fontSize: 13, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body },
  weatherSub: { fontSize: 12, color: SolunaColors.creamMuted, lineHeight: 17 },
  // Numerology
  numCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(185,163,227,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(185,163,227,0.25)" },
  numCircleText: { fontSize: 24, fontWeight: "700", color: SolunaColors.gentleLavender, fontFamily: Fonts.heading },
  // Tarot
  tarotCard: { backgroundColor: SolunaColors.cardBg, borderRadius: SolunaRadius.lg, padding: 20, borderWidth: 1, borderColor: SolunaColors.cardBorder, marginBottom: 10 },
  tarotCta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, alignSelf: "flex-end" },
  tarotCtaText: { fontSize: 12, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
  // Energy + affirmation
  affirmationText: { fontSize: 15, fontFamily: Fonts.heading, color: SolunaColors.cream, lineHeight: 22, marginBottom: 12, fontStyle: "italic" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignSelf: "flex-start" },
  shareBtnText: { fontSize: 12, color: SolunaColors.creamMuted, fontWeight: "600", fontFamily: Fonts.body },
  // Guidance
  guidanceRow: { flexDirection: "row", gap: 14, paddingVertical: 12, alignItems: "flex-start" },
  guidanceIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  guidanceLabel: { fontSize: 11, color: SolunaColors.creamSubtle, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, fontFamily: Fonts.body, marginBottom: 2 },
  guidanceValue: { fontSize: 14, color: SolunaColors.cream, lineHeight: 20, fontFamily: Fonts.body },
  guidanceDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  // Ritual CTA
  ritualCta: { marginBottom: 12 },
  ritualCtaInner: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(185,163,227,0.06)", borderRadius: SolunaRadius.lg, padding: 18, borderWidth: 1, borderColor: "rgba(185,163,227,0.12)" },
  ritualCtaTitle: { fontSize: 14, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.body, marginBottom: 2 },
  ritualCtaSub: { fontSize: 12, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  // Ask CTA
  askCta: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginBottom: 16 },
  askCtaInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(232,184,109,0.15)", borderRadius: SolunaRadius.lg },
  askCtaText: { fontSize: 15, color: SolunaColors.warmGold, fontWeight: "600", fontFamily: Fonts.body },
});
