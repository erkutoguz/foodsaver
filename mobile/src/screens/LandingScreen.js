import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { InfoCard } from "../components/InfoCard";
import { LandingHeroArt } from "../components/LandingHeroArt";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors } from "../theme/colors";

export function LandingScreen({ navigation }) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LandingHeroArt />

          <View style={styles.brandTag}>
            <Text style={styles.brandTagText}>FOODSAVER</Text>
          </View>

          <Text style={styles.title}>Plan your meals around the ingredients you already have</Text>
          <Text style={styles.description}>
            Foodsaver helps you keep track of what is in your kitchen, spot items that
            are close to expiring, and find recipes that make sense for your pantry.
          </Text>

          <View style={styles.pills}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Pantry tracking</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Recipe ideas</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Expiry tracking</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Sign In"
              onPress={() => navigation.navigate("Auth", { mode: "login" })}
            />
            <PrimaryButton
              label="Create Account"
              variant="secondary"
              onPress={() => navigation.navigate("Auth", { mode: "register" })}
            />
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>24/7</Text>
            <Text style={styles.metricLabel}>kitchen control</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardAccent]}>
            <Text style={styles.metricValue}>AI</Text>
            <Text style={styles.metricLabel}>recipe support</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>WHY IT HELPS</Text>
          <Text style={styles.sectionTitle}>The experience keeps going after the recipe suggestion</Text>
        </View>

        <View style={styles.recipeSpotlight}>
          <View style={styles.recipeTopRow}>
            <View>
              <Text style={styles.recipeEyebrow}>TODAY'S SAMPLE RECIPE</Text>
              <Text style={styles.recipeTitle}>Creamy Veggie Pasta</Text>
            </View>
            <View style={styles.recipeBadge}>
              <Text style={styles.recipeBadgeText}>12 min</Text>
            </View>
          </View>

          <View style={styles.recipeArtRow}>
            <View style={styles.recipeArtPlate}>
              <Text style={styles.recipeArtEmoji}>🍝</Text>
            </View>
            <View style={styles.recipeTags}>
              <View style={styles.recipeTag}>
                <Text style={styles.recipeTagText}>broccoli</Text>
              </View>
              <View style={styles.recipeTag}>
                <Text style={styles.recipeTagText}>cream</Text>
              </View>
              <View style={styles.recipeTag}>
                <Text style={styles.recipeTagText}>pasta</Text>
              </View>
            </View>
          </View>

          <Text style={styles.recipeDescription}>
            A simple but satisfying dinner idea that turns what you already have into
            something practical for tonight.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper
  },
  content: {
    padding: 20,
    gap: 16
  },
  hero: {
    gap: 16
  },
  brandTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.brandSoft
  },
  brandTagText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800"
  },
  description: {
    color: colors.slate,
    fontSize: 15,
    lineHeight: 23
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  pill: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line
  },
  pillText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700"
  },
  actions: {
    gap: 10,
    marginTop: 4
  },
  metricRow: {
    flexDirection: "row",
    gap: 12
  },
  metricCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: colors.ink,
    padding: 16,
    gap: 4
  },
  metricCardAccent: {
    backgroundColor: colors.tomato
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800"
  },
  metricLabel: {
    color: "#e7edf3",
    fontSize: 13,
    fontWeight: "600"
  },
  sectionHeader: {
    gap: 4,
    marginTop: 4
  },
  sectionEyebrow: {
    color: colors.tomato,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800"
  },
  highlightRow: {
    gap: 12
  },
  highlightCard: {
    borderRadius: 22,
    padding: 18,
    gap: 8
  },
  highlightGreen: {
    backgroundColor: colors.mint
  },
  highlightWarm: {
    backgroundColor: colors.warm
  },
  highlightRose: {
    backgroundColor: "#ffe1e8"
  },
  highlightTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  highlightText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  },
  recipeSpotlight: {
    backgroundColor: colors.ink,
    borderRadius: 28,
    padding: 18,
    gap: 14
  },
  recipeTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  recipeEyebrow: {
    color: "#f9c3a8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9
  },
  recipeTitle: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800"
  },
  recipeBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  recipeBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700"
  },
  recipeArtRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  recipeArtPlate: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#fff5ef",
    alignItems: "center",
    justifyContent: "center"
  },
  recipeArtEmoji: {
    fontSize: 40
  },
  recipeTags: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  recipeTag: {
    borderRadius: 999,
    backgroundColor: "#19324f",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  recipeTagText: {
    color: "#d7e0ea",
    fontSize: 12,
    fontWeight: "700"
  },
  recipeDescription: {
    color: "#d7e0ea",
    fontSize: 14,
    lineHeight: 21
  },
  flowCard: {
    borderRadius: 26,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 16
  },
  flowTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800"
  },
  flowStep: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start"
  },
  flowNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  flowNumberText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "800"
  },
  flowTextWrap: {
    flex: 1,
    gap: 4
  },
  flowStepTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  flowStepText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  },
  list: {
    gap: 8
  },
  listItem: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
  },
  bottomCta: {
    borderRadius: 28,
    backgroundColor: colors.tomato,
    padding: 20,
    gap: 12
  },
  bottomCtaTitle: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800"
  },
  bottomCtaText: {
    color: "#ffede4",
    fontSize: 14,
    lineHeight: 21
  }
});
