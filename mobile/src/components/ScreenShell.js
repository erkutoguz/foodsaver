import { StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

export function ScreenShell({ eyebrow, title, description, children }) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 18
  },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: 20,
    gap: 8
  },
  eyebrow: {
    color: "#bfd5ff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800"
  },
  description: {
    color: "#d7e0ea",
    fontSize: 14,
    lineHeight: 21
  },
  content: {
    gap: 14
  }
});
