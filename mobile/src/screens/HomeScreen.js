import { StyleSheet, Text, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";
import { colors } from "../theme/colors";

export function HomeScreen() {
  return (
    <ScreenShell
      eyebrow="TODAY"
      title="Mutfagina genel bakis"
      description="Inventory, tarifler ve bugunun oncelikli urunleri burada bir araya gelecek."
    >
      <InfoCard title="Yakinda burada olacak">
        <View style={styles.list}>
          <Text style={styles.item}>- Kalan urun ozeti</Text>
          <Text style={styles.item}>- Expiring items kisa listesi</Text>
          <Text style={styles.item}>- Hizli recipe onerileri</Text>
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
