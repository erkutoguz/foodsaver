import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FormField } from "../components/FormField";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import {
  cookRecipeRequest,
  createRecipeJobRequest,
  getRecipeDetailRequest,
  getRecipeJobRequest
} from "../services/recipe-service";
import {
  addFavoriteRequest,
  getFavoritesRequest,
  removeFavoriteRequest
} from "../services/favorite-service";
import { useAuthStore } from "../store/auth-store";
import { colors } from "../theme/colors";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60000;
const PRESET_SERVINGS = [2, 4, 6];

export function RecipesScreen() {
  const token = useAuthStore((state) => state.token);
  const [prompt, setPrompt] = useState("");
  const [promptError, setPromptError] = useState("");
  const [servings, setServings] = useState(2);
  const [customServings, setCustomServings] = useState("");
  const [jobStatus, setJobStatus] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewMode, setViewMode] = useState("form");
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isFetchingRecipe, setIsFetchingRecipe] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isCookingRecipe, setIsCookingRecipe] = useState(false);
  const [hasCookedRecipe, setHasCookedRecipe] = useState(false);
  const [cookError, setCookError] = useState("");
  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const activeJobIdRef = useRef(null);
  const pollInFlightRef = useRef(false);
  const isMountedRef = useRef(true);

  function clearPollingTimers() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    pollInFlightRef.current = false;
  }

  function resetToFormMode() {
    clearPollingTimers();
    activeJobIdRef.current = null;
    setJobStatus("");
    setRecipe(null);
    setErrorMessage("");
    setPromptError("");
    setViewMode("form");
    setIsCreatingJob(false);
    setIsPolling(false);
    setIsFetchingRecipe(false);
    setIsFavorite(false);
    setIsFavoriteLoading(false);
    setIsCookingRecipe(false);
    setHasCookedRecipe(false);
    setCookError("");
    setPrompt("");
    setServings(2);
    setCustomServings("");
  }

  async function checkFavoriteStatus(recipeId) {
    try {
      const result = await getFavoritesRequest(token);
      const favorites = result?.favorites || [];
      setIsFavorite(favorites.some((f) => f.recipeId === recipeId));
    } catch {
      // non-critical — leave isFavorite as false
    }
  }

  async function handleToggleFavorite() {
    if (!recipe || isFavoriteLoading) {
      return;
    }

    setIsFavoriteLoading(true);

    try {
      if (isFavorite) {
        await removeFavoriteRequest(token, recipe.id);
        setIsFavorite(false);
      } else {
        await addFavoriteRequest(token, recipe.id);
        setIsFavorite(true);
      }
    } catch (error) {
      // silently ignore — state stays as-is
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  function handleCookRecipe() {
    if (!recipe || isCookingRecipe || hasCookedRecipe) {
      return;
    }

    Alert.alert(
      "Cook this recipe?",
      "Matching ingredients will be removed from your pantry and this recipe will be added to your cooking history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Cook recipe",
          onPress: async () => {
            setIsCookingRecipe(true);
            setCookError("");

            try {
              await cookRecipeRequest(token, recipe.id);
              setHasCookedRecipe(true);
            } catch (error) {
              setCookError(error.message || "Could not cook recipe. Please try again.");
            } finally {
              setIsCookingRecipe(false);
            }
          }
        }
      ]
    );
  }

  async function loadRecipeDetail(recipeId, expectedJobId) {
    if (!token) {
      setErrorMessage("You need to be signed in.");
      setViewMode("error");
      return;
    }

    setIsFetchingRecipe(true);

    try {
      const result = await getRecipeDetailRequest(token, recipeId);

      if (!isMountedRef.current || activeJobIdRef.current !== expectedJobId) {
        return;
      }

      if (!result?.recipe) {
        throw new Error("Generated recipe could not be loaded.");
      }

      setRecipe(result.recipe);
      setViewMode("result");
      setErrorMessage("");
      void checkFavoriteStatus(result.recipe.id);
    } catch (error) {
      if (!isMountedRef.current || activeJobIdRef.current !== expectedJobId) {
        return;
      }

      setErrorMessage(error.message || "Generated recipe could not be loaded.");
      setViewMode("error");
    } finally {
      if (isMountedRef.current && activeJobIdRef.current === expectedJobId) {
        setIsFetchingRecipe(false);
      }
    }
  }

  async function pollRecipeJob(targetJobId) {
    if (!token || activeJobIdRef.current !== targetJobId || pollInFlightRef.current) {
      return;
    }

    pollInFlightRef.current = true;

    try {
      const result = await getRecipeJobRequest(token, targetJobId);

      if (!isMountedRef.current || activeJobIdRef.current !== targetJobId) {
        return;
      }

      setJobStatus(result?.status || "queued");

      if (result?.status === "completed") {
        clearPollingTimers();
        setIsPolling(false);

        if (!result.recipeId) {
          setErrorMessage("Recipe generation finished, but no recipe was returned.");
          setViewMode("error");
          return;
        }

        await loadRecipeDetail(result.recipeId, targetJobId);
        return;
      }

      if (result?.status === "failed") {
        clearPollingTimers();
        setIsPolling(false);
        setErrorMessage(result.errorMessage || "Recipe generation failed.");
        setViewMode("error");
      }
    } catch (error) {
      if (!isMountedRef.current || activeJobIdRef.current !== targetJobId) {
        return;
      }

      clearPollingTimers();
      setIsPolling(false);
      setErrorMessage(error.message || "Could not check recipe status.");
      setViewMode("error");
    } finally {
      pollInFlightRef.current = false;
    }
  }

  function startPolling(targetJobId) {
    clearPollingTimers();
    activeJobIdRef.current = targetJobId;
    setIsPolling(true);

    pollTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current || activeJobIdRef.current !== targetJobId) {
        return;
      }

      clearPollingTimers();
      setIsPolling(false);
      setErrorMessage("Recipe generation is taking longer than expected. Please try again.");
      setViewMode("error");
    }, POLL_TIMEOUT_MS);

    void pollRecipeJob(targetJobId);

    pollIntervalRef.current = setInterval(() => {
      void pollRecipeJob(targetJobId);
    }, POLL_INTERVAL_MS);
  }

  async function handleGenerateRecipe() {
    const trimmedPrompt = prompt.trim();
    const selectedServings = getSelectedServings(customServings, servings);

    if (!trimmedPrompt) {
      setPromptError("Please enter a recipe prompt.");
      return;
    }

    if (!selectedServings) {
      setPromptError("Please choose a whole-number serving size between 1 and 20.");
      return;
    }

    if (!token) {
      setPromptError("");
      setErrorMessage("You need to be signed in.");
      setViewMode("error");
      return;
    }

    clearPollingTimers();
    activeJobIdRef.current = null;
    setPrompt(trimmedPrompt);
    setPromptError("");
    setJobStatus("");
    setRecipe(null);
    setErrorMessage("");
    setViewMode("form");
    setIsPolling(false);
    setIsFetchingRecipe(false);
    setIsCreatingJob(true);

    try {
      const result = await createRecipeJobRequest(token, {
        prompt: trimmedPrompt,
        servings: selectedServings
      });

      if (!result?.jobId) {
        throw new Error("Recipe generation could not be started.");
      }

      if (!isMountedRef.current) {
        return;
      }

      setJobStatus(result.status || "queued");
      setViewMode("progress");
      startPolling(result.jobId);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setErrorMessage(error.message || "Recipe generation could not be started.");
      setViewMode("error");
    } finally {
      if (isMountedRef.current) {
        setIsCreatingJob(false);
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearPollingTimers();
      activeJobIdRef.current = null;
    };
  }, []);

  const isGenerateDisabled = isCreatingJob || isPolling || isFetchingRecipe;
  const progressMessage = isFetchingRecipe
    ? "Your recipe is ready. We are loading the final details now."
    : jobStatus === "processing"
      ? "We are turning your pantry into a simple, practical recipe."
      : "Your request is queued and waiting to be processed.";
  const progressStage = getProgressStage(jobStatus, isFetchingRecipe);
  const progressBadgeLabel = getProgressBadgeLabel(jobStatus, isFetchingRecipe);

  return (
    <ScreenShell
      scrollable
      eyebrow="RECIPES"
      title="Generate recipes"
      description="Describe what you want to cook, and we will build a recipe from the pantry items already saved to your account."
    >
      {viewMode === "form" ? (
        <InfoCard title="Recipe prompt" tone="accent">
          <View style={styles.section}>
            <Text style={styles.helperText}>
              Recipe ideas work best after you add pantry items, but you can still try a prompt anytime.
            </Text>

            <FormField
              label="What do you want to cook?"
              value={prompt}
              onChangeText={(value) => {
                setPrompt(value);
                if (promptError) {
                  setPromptError("");
                }
              }}
              placeholder="high protein dinner"
              autoCapitalize="sentences"
              returnKeyType="go"
              onSubmitEditing={handleGenerateRecipe}
            />

            <View style={styles.servingsSection}>
              <Text style={styles.servingsLabel}>Serving size</Text>

              <View style={styles.servingsRow}>
                {PRESET_SERVINGS.map((value) => {
                  const isSelected = customServings === "" && servings === value;

                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.servingBox,
                        isSelected && styles.servingBoxActive
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setCustomServings("");
                        setServings(value);
                        if (promptError) {
                          setPromptError("");
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.servingBoxText,
                          isSelected && styles.servingBoxTextActive
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={[styles.customServingsBox, customServings !== "" && styles.customServingsBoxActive]}>
                  <TextInput
                    value={customServings}
                    onChangeText={(value) => {
                      const digitsOnly = value.replace(/[^\d]/g, "");
                      setCustomServings(digitsOnly);

                      if (digitsOnly) {
                        setServings(Number(digitsOnly));
                      } else {
                        setServings(2);
                      }

                      if (promptError) {
                        setPromptError("");
                      }
                    }}
                    placeholder="..."
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleGenerateRecipe}
                    style={styles.customServingsInput}
                    textAlign="center"
                  />
                </View>
              </View>
            </View>

            {promptError ? <Text style={styles.formError}>{promptError}</Text> : null}

            <PrimaryButton
              label="Generate recipe"
              onPress={handleGenerateRecipe}
              loading={isCreatingJob}
              disabled={isGenerateDisabled}
            />
          </View>
        </InfoCard>
      ) : null}

      {viewMode === "progress" ? (
        <InfoCard title="Generating your recipe" tone="accent">
          <View style={styles.progressBox}>
            <View style={styles.progressOrb}>
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progressBadgeLabel}</Text>
            </View>
            <Text style={styles.progressTitle}>{getProgressLabel(jobStatus)}</Text>
            <Text style={styles.progressText}>{progressMessage}</Text>

            <View style={styles.stageRow}>
              {[
                { key: "queued", label: "Queued" },
                { key: "processing", label: "Cooking ideas" },
                { key: "ready", label: "Finishing up" }
              ].map((stage, index) => {
                const isActive = progressStage >= index;

                return (
                  <View key={stage.key} style={styles.stageItem}>
                    <View style={[styles.stageDot, isActive && styles.stageDotActive]} />
                    <Text style={[styles.stageLabel, isActive && styles.stageLabelActive]}>
                      {stage.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </InfoCard>
      ) : null}

      {viewMode === "error" ? (
        <InfoCard title="Recipe generation issue">
          <View style={styles.section}>
            <Text style={styles.errorText}>
              {errorMessage || "Something went wrong while generating the recipe."}
            </Text>

            <View style={styles.buttonStack}>
              <PrimaryButton
                label="Try again"
                onPress={handleGenerateRecipe}
                disabled={isGenerateDisabled}
              />
            </View>
          </View>
        </InfoCard>
      ) : null}

      {viewMode === "result" && recipe ? (
        <>
          <InfoCard title={recipe.title} tone="accent">
            <View style={styles.section}>
              <Text style={styles.recipePrompt}>Prompt: {recipe.prompt}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>
                    {recipe.estimatedTimeMinutes} min
                  </Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{recipe.calories} cal</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{recipe.servings} servings</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
                onPress={handleToggleFavorite}
                disabled={isFavoriteLoading}
                activeOpacity={0.75}
              >
                {isFavoriteLoading ? (
                  <ActivityIndicator size="small" color={isFavorite ? colors.card : colors.brand} />
                ) : (
                  <>
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={15}
                      color={isFavorite ? colors.card : colors.brand}
                    />
                    <Text style={[styles.favoriteButtonText, isFavorite && styles.favoriteButtonTextActive]}>
                      {isFavorite ? "Saved" : "Save"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </InfoCard>

          <InfoCard title="Ingredients">
            <View style={styles.listSection}>
              {recipe.ingredients.map((ingredient, index) => (
                <Text key={`${ingredient.name}-${index}`} style={styles.listText}>
                  {ingredient.quantity} {ingredient.unit} {ingredient.name}
                </Text>
              ))}
            </View>
          </InfoCard>

          <InfoCard title="Steps">
            <View style={styles.listSection}>
              {recipe.steps.map((step, index) => (
                <View key={`step-${index}`} style={styles.stepRow}>
                  <Text style={styles.stepIndex}>{index + 1}.</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </InfoCard>

          {recipe.missingIngredients?.length ? (
            <InfoCard title="Missing ingredients">
              <View style={styles.listSection}>
                {recipe.missingIngredients.map((item, index) => (
                  <Text key={`${item}-${index}`} style={styles.listText}>
                    {item}
                  </Text>
                ))}
              </View>
            </InfoCard>
          ) : null}

          <View style={styles.buttonStack}>
            <PrimaryButton
              label={hasCookedRecipe ? "Cooked" : isCookingRecipe ? "Cooking..." : "Cook recipe"}
              onPress={handleCookRecipe}
              loading={isCookingRecipe}
              disabled={isCookingRecipe || hasCookedRecipe}
            />
            {cookError ? <Text style={styles.cookError}>{cookError}</Text> : null}
            <PrimaryButton
              label="Generate another"
              variant="secondary"
              onPress={resetToFormMode}
            />
          </View>
        </>
      ) : null}
    </ScreenShell>
  );
}

function getProgressLabel(status) {
  if (status === "processing") {
    return "Building the recipe";
  }

  return "Recipe request queued";
}

function getProgressStage(status, isFetchingRecipe) {
  if (isFetchingRecipe) {
    return 2;
  }

  if (status === "processing") {
    return 1;
  }

  return 0;
}

function getProgressBadgeLabel(status, isFetchingRecipe) {
  if (isFetchingRecipe) {
    return "Finalizing";
  }

  if (status === "processing") {
    return "In progress";
  }

  return "Queued";
}

function getSelectedServings(customServings, fallbackServings) {
  if (customServings.trim() !== "") {
    const parsed = Number(customServings);

    if (Number.isInteger(parsed) && parsed > 0 && parsed <= 20) {
      return parsed;
    }

    return null;
  }

  if (Number.isInteger(fallbackServings) && fallbackServings > 0 && fallbackServings <= 20) {
    return fallbackServings;
  }

  return null;
}

const styles = StyleSheet.create({
  section: {
    gap: 14
  },
  helperText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 20
  },
  formError: {
    color: colors.tomato,
    fontSize: 13,
    fontWeight: "600"
  },
  servingsSection: {
    gap: 10
  },
  servingsLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  servingsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  customServingsBox: {
    width: 54,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center"
  },
  customServingsBoxActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  customServingsInput: {
    width: "100%",
    minHeight: 48,
    paddingHorizontal: 6,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  servingBox: {
    minWidth: 54,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line
  },
  servingBoxActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand
  },
  servingBoxText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  servingBoxTextActive: {
    color: colors.brand
  },
  progressBox: {
    alignItems: "center",
    gap: 14
  },
  progressOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bfdbfe"
  },
  progressBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bfdbfe"
  },
  progressBadgeText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "800"
  },
  progressTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center"
  },
  progressText: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  stageRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 4
  },
  stageItem: {
    flex: 1,
    alignItems: "center",
    gap: 8
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#cbd5e1"
  },
  stageDotActive: {
    backgroundColor: colors.brand
  },
  stageLabel: {
    color: colors.slate,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  stageLabelActive: {
    color: colors.ink
  },
  errorText: {
    color: colors.tomato,
    fontSize: 14,
    lineHeight: 21
  },
  buttonStack: {
    gap: 10
  },
  cookError: {
    color: colors.tomato,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600"
  },
  recipePrompt: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 20
  },
  favoriteButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.brand,
    backgroundColor: colors.card,
    minWidth: 80
  },
  favoriteButtonActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand
  },
  favoriteButtonText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700"
  },
  favoriteButtonTextActive: {
    color: colors.card
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.line
  },
  metaPillText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  listSection: {
    gap: 10
  },
  listText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
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
  }
});
