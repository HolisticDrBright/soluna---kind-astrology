import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { useAppState } from "@/state/useAppState";
import {
  MOCK_CHAT_HISTORY,
  ZODIAC_SYMBOLS,
  Fonts,
  type ChatMessage,
} from "@/constants/mockData";
import { Sparkles, Send, ArrowUp } from "lucide-react-native";

const SUGGESTED_PROMPTS = [
  "What should I focus on today?",
  "Explain my Moon sign",
  "How's my week looking in love?",
  "Why do I feel restless lately?",
];

// ─── Typing Indicator ─────────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useRef(new RNAnimated.Value(0)).current;
  const dot2 = useRef(new RNAnimated.Value(0)).current;
  const dot3 = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const pulse = (dot: RNAnimated.Value, delay: number) => {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.delay(delay),
          RNAnimated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          RNAnimated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };
    pulse(dot1, 0);
    pulse(dot2, 200);
    pulse(dot3, 400);
  }, [dot1, dot2, dot3]);

  const makeStyle = (dot: RNAnimated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View style={typingStyles.wrap}>
      <View style={typingStyles.bubble}>
        <Text style={typingStyles.text}>Soluna is reading your chart…</Text>
        <View style={typingStyles.dots}>
          <RNAnimated.View style={[typingStyles.dot, makeStyle(dot1)]} />
          <RNAnimated.View style={[typingStyles.dot, makeStyle(dot2)]} />
          <RNAnimated.View style={[typingStyles.dot, makeStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  wrap: { paddingHorizontal: SolunaSpacing.md, marginBottom: 12 },
  bubble: {
    backgroundColor: "rgba(185, 163, 227, 0.08)",
    borderRadius: SolunaRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(185, 163, 227, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 13,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
    fontStyle: "italic",
    marginRight: 10,
  },
  dots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SolunaColors.gentleLavender,
  },
});

// ─── Chat Bubble ──────────────────────────────────────────────────
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";
  return (
    <View
      style={[
        bubbleStyles.wrap,
        isUser ? bubbleStyles.userWrap : bubbleStyles.solunaWrap,
      ]}
    >
      {!isUser && (
        <View style={bubbleStyles.avatar}>
          <Sparkles size={14} color={SolunaColors.gentleLavender} />
        </View>
      )}
      <View
        style={[
          bubbleStyles.bubble,
          isUser ? bubbleStyles.userBubble : bubbleStyles.solunaBubble,
        ]}
      >
        <Text
          style={[
            bubbleStyles.text,
            isUser ? bubbleStyles.userText : bubbleStyles.solunaText,
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            bubbleStyles.time,
            isUser ? bubbleStyles.userTime : bubbleStyles.solunaTime,
          ]}
        >
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    paddingHorizontal: SolunaSpacing.md,
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  userWrap: { justifyContent: "flex-end" },
  solunaWrap: { justifyContent: "flex-start" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(185, 163, 227, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: SolunaRadius.md,
    padding: 14,
  },
  userBubble: {
    backgroundColor: "rgba(232, 184, 109, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(232, 184, 109, 0.15)",
    borderBottomRightRadius: 4,
  },
  solunaBubble: {
    backgroundColor: SolunaColors.cardBg,
    borderWidth: 1,
    borderColor: SolunaColors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.body,
  },
  userText: { color: SolunaColors.cream },
  solunaText: { color: SolunaColors.cream },
  time: {
    fontSize: 10,
    marginTop: 6,
    fontFamily: Fonts.body,
  },
  userTime: {
    color: SolunaColors.creamSubtle,
    textAlign: "right",
  },
  solunaTime: {
    color: SolunaColors.creamSubtle,
  },
});

// ─── Ask Soluna Screen ────────────────────────────────────────────
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
      id: `u${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Mock response after delay
    setTimeout(() => {
      const responses: Record<string, string> = {
        "what should i focus on today":
          "Based on your chart, Maya, today's a beautiful day to focus on what feels nurturing — both for yourself and for the people you care about. Your Cancer Sun thrives when you're creating warmth, and with the Moon in your 8th house, a quiet, meaningful conversation could bring surprising clarity. Don't overthink it — just follow what feels kind.",
        "explain my moon sign":
          "Your Moon in Pisces is such a tender, beautiful placement. The Moon represents your emotional world — how you feel, what you need to feel safe, and how you nurture yourself. In Pisces, your emotions are deep, intuitive, and almost mystical. You pick up on things others miss. You probably need time alone to process feelings, and creative outlets — music, writing, art — are like oxygen for your soul. People with this placement often feel everything deeply, which can be overwhelming, but it's also your greatest gift: you understand the human experience in a way few others can.",
        "how's my week looking in love":
          "This week, Venus in Gemini is lighting up your 10th house, which means love and connection might show up in unexpected places — perhaps through work, a shared project, or a conversation that starts professionally but takes a warmer turn. Your natural warmth is magnetic right now. If you're in a relationship, try sharing something you've been quietly thinking about — Mercury supports honest, kind communication. If you're single, stay open to connection in spaces you wouldn't normally look. Sometimes the best things arrive sideways.",
        "why do i feel restless":
          "That restlessness you're feeling — I see it in your chart right now. Mars is moving through Virgo, activating your 3rd house of daily rhythms and communication. Mars wants movement, action, change — and in precise Virgo, it can feel like an itch you can't quite scratch. Meanwhile, your Pisces Moon is picking up on emotional undercurrents that haven't fully surfaced yet. Sometimes restlessness is just your intuition saying something is shifting. Try this: give yourself 15 minutes to write down everything that feels unsettled, without judgment. You might be surprised what surfaces.",
      };

      const key = Object.keys(responses).find((k) =>
        trimmed.toLowerCase().includes(k),
      );
      const replyText =
        responses[key ?? ""] ??
        "That's a beautiful question. Let me look at your chart... Based on your Cancer Sun and Pisces Moon, I'd say this is something worth sitting with gently. Your intuition is sharper than you give it credit for — what does your first instinct tell you? I'm here to explore it together.";

      const solunaMsg: ChatMessage = {
        id: `s${Date.now()}`,
        sender: "soluna",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };

      setMessages((prev) => [...prev, solunaMsg]);
      setIsTyping(false);
    }, 2000 + Math.random() * 1500);
  }, [input]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  if (!user) return null;

  return (
    <LinearGradient
      colors={[SolunaColors.deepIndigo, SolunaColors.plumAubergine]}
      style={screenStyles.gradient}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={screenStyles.header}>
          <View style={screenStyles.headerLeft}>
            <View style={screenStyles.headerAvatar}>
              <Sparkles size={20} color={SolunaColors.warmGold} />
            </View>
            <View>
              <Text style={screenStyles.headerTitle}>Soluna</Text>
              <Text style={screenStyles.headerSub}>
                Your personal astrologer
              </Text>
            </View>
          </View>
          <View style={screenStyles.headerBadge}>
            <Text style={screenStyles.headerBadgeText}>
              {ZODIAC_SYMBOLS[user.chart.sun.sign]} {user.chart.sun.sign} ·{" "}
              {ZODIAC_SYMBOLS[user.chart.moon.sign]} {user.chart.moon.sign} ·{" "}
              {ZODIAC_SYMBOLS[user.chart.rising]} {user.chart.rising}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={screenStyles.messages}
          contentContainerStyle={screenStyles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {/* Suggested Prompts (when no new messages) */}
        {messages.length <= MOCK_CHAT_HISTORY.length && !isTyping && (
          <View style={screenStyles.promptsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={screenStyles.promptsContent}
            >
              {SUGGESTED_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={screenStyles.promptChip}
                  onPress={() => {
                    setInput(prompt);
                  }}
                >
                  <Text style={screenStyles.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={screenStyles.inputWrap}>
          <View style={screenStyles.inputRow}>
            <TextInput
              style={screenStyles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your chart…"
              placeholderTextColor={SolunaColors.creamSubtle}
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                screenStyles.sendBtn,
                !input.trim() && screenStyles.sendBtnDisabled,
              ]}
              onPress={sendMessage}
              disabled={!input.trim()}
              activeOpacity={0.7}
            >
              <ArrowUp
                size={18}
                color={
                  input.trim()
                    ? SolunaColors.deepIndigo
                    : SolunaColors.creamSubtle
                }
              />
            </TouchableOpacity>
          </View>
          <Text style={screenStyles.disclaimer}>
            Soluna's responses are personalized to your chart and written with
            care.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  gradient: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SolunaSpacing.md,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(232, 184, 109, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: SolunaColors.cream,
    fontFamily: Fonts.heading,
  },
  headerSub: {
    fontSize: 11,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 10,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  messages: { flex: 1 },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  promptsWrap: {
    paddingVertical: 10,
  },
  promptsContent: {
    paddingHorizontal: SolunaSpacing.md,
    gap: 8,
  },
  promptChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  promptText: {
    fontSize: 13,
    color: SolunaColors.creamMuted,
    fontFamily: Fonts.body,
  },
  inputWrap: {
    paddingHorizontal: SolunaSpacing.md,
    paddingBottom: Platform.OS === "ios" ? 100 : 20,
    paddingTop: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: SolunaRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: SolunaColors.cream,
    fontFamily: Fonts.body,
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SolunaColors.warmGold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  disclaimer: {
    fontSize: 10,
    color: SolunaColors.creamSubtle,
    textAlign: "center",
    marginTop: 6,
    fontFamily: Fonts.body,
  },
});
