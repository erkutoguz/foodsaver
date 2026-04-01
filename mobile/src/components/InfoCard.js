import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export function InfoCard({ title, children, tone = "default" }) {
  return (
    <View style={[styles.card, tone === "accent" && styles.cardAccent]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {typeof children === "string" ? <Text style={styles.cardText}>{children}</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
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
