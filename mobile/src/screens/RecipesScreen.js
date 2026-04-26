import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { FormField } from "../components/FormField";
import { InfoCard } from "../components/InfoCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import {
  createRecipeJobRequest,
  getRecipeDetailRequest,
  getRecipeJobRequest
} from "../services/recipe-service";
import { useAuthStore } from "../store/auth-store";
import { colors } from "../theme/colors";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60000;

export function RecipesScreen() {
  const token = useAuthStore((state) => state.token);
  const [prompt, setPrompt] = useState("");
  const [promptError, setPromptError] = useState("");
  const [jobStatus, setJobStatus] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewMode, setViewMode] = useState("form");
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isFetchingRecipe, setIsFetchingRecipe] = useState(false);
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
    setPrompt("");
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

    if (!trimmedPrompt) {
      setPromptError("Please enter a recipe prompt.");
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
        prompt: trimmedPrompt
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
              </View>
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
              label="Generate another"
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
  recipePrompt: {
    color: colors.slate,
    fontSize: 14,
    lineHeight: 20
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
