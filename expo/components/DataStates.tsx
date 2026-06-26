import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SolunaColors, { SolunaRadius, SolunaSpacing } from "@/constants/colors";
import { Fonts } from "@/constants/mockData";

/** Warm, on-brand loading placeholder. */
export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <View style={styles.center} testID="data-loading">
      <ActivityIndicator color={SolunaColors.warmGold} />
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

/** Kind error state with a retry affordance. */
export function ErrorState({
  message = "We couldn't load this just now.",
  onRetry,
  retrying,
}: {
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <View style={styles.center} testID="data-error">
      <Text style={styles.errorTitle}>Something interrupted the stars</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} disabled={retrying} activeOpacity={0.85}>
          {retrying ? (
            <ActivityIndicator color={SolunaColors.deepIndigo} />
          ) : (
            <Text style={styles.retryText}>Try again</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Empty placeholder for "nothing here yet" with an optional call to action. */
export function EmptyState({
  title = "Nothing here yet",
  message,
  actionLabel,
  onAction,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center} testID="data-empty">
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.muted}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.retryText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: SolunaSpacing.lg,
    gap: 12,
  },
  muted: {
    color: SolunaColors.creamMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  errorTitle: {
    color: SolunaColors.cream,
    fontSize: 17,
    fontFamily: Fonts.heading,
    textAlign: "center",
  },
  emptyTitle: {
    color: SolunaColors.cream,
    fontSize: 17,
    fontFamily: Fonts.heading,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 6,
    backgroundColor: SolunaColors.warmGold,
    borderRadius: SolunaRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 28,
    minWidth: 130,
    alignItems: "center",
  },
  retryText: {
    color: SolunaColors.deepIndigo,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.body,
  },
});
