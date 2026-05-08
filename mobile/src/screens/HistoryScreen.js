import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { getHistoryRequest } from "../services/history-service";
import { useAuthStore } from "../store/auth-store";
import { colors } from "../theme/colors";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function HistoryRecipeCard({ entry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{entry.title}</Text>
        <Text style={styles.cardDate}>{formatDate(entry.cookedAt)}</Text>
      </View>

      {entry.prompt ? (
        <Text style={styles.cardPrompt} numberOfLines={expanded ? undefined : 1}>
          {entry.prompt}
        </Text>
      ) : null}

      {entry.estimatedTimeMinutes != null || entry.calories != null ? (
        <View style={styles.metaRow}>
          {entry.estimatedTimeMinutes != null ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{entry.estimatedTimeMinutes} min</Text>
            </View>
          ) : null}
          {entry.calories != null ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{entry.calories} cal</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {expanded ? (
        <>
          <View style={styles.divider} />

          {entry.ingredients?.length ? (
            <>
              <Text style={styles.sectionLabel}>Ingredients</Text>
              <View style={styles.listSection}>
                {entry.ingredients.map((ing, i) => (
                  <Text key={i} style={styles.listText}>
                    {ing.quantity} {ing.unit} {ing.name}
                  </Text>
                ))}
              </View>
            </>
          ) : null}

          {entry.steps?.length ? (
            <>
              <Text style={styles.sectionLabel}>Steps</Text>
              <View style={styles.listSection}>
                {entry.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <Text style={styles.stepIndex}>{i + 1}.</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {entry.missingIngredients?.length ? (
            <>
              <Text style={styles.sectionLabel}>Missing ingredients</Text>
              <View style={styles.listSection}>
                {entry.missingIngredients.map((item, i) => (
                  <Text key={i} style={styles.listText}>{item}</Text>
                ))}
              </View>
            </>
          ) : null}

          {entry.consumedIngredients?.length ? (
            <>
              <Text style={styles.sectionLabel}>Consumed from pantry</Text>
              <View style={styles.listSection}>
                {entry.consumedIngredients.map((ing, i) => (
                  <Text key={i} style={styles.listText}>
                    {ing.quantity} {ing.unit} {ing.name}
                  </Text>
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.divider} />
        </>
      ) : null}

      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        style={styles.expandButton}
        activeOpacity={0.7}
      >
        <Text style={styles.expandButtonText}>{expanded ? "Show less" : "Read more"}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.brand}
        />
      </TouchableOpacity>
    </View>
  );
}

export function HistoryScreen({ navigation }) {
  const token = useAuthStore((state) => state.token);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadHistory(refreshing = false) {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const result = await getHistoryRequest(token);
      setHistory(result?.history ?? []);
    } catch (err) {
      setError(err.message || "Could not load cooking history.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [token])
  );

  return (
    <ScreenShell
      scrollable
      eyebrow="HISTORY"
      title="Cooking history"
      description="Every recipe you have cooked, in order."
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadHistory(true)}
          tintColor={colors.brand}
        />
      }
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : error ? (
        <InfoCard title="Could not load history">
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton
            label="Try again"
            variant="secondary"
            onPress={() => loadHistory()}
          />
        </InfoCard>
      ) : history.length === 0 ? (
        <InfoCard title="No cooking history yet">
          <Text style={styles.emptyText}>
            You have not cooked any recipe yet. Generate a recipe and cook it to build your history.
          </Text>
          <PrimaryButton
            label="Generate a recipe"
            onPress={() => navigation.navigate("Recipes")}
          />
        </InfoCard>
      ) : (
        history.map((entry) => (
          <HistoryRecipeCard key={entry.id} entry={entry} />
        ))
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingTop: 40,
    alignItems: "center"
  },
  errorText: {
    color: colors.tomato,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12
  },
  emptyText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  cardTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  cardDate: {
    color: colors.slate,
    fontSize: 12,
    fontWeight: "600",
    paddingTop: 2
  },
  cardPrompt: {
    color: colors.slate,
    fontSize: 13,
    lineHeight: 19
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line
  },
  metaPillText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700"
  },
  divider: {
    height: 1,
    backgroundColor: colors.line
  },
  sectionLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  listSection: {
    gap: 8
  },
  listText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  stepIndex: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "800",
    width: 20
  },
  stepText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start"
  },
  expandButtonText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700"
  }
});
