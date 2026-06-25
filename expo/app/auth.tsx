import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles } from "lucide-react-native";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { useAppState } from "@/state/useAppState";

export default function AuthScreen() {
  const { authError, authLoading, signIn, signUp } = useAppState();
  const [mode, setMode] = useState<"signIn" | "signUp">("signUp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localMessage, setLocalMessage] = useState("");

  const submit = async () => {
    setLocalMessage("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      setLocalMessage("Use an email and a password with at least 6 characters.");
      return;
    }

    const result = mode === "signIn"
      ? await signIn(trimmedEmail, password)
      : await signUp(trimmedEmail, password);

    if (!result.error) {
      router.replace("/");
    }
  };

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

        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={authLoading} activeOpacity={0.85}>
          <LinearGradient colors={[SolunaColors.warmGold, SolunaColors.softPeach]} style={styles.buttonGradient}>
            {authLoading ? <ActivityIndicator color={SolunaColors.deepIndigo} /> : (
              <Text style={styles.buttonText}>{mode === "signUp" ? "Create Account" : "Sign In"}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchButton} onPress={() => setMode(mode === "signUp" ? "signIn" : "signUp")}>
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
  primaryButton: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginTop: 22 },
  buttonGradient: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  buttonText: { color: SolunaColors.deepIndigo, fontSize: 17, fontWeight: "700", fontFamily: Fonts.body },
  switchButton: { alignItems: "center", paddingVertical: 18 },
  switchText: { color: SolunaColors.gentleLavender, fontSize: 14, fontFamily: Fonts.body },
});
