import { View, Text } from "react-native";

// Minimal diagnostic — confirms providers + basic rendering work
export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#1A1635", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <Text style={{ color: "#E8B86D", fontSize: 24, fontWeight: "700", marginBottom: 12 }}>
        Soluna — Diagnostic
      </Text>
      <Text style={{ color: "#C4BFB5", fontSize: 14, textAlign: "center" }}>
        Root layout rendering successfully.{"\n"}If you can see this, the crash is in navigation or screens.
      </Text>
    </View>
  );
}
