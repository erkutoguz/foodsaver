import { StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";
import { useAuthStore } from "../store/auth-store";
import { colors } from "../theme/colors";

export function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.fullName?.split(" ")?.[0] || "chef";

  return (
    <ScreenShell
      eyebrow="TODAY"
      title={`Welcome back, ${firstName}`}
      description="Keep an eye on your pantry, jump into recipe ideas, and stay close to the ingredients that matter today."
    >
      <View style={styles.quickRow}>
        <View style={styles.quickCard}>
          <Text style={styles.quickValue}>Pantry</Text>
          <Text style={styles.quickLabel}>Track ingredients and expiration dates</Text>
        </View>

        <View style={[styles.quickCard, styles.quickCardAccent]}>
          <Text style={styles.quickValue}>Recipes</Text>
          <Text style={styles.quickLabel}>Turn what you have into meal ideas</Text>
        </View>
      </View>

      <InfoCard title="Kitchen rhythm">
        <View style={styles.list}>
          <Text style={styles.item}>- Remaining item summary</Text>
          <Text style={styles.item}>- Short list of expiring items</Text>
          <Text style={styles.item}>- Quick recipe suggestions</Text>
        </View>
      </InfoCard>

      <InfoCard title="Stay organized" tone="accent">
        Keep your pantry up to date and the rest of the app becomes much more useful right away.
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  quickRow: {
    gap: 10
  },
  quickCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 4
  },
  quickCardAccent: {
    backgroundColor: colors.brandSoft
  },
  quickValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  quickLabel: {
    color: colors.slate,
    fontSize: 13,
    lineHeight: 19
  },
  list: {
    gap: 8
  },
  item: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  }
});
