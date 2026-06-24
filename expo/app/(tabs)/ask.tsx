import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated as RNAnimated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import { MOCK_CHAT_HISTORY, Fonts, type ChatMessage } from "@/constants/mockData";
import { Sparkles, Send, ArrowUp, Hash, Cpu } from "lucide-react-native";

const SUGGESTED_PROMPTS = [
  "What should I focus on today?",
  "Where do my systems agree about my career?",
  "Explain my Life Path number",
  "How's my week looking in love?",
  "Why do I feel restless lately?",
];

function TypingIndicator() {
  const dot1 = useRef(new RNAnimated.Value(0)).current;
  const dot2 = useRef(new RNAnimated.Value(0)).current;
  const dot3 = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    const pulse = (dot: RNAnimated.Value, delay: number) => {
      RNAnimated.loop(RNAnimated.sequence([
        RNAnimated.delay(delay),
        RNAnimated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
        RNAnimated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])).start();
    };
    pulse(dot1, 0); pulse(dot2, 200); pulse(dot3, 400);
  }, [dot1, dot2, dot3]);
  const makeStyle = (dot: RNAnimated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });
  return (
    <View style={tyS.wrap}>
      <View style={tyS.bubble}>
        <Text style={tyS.text}>Soluna is reading your blueprint…</Text>
        <View style={tyS.dots}>
          <RNAnimated.View style={[tyS.dot, makeStyle(dot1)]} />
          <RNAnimated.View style={[tyS.dot, makeStyle(dot2)]} />
          <RNAnimated.View style={[tyS.dot, makeStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}
const tyS = StyleSheet.create({
  wrap: { paddingHorizontal: SolunaSpacing.md, marginBottom: 12 },
  bubble: { backgroundColor: "rgba(185,163,227,0.08)", borderRadius: SolunaRadius.md, padding: 14, borderWidth: 1, borderColor: "rgba(185,163,227,0.12)", flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  text: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body, fontStyle: "italic", marginRight: 10 },
  dots: { flexDirection: "row", gap: 4, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SolunaColors.gentleLavender },
});

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";
  return (
    <View style={[bS.wrap, isUser ? bS.userWrap : bS.solunaWrap]}>
      {!isUser && (
        <View style={bS.avatar}><Sparkles size={14} color={SolunaColors.gentleLavender} /></View>
      )}
      <View style={[bS.bubble, isUser ? bS.userBubble : bS.solunaBubble]}>
        <Text style={[bS.text, isUser ? bS.userText : bS.solunaText]}>{message.text}</Text>
        <Text style={[bS.time, isUser ? bS.userTime : bS.solunaTime]}>{message.timestamp}</Text>
      </View>
    </View>
  );
}
const bS = StyleSheet.create({
  wrap: { flexDirection: "row", paddingHorizontal: SolunaSpacing.md, marginBottom: 12, alignItems: "flex-end", gap: 8 },
  userWrap: { justifyContent: "flex-end" }, solunaWrap: { justifyContent: "flex-start" },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(185,163,227,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  bubble: { maxWidth: "78%", borderRadius: SolunaRadius.md, padding: 14 },
  userBubble: { backgroundColor: "rgba(232,184,109,0.12)", borderWidth: 1, borderColor: "rgba(232,184,109,0.15)", borderBottomRightRadius: 4 },
  solunaBubble: { backgroundColor: SolunaColors.cardBg, borderWidth: 1, borderColor: SolunaColors.cardBorder, borderBottomLeftRadius: 4 },
  text: { fontSize: 14, lineHeight: 21, fontFamily: Fonts.body },
  userText: { color: SolunaColors.cream }, solunaText: { color: SolunaColors.cream },
  time: { fontSize: 10, marginTop: 6, fontFamily: Fonts.body },
  userTime: { color: SolunaColors.creamSubtle, textAlign: "right" }, solunaTime: { color: SolunaColors.creamSubtle },
});

export default function AskSolunaScreen() {
  const { user } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_HISTORY);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`, sender: "user", text: trimmed,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); setIsTyping(true);
    setTimeout(() => {
      const key = Object.keys(mockResponses).find((k) => trimmed.toLowerCase().includes(k));
      const replyText = mockResponses[key ?? ""] ?? mockResponses.fallback;
      const solunaMsg: ChatMessage = {
        id: `s${Date.now()}`, sender: "soluna", text: replyText,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      };
      setMessages((prev) => [...prev, solunaMsg]);
      setIsTyping(false);
    }, 2000 + Math.random() * 1500);
  }, [input]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  if (!user) return null;

  return (
    <LinearGradient colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]} style={st.gradient}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <View style={st.header}>
          <View style={st.headerLeft}>
            <View style={st.headerAvatar}><Sparkles size={20} color={SolunaColors.warmGold} /></View>
            <View>
              <Text style={st.headerTitle}>Soluna</Text>
              <Text style={st.headerSub}>Your cross-system guide</Text>
            </View>
          </View>
          <View style={st.sysBadges}>
            <View style={st.sysBadge}><Text style={st.sysBadgeText}>♋</Text></View>
            <View style={st.sysBadge}><Hash size={9} color={SolunaColors.creamMuted} /></View>
            <View style={st.sysBadge}><Cpu size={9} color={SolunaColors.creamMuted} /></View>
          </View>
        </View>
        <ScrollView ref={scrollRef} style={st.messages} contentContainerStyle={st.messagesContent} showsVerticalScrollIndicator={false}>
          {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
          {isTyping && <TypingIndicator />}
        </ScrollView>
        {messages.length <= MOCK_CHAT_HISTORY.length && !isTyping && (
          <View style={st.promptsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.promptsContent}>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <TouchableOpacity key={prompt} style={st.promptChip} onPress={() => setInput(prompt)}>
                  <Text style={st.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={st.inputWrap}>
          <View style={st.inputRow}>
            <TextInput style={st.input} value={input} onChangeText={setInput} placeholder="Ask about your blueprint…" placeholderTextColor={SolunaColors.creamSubtle} multiline maxLength={500} onSubmitEditing={sendMessage} returnKeyType="send" />
            <TouchableOpacity style={[st.sendBtn, !input.trim() && st.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim()} activeOpacity={0.7}>
              <ArrowUp size={18} color={input.trim() ? SolunaColors.deepIndigo : SolunaColors.creamSubtle} />
            </TouchableOpacity>
          </View>
          <Text style={st.disclaimer}>Soluna's responses are personalized to your full blueprint — astrology, numerology, Chinese astrology, and Human Design.</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const mockResponses: Record<string, string> = {
  "what should i focus on today": "Based on your full blueprint, Maya, today's a beautiful day to focus on what feels nurturing — for yourself and for the people you care about. Your Cancer Sun (astrology) thrives when you're creating warmth, your Personal Day 7 (numerology) says this is a day for reflection not pushing, and your Generator design (Human Design) says wait to respond rather than initiate. Three systems, same message: softness is strength today.",
  "explain my life path": "Your Life Path 3, Maya, is the Creative Communicator. You're here to express, to uplift, and to bring joy through your words and your art. This aligns beautifully with your Cancer Sun (astrology) — you lead with heart — and your Generator design (Human Design), which gives you sustainable creative energy when you're doing what you love. Your Wood Pig (Chinese astrology) adds generosity to the mix: you don't just create for yourself, you create to warm others. Your voice literally matters — don't underestimate it.",
  "how's my week looking in love": "Your systems have a lot to say about love this week, Maya. Venus in Gemini is lighting up your 10th house (astrology) — connection might arrive through work or creative projects. Your Personal Month 3 (numerology) makes you especially magnetic and expressive. And your Emotional Authority (Human Design) reminds you: don't decide in the moment. Let the wave rise and fall before you know what's real. If you're in a relationship, share one thing you've been quietly thinking. If you're single, stay open — Mercury supports warm, honest conversations.",
  "why do i feel restless": "I can see why across your systems, Maya. Mars in Virgo is activating your 3rd house (astrology) — a hum of 'something needs to change' without being clear about what. Your Personal Year 7 (numerology) is a year of inner reflection, not external action, which can feel restless when your soul is shifting beneath the surface. Your Generator design (Human Design) adds: frustration is the signal that you're trying to force rather than respond. The restlessness isn't wrong — it's your systems asking you to pause and listen before acting. Try 15 minutes of writing without judgment — you might be surprised what surfaces.",
  fallback: "That's a beautiful question. Looking across your systems — your Cancer Sun (astrology), your Life Path 3 (numerology), your Wood Pig's generosity (Chinese), and your Generator design (Human Design) — I'd say this is something worth sitting with gently. Your intuition is sharper than you give it credit for. What does your first instinct tell you? I'm here to explore it together, across all four lenses.",
};

const st = StyleSheet.create({
  gradient: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SolunaSpacing.md, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(232,184,109,0.1)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: SolunaColors.cream, fontFamily: Fonts.heading },
  headerSub: { fontSize: 11, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  sysBadges: { flexDirection: "row", gap: 4 },
  sysBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  sysBadgeText: { fontSize: 9 },
  messages: { flex: 1 }, messagesContent: { paddingTop: 16, paddingBottom: 8 },
  promptsWrap: { paddingVertical: 10 },
  promptsContent: { paddingHorizontal: SolunaSpacing.md, gap: 8 },
  promptChip: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  promptText: { fontSize: 13, color: SolunaColors.creamMuted, fontFamily: Fonts.body },
  inputWrap: { paddingHorizontal: SolunaSpacing.md, paddingBottom: Platform.OS === "ios" ? 100 : 20, paddingTop: 8 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: SolunaRadius.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingLeft: 16, paddingRight: 8, paddingVertical: 4 },
  input: { flex: 1, fontSize: 15, color: SolunaColors.cream, fontFamily: Fonts.body, maxHeight: 100, paddingVertical: 10 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: SolunaColors.warmGold, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  sendBtnDisabled: { backgroundColor: "rgba(255,255,255,0.1)" },
  disclaimer: { fontSize: 10, color: SolunaColors.creamSubtle, textAlign: "center", marginTop: 6, fontFamily: Fonts.body },
});
