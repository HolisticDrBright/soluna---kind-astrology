import { Redirect } from "expo-router";
import { useAppState } from "@/state/useAppState";

export default function IndexScreen() {
  const { hasOnboarded, user } = useAppState();

  if (hasOnboarded && user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
