import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { useAuth } from "@/state/useAuth";
import { useAcceptInvite, useInvitePreview } from "@/lib/hooks";
import { setPendingInvite } from "@/lib/pendingInvite";
import { Heart, Sparkles, X } from "lucide-react-native";

const LENS_LABEL: Record<string, string> = {
  romance: "a Romance", friendship: "a Friendship", work: "a Work", family: "a Family",
};

export default function AcceptInviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { authActive, isAuthenticated } = useAuth();
  const { data: preview, isLoading, error } = useInvitePreview(code);
  const accept = useAcceptInvite();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onAccept = async () => {
    if (!code) return;
    if (!isAuthenticated) {
      // Remember the invite, send them to auth; the gate resumes here after login.
      setPendingInvite(code);
      router.replace("/auth");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const { linkId } = await accept.mutateAsync(code);
      router.replace({ pathname: "/bond-space", params: { linkId } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "We couldn't accept this invite.");
    } finally {
      setBusy(false);
    }
  };

  const inviterName = preview?.inviterName ?? "Someone";
  const lensLabel = preview?.lens ? LENS_LABEL[preview.lens] ?? "a" : "a";
  const invalid = !authActive ? false : (error || (preview && preview.valid === false));

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <View style={s.content}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.replace("/(tabs)")}><X size={22} color={SolunaColors.creamMuted} /></TouchableOpacity>

        <View style={s.heroIcons}><Sparkles size={28} color={SolunaColors.warmGold} /><Heart size={28} color={SolunaColors.softPeach} /></View>

        {!authActive ? (
          <>
            <Text style={s.title}>Bonds need the backend</Text>
            <Text style={s.sub}>Connect Soluna to your account to accept partner invites and share daily readings.</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace("/(tabs)")}><Text style={s.primaryText}>Got it</Text></TouchableOpacity>
          </>
        ) : isLoading ? (
          <ActivityIndicator color={SolunaColors.warmGold} size="large" />
        ) : invalid ? (
          <>
            <Text style={s.title}>{"This invite isn't available"}</Text>
            <Text style={s.sub}>It may have already been accepted or expired. Ask your partner to send a fresh link.</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace("/(tabs)")}><Text style={s.primaryText}>Back to Soluna</Text></TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.title}>{inviterName} invited you{"\n"}to {lensLabel} Bond</Text>
            <Text style={s.sub}>
              Link your blueprints to unlock a daily two-person reading — how to support each other,
              where you naturally flow, and a gentle growth edge. You both get a free Bond reading. ✨
            </Text>
            {err && <Text style={s.error}>{err}</Text>}
            <TouchableOpacity style={s.primaryBtn} onPress={onAccept} disabled={busy} activeOpacity={0.85}>
              <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryGradient}>
                {busy
                  ? <ActivityIndicator color={SolunaColors.deepIndigo} />
                  : <Text style={s.primaryText}>{isAuthenticated ? "Accept & Link" : "Sign in to accept"}</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={s.privacy}>You control exactly what you share — and can unlink anytime in one tap.</Text>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: SolunaSpacing.lg },
  closeBtn: { position: "absolute", top: 60, right: SolunaSpacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  heroIcons: { flexDirection: "row", gap: 12, marginBottom: 20 },
  title: { fontSize: 28, fontFamily: Fonts.heading, color: SolunaColors.cream, textAlign: "center", lineHeight: 36, marginBottom: 14 },
  sub: { fontSize: 15, color: SolunaColors.creamMuted, textAlign: "center", lineHeight: 23, marginBottom: 28, fontFamily: Fonts.body, maxWidth: 340 },
  error: { color: SolunaColors.error, fontSize: 13, textAlign: "center", marginBottom: 12, fontFamily: Fonts.body },
  primaryBtn: { borderRadius: SolunaRadius.lg, overflow: "hidden", width: "100%", maxWidth: 320 },
  primaryGradient: { paddingVertical: 16, alignItems: "center" },
  primaryText: { fontSize: 17, fontWeight: "600", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
  privacy: { fontSize: 12, color: SolunaColors.creamSubtle, textAlign: "center", marginTop: 16, fontFamily: Fonts.body, maxWidth: 300, lineHeight: 18 },
});
