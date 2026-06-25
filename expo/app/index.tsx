import { Redirect } from "expo-router";
import { useAppState } from "@/state/useAppState";
import { ActivityIndicator, View } from "react-native";
import SolunaColors from "@/constants/colors";

export default function IndexScreen() {
  const { authLoading, hasOnboarded, session, user } = useAppState();

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: SolunaColors.deepIndigo }}>
        <ActivityIndicator color={SolunaColors.warmGold} />
      </View>
    );
  }

  if (hasOnboarded && user) {
    return <Redirect href="/(tabs)" />;
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/onboarding" />;
}
