import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";
import { useAuth } from "@/state/useAuth";
import { Sun, Moon } from "lucide-react-native";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError("Enter your email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") await signIn(email.trim(), password);
      else {
        await signUp(email.trim(), password);
        setError("Check your email to confirm your account, then sign in.");
        setMode("login");
      }
      // On success, the auth gate redirects automatically.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={s.gradient}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.logoRow}>
            <Sun size={32} color={SolunaColors.warmGold} />
            <Moon size={32} color={SolunaColors.gentleLavender} />
          </View>
          <Text style={s.title}>Soluna</Text>
          <Text style={s.sub}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </Text>

          <View style={s.form}>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={SolunaColors.creamSubtle}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={SolunaColors.creamSubtle}
              secureTextEntry
              autoComplete="password"
            />

            {error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity style={s.button} onPress={submit} disabled={busy} activeOpacity={0.85}>
              <LinearGradient
                colors={[SolunaColors.warmGold, SolunaColors.softPeach]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.buttonGradient}
              >
                {busy
                  ? <ActivityIndicator color={SolunaColors.deepIndigo} />
                  : <Text style={s.buttonText}>{mode === "login" ? "Sign In" : "Create Account"}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
              <Text style={s.switchText}>
                {mode === "login"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.privacy}>
            Your birth data and conversations are private. We never sell your data or train on your chats.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: SolunaSpacing.lg, paddingVertical: 60 },
  logoRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 12 },
  title: { fontFamily: Fonts.heading, fontSize: 40, color: SolunaColors.cream, textAlign: "center", letterSpacing: 2 },
  sub: { fontSize: 15, color: SolunaColors.creamMuted, textAlign: "center", marginTop: 6, marginBottom: 32, fontFamily: Fonts.body },
  form: { gap: 14 },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: SolunaRadius.md, paddingHorizontal: 18,
    paddingVertical: 15, fontSize: 16, color: SolunaColors.cream, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)", fontFamily: Fonts.body,
  },
  error: { color: SolunaColors.error, fontSize: 13, textAlign: "center", fontFamily: Fonts.body, lineHeight: 18 },
  button: { borderRadius: SolunaRadius.lg, overflow: "hidden", marginTop: 8 },
  buttonGradient: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 17, fontWeight: "600", color: SolunaColors.deepIndigo, fontFamily: Fonts.body },
  switchText: { fontSize: 14, color: SolunaColors.gentleLavender, textAlign: "center", marginTop: 8, fontFamily: Fonts.body },
  privacy: { fontSize: 12, color: SolunaColors.creamSubtle, textAlign: "center", lineHeight: 18, marginTop: 40, fontFamily: Fonts.body },
});
