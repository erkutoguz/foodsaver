import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { InfoCard } from "../components/InfoCard";
import { ScreenShell } from "../components/ScreenShell";
import { getFavoritesRequest, removeFavoriteRequest } from "../services/favorite-service";
import { useAuthStore } from "../store/auth-store";
import { colors } from "../theme/colors";

function FavoriteRecipeCard({ favorite, onRemove }) {
  const token = useAuthStore((state) => state.token);
  const [expanded, setExpanded] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const recipe = favorite.recipe;

  async function handleRemove() {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      await removeFavoriteRequest(token, favorite.recipeId);
      onRemove(favorite.recipeId);
    } catch {
      setIsRemoving(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{recipe.title}</Text>
        <TouchableOpacity
          onPress={handleRemove}
          disabled={isRemoving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.removeButton}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color={colors.slate} />
          ) : (
            <Ionicons name="heart" size={22} color={colors.tomato} />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.cardPrompt} numberOfLines={expanded ? undefined : 1}>
        {recipe.prompt}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>{recipe.estimatedTimeMinutes} min</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>{recipe.calories} cal</Text>
        </View>
      </View>

      {expanded ? (
        <>
          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Ingredients</Text>
          <View style={styles.listSection}>
            {recipe.ingredients.map((ing, i) => (
              <Text key={i} style={styles.listText}>
                {ing.quantity} {ing.unit} {ing.name}
              </Text>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Steps</Text>
          <View style={styles.listSection}>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepIndex}>{i + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {recipe.missingIngredients?.length ? (
            <>
              <Text style={styles.sectionLabel}>Missing ingredients</Text>
              <View style={styles.listSection}>
                {recipe.missingIngredients.map((item, i) => (
                  <Text key={i} style={styles.listText}>
                    {item}
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

export function FavoritesScreen() {
  const token = useAuthStore((state) => state.token);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadFavorites(refreshing = false) {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const result = await getFavoritesRequest(token);
      setFavorites(result?.favorites?.filter((f) => f.recipe) ?? []);
    } catch (err) {
      setError(err.message || "Could not load favorites.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [token])
  );

  function handleRemove(recipeId) {
    setFavorites((prev) => prev.filter((f) => f.recipeId !== recipeId));
  }

  return (
    <ScreenShell
      scrollable
      eyebrow="FAVORITES"
      title="Saved recipes"
      description="Recipes you saved while generating."
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadFavorites(true)}
          tintColor={colors.brand}
        />
      }
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : error ? (
        <InfoCard title="Could not load favorites">
          <Text style={styles.errorText}>{error}</Text>
        </InfoCard>
      ) : favorites.length === 0 ? (
        <InfoCard title="No saved recipes">
          <Text style={styles.emptyText}>
            Tap the heart button on any generated recipe to save it here.
          </Text>
        </InfoCard>
      ) : (
        favorites.map((favorite) => (
          <FavoriteRecipeCard
            key={favorite.id}
            favorite={favorite}
            onRemove={handleRemove}
          />
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
    lineHeight: 21
  },
  emptyText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21
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
    gap: 10
  },
  cardTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  removeButton: {
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
