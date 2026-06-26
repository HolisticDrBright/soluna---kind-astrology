import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles, MailCheck } from "lucide-react-native";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { useAppState } from "@/state/useAppState";

export default function AuthScreen() {
  const { authError, authLoading, signIn, signUp, resetPassword, resendConfirmation } = useAppState();
  const [mode, setMode] = useState<"signIn" | "signUp">("signUp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localMessage, setLocalMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setLocalMessage("");
    setInfoMessage("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      setLocalMessage("Use an email and a password with at least 6 characters.");
      return;
    }

    if (mode === "signIn") {
      const { error } = await signIn(trimmedEmail, password);
      if (!error) router.replace("/");
      return;
    }

    const { error, needsConfirmation } = await signUp(trimmedEmail, password);
    if (error) return;
    if (needsConfirmation) {
      setPendingConfirmEmail(trimmedEmail);
      return;
    }
    router.replace("/");
  };

  const onForgotPassword = async () => {
    setLocalMessage("");
    setInfoMessage("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalMessage("Enter your email first, then tap reset.");
      return;
    }
    setBusy(true);
    const { error } = await resetPassword(trimmedEmail);
    setBusy(false);
    setInfoMessage(error ?? "If an account exists for that email, a password reset link is on its way. 💛");
  };

  const onResend = async () => {
    if (!pendingConfirmEmail) return;
    setInfoMessage("");
    setBusy(true);
    const { error } = await resendConfirmation(pendingConfirmEmail);
    setBusy(false);
    setInfoMessage(error ?? "Confirmation email resent. Check your inbox (and spam).");
  };

  // ── "Check your email" confirmation screen ──
  if (pendingConfirmEmail) {
    return (
      <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={styles.gradient}>
        <View style={[styles.wrap, { alignItems: "center" }]}>
          <MailCheck size={42} color={SolunaColors.warmGold} />
          <Text style={[styles.title, { marginTop: 18 }]}>Confirm your email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to {pendingConfirmEmail}. Tap it to activate your account, then come back and sign in.
          </Text>
          {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}
          <TouchableOpacity style={[styles.primaryButton, { width: "100%" }]} onPress={onResend} disabled={busy} activeOpacity={0.85}>
            <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} style={styles.buttonGradient}>
              {busy ? <ActivityIndicator color={SolunaColors.deepIndigo} /> : <Text style={styles.buttonText}>Resend confirmation</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => { setPendingConfirmEmail(null); setMode("signIn"); setInfoMessage(""); }}
          >
            <Text style={styles.switchText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={styles.gradient}>
      <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.logo}>
          <Sparkles size={34} color={SolunaColors.warmGold} />
          <Text style={styles.brand}>Soluna</Text>
        </View>

        <Text style={styles.title}>{mode === "signUp" ? "Create your Soluna account" : "Welcome back"}</Text>
        <Text style={styles.subtitle}>Your birth data, journal, and guidance stay connected to you.</Text>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={SolunaColors.creamSubtle}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={SolunaColors.creamSubtle}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {(authError || localMessage) ? <Text style={styles.error}>{authError || localMessage}</Text> : null}
        {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={authLoading} activeOpacity={0.85}>
          <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} style={styles.buttonGradient}>
            {authLoading ? <ActivityIndicator color={SolunaColors.deepIndigo} /> : (
              <Text style={styles.buttonText}>{mode === "signUp" ? "Create Account" : "Sign In"}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {mode === "signIn" ? (
          <TouchableOpacity style={styles.linkButton} onPress={onForgotPassword} disabled={busy}>
            <Text style={styles.linkText}>Forgot your password?</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.switchButton} onPress={() => { setMode(mode === "signUp" ? "signIn" : "signUp"); setLocalMessage(""); setInfoMessage(""); }}>
          <Text style={styles.switchText}>
            {mode === "signUp" ? "Already have an account? Sign in" : "New here? Create an account"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  wrap: { flex: 1, justifyContent: "center", paddingHorizontal: SolunaSpacing.lg },
  logo: { alignItems: "center", gap: 10, marginBottom: 24 },
  brand: { fontFamily: Fonts.heading, fontSize: 42, color: SolunaColors.cream, letterSpacing: 2 },
  title: { fontFamily: Fonts.heading, fontSize: 28, color: SolunaColors.cream, textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, color: SolunaColors.creamMuted, textAlign: "center", marginBottom: 28, fontFamily: Fonts.body },
  form: { gap: 12 },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: SolunaRadius.md,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: SolunaColors.cream,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontFamily: Fonts.body,
  },
  error: { color: SolunaColors.softPeach, textAlign: "center", marginTop: 14, fontFamily: Fonts.body },
  info: { color: SolunaColors.gentleLavender, textAlign: "center", marginTop: 14, fontFamily: Fonts.body, lineHeight: 20 },
  primaryButton: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginTop: 22 },
  buttonGradient: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  buttonText: { color: SolunaColors.deepIndigo, fontSize: 17, fontWeight: "700", fontFamily: Fonts.body },
  linkButton: { alignItems: "center", paddingTop: 16 },
  linkText: { color: SolunaColors.creamMuted, fontSize: 14, fontFamily: Fonts.body },
  switchButton: { alignItems: "center", paddingVertical: 18 },
  switchText: { color: SolunaColors.gentleLavender, fontSize: 14, fontFamily: Fonts.body },
});
