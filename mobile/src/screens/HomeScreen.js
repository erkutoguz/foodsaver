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
      description="Your pantry, recipe ideas, and the items that need attention today will come together here."
    >
      <InfoCard title="What you will see here">
        <View style={styles.list}>
          <Text style={styles.item}>- Remaining item summary</Text>
          <Text style={styles.item}>- Short list of expiring items</Text>
          <Text style={styles.item}>- Quick recipe suggestions</Text>
        </View>
      </InfoCard>

      <InfoCard title="Your next step" tone="accent">
        Add a few pantry items first, then the recipe tab can start feeling much more alive.
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8
  },
  item: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  }
});
