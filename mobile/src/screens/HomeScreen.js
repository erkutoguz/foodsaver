import { StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";
import { colors } from "../theme/colors";

export function HomeScreen() {
  return (
    <ScreenShell
      eyebrow="TODAY"
      title="Your kitchen at a glance"
      description="Inventory, recipes, and the items that need attention today will come together here."
    >
      <InfoCard title="Coming soon">
        <View style={styles.list}>
          <Text style={styles.item}>- Remaining item summary</Text>
          <Text style={styles.item}>- Short list of expiring items</Text>
          <Text style={styles.item}>- Quick recipe suggestions</Text>
        </View>
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
