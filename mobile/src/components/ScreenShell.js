import { StyleSheet, Text, View } from "react-native";
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

export function InfoCard({ title, children, tone = "default" }) {
  return (
    <View style={[styles.card, tone === "accent" && styles.cardAccent]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {typeof children === "string" ? <Text style={styles.cardText}>{children}</Text> : children}
    </View>
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
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line
  },
  cardAccent: {
    backgroundColor: colors.brandSoft,
    borderColor: "#bfdbfe"
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  cardText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  }
});
