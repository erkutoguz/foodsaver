import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { env } from "../config/env.js";

const OLLAMA_TIMEOUT_MS = 120000;
const OLLAMA_MAX_RETRIES = 1;
const VAGUE_STEP_PHRASES = [
  "cook until done",
  "prepare ingredients",
  "mix everything",
  "serve and enjoy"
];
const COOKING_CUE_WORDS = [
  "minute",
  "minutes",
  "medium",
  "low",
  "high",
  "golden",
  "browned",
  "tender",
  "opaque",
  "fragrant",
  "soft",
  "crisp",
  "simmer",
  "boil",
  "saute",
  "bake",
  "roast"
];
const QUALITY_EXAMPLE = JSON.stringify({
  title: "Garlic Chicken Rice Skillet",
  ingredients: [
    { name: "chicken breast", quantity: 300, unit: "gram" },
    { name: "rice", quantity: 180, unit: "gram" },
    { name: "onion", quantity: 1, unit: "piece" }
  ],
  steps: [
    "Cut the chicken into bite-size pieces, season it lightly, and let it sit while you rinse the rice.",
    "Heat a pan over medium heat for 1 minute, then cook the chicken for 5 to 6 minutes until lightly browned and just cooked through.",
    "Add the onion and cook over medium heat for 2 to 3 minutes until softened and fragrant.",
    "Stir in the rice, add water, and simmer gently for about 15 minutes until the rice is tender and the liquid is absorbed."
  ],
  estimatedTimeMinutes: 30
});

const ingredientSchema = z.object({
  name: z.string().trim().min(1).describe("Ingredient name."),
  quantity: z.number().positive().describe("Ingredient quantity as a number."),
  unit: z.enum(["piece", "gram", "ml"]).describe("Ingredient unit. Use only piece, gram, or ml.")
});

const ollamaRecipeSchema = z.object({
  title: z.string().trim().min(10).max(80).describe("Specific, realistic recipe title."),
  ingredients: z.array(ingredientSchema).min(3).max(10).describe("Ingredients for the recipe."),
  steps: z
    .array(z.string().trim().min(24).max(280))
    .min(4)
    .max(8)
    .describe("Sequential cooking steps with useful detail."),
  estimatedTimeMinutes: z.number().int().min(5).max(180).describe("Estimated cooking time in minutes."),
});

class RecipeQualityError extends Error {
  constructor(issues) {
    super(`Ollama recipe quality validation failed: ${issues.join(" ")}`);
    this.name = "RecipeQualityError";
    this.issues = issues;
  }
}

function getOllamaModel() {
  const model = env.OLLAMA_MODEL.trim();

  if (!model) {
    throw new Error("Ollama provider is enabled but OLLAMA_MODEL is missing.");
  }

  return model;
}

function getOllamaEndpoint() {
  return `${env.OLLAMA_BASE_URL.trim().replace(/\/+$/, "")}/api/chat`;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toInventoryList(inventoryItems) {
  if (inventoryItems.length === 0) {
    return "- No inventory items available.";
  }

  return inventoryItems
    .map((item) => {
      const parts = [
        `name: ${item.name}`,
        `quantity: ${item.quantity}`,
        `unit: ${item.unit}`
      ];

      if (item.category) {
        parts.push(`category: ${item.category}`);
      }

      if (item.expiresAt) {
        parts.push(`expiresAt: ${item.expiresAt}`);
      }

      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}

function buildSystemMessage() {
  return [
    "You are a recipe generator for a pantry application.",
    "Your job is to create recipes that feel like real home-cookable dishes, not rough pantry notes.",
    "Prioritize recipe quality and culinary coherence first, while still following the JSON schema exactly.",
    "Return ONLY valid JSON that matches the provided schema.",
    "Do not include any text outside JSON.",
    "Do not include explanations, comments, reasoning text, or markdown.",
    "Your full response must be a single JSON object with no prose before or after it.",
    "The user prompt may be written in any language, but all generated recipe content must be in English.",
    "Do not translate or rename JSON keys. Keep JSON keys exactly as defined by the schema.",
    "Only generated field values may vary, and those generated field values must be in English.",
    "The recipe must be practical, coherent, and written like something a person could actually cook at home."
  ].join(" ");
}

function buildUserMessage({ prompt, inventoryItems, servings, correctiveFeedback = "" }) {
  return [
    "User recipe request:",
    prompt,
    "",
    `Requested serving size: ${servings}`,
    "",
    "Available inventory:",
    toInventoryList(inventoryItems),
    "",
    "Constraints:",
    "- Recipe must feel like a real home-cookable dish.",
    "- Recipe must match the user request closely.",
    `- Recipe must be designed for exactly ${servings} servings.`,
    `- Ingredient quantities must be practical and scaled for exactly ${servings} servings.`,
    "- Every ingredient must include both quantity and unit.",
    "- Do not use all pantry quantity unless the serving size actually requires it.",
    "- If the pantry has more stock than needed, use only the required quantity in the recipe.",
    "- Prefer pantry ingredients when reasonable, but do not create awkward pantry-only recipes.",
    "- Use only these units for ingredients: piece, gram, ml.",
    "- Include realistic seasoning when appropriate.",
    "- Steps must be sequential, specific, and useful.",
    "- Avoid vague steps such as 'cook until done', 'prepare ingredients', 'mix everything', or 'serve and enjoy'.",
    "- Steps should include helpful cooking cues like heat level, approximate time, or texture/doneness detail when relevant.",
    "- Steps must only reference ingredients listed in the ingredients array.",
    "- All important ingredients used in the steps must appear in the ingredients array.",
    "- Interpret the user prompt even if it is not in English.",
    "- Always return English values for title, ingredient names, and steps.",
    "- Do not translate JSON keys; only generate English field values."
    ,
    "",
    "Compact example of the expected JSON quality:",
    QUALITY_EXAMPLE,
    "Do not copy the example exactly. Use it only as a guide for specificity, realism, and step detail.",
    ...(correctiveFeedback
      ? [
          "",
          "Your previous draft was too weak.",
          `Fix these problems in the new draft: ${correctiveFeedback}`
        ]
      : [])
  ].join("\n");
}

function parseJson(text) {
  return JSON.parse(text);
}

function tryParseJson(text) {
  try {
    return parseJson(text);
  } catch {
    return null;
  }
}

function validateRecipeQuality(recipe) {
  const issues = [];
  const normalizedTitle = normalizeText(recipe.title);
  const normalizedSteps = recipe.steps.map(normalizeText);
  const normalizedIngredients = recipe.ingredients.map((ingredient) => normalizeText(ingredient.name));
  const uniqueIngredients = new Set(normalizedIngredients);

  if (normalizedTitle.split(" ").length < 2) {
    issues.push("Title is too generic.");
  }

  if (
    normalizedTitle === "recipe" ||
    normalizedTitle === "dinner" ||
    normalizedTitle === "lunch" ||
    normalizedTitle === "breakfast" ||
    normalizedTitle.endsWith(" recipe")
  ) {
    issues.push("Title is too generic.");
  }

  if (uniqueIngredients.size !== normalizedIngredients.length) {
    issues.push("Ingredient names should not be duplicated.");
  }

  const repeatedSteps = normalizedSteps.filter(
    (step, index) => normalizedSteps.indexOf(step) !== index
  );

  if (repeatedSteps.length > 0) {
    issues.push("Steps must not repeat identical instructions.");
  }

  const vagueSteps = normalizedSteps.filter((step) =>
    VAGUE_STEP_PHRASES.some((phrase) => step.includes(phrase))
  );

  if (vagueSteps.length > 0) {
    issues.push("Steps are too vague.");
  }

  const cueStepCount = normalizedSteps.filter((step) =>
    COOKING_CUE_WORDS.some((word) => step.includes(word))
  ).length;

  if (cueStepCount < 2) {
    issues.push("Steps need more useful cooking cues.");
  }

  if (issues.length > 0) {
    throw new RecipeQualityError(issues);
  }
}

async function requestOllamaRecipe({ prompt, inventoryItems, servings, correctiveFeedback, controller }) {
  let response;

  try {
    response = await fetch(getOllamaEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: getOllamaModel(),
        stream: false,
        format: zodToJsonSchema(ollamaRecipeSchema),
        options: {
          temperature: 0,
          top_p: 0.9,
          repeat_penalty: 1.05,
          num_predict: 900
        },
        messages: [
          {
            role: "system",
            content: buildSystemMessage()
          },
          {
            role: "user",
            content: buildUserMessage({
              prompt,
              servings,
              inventoryItems,
              correctiveFeedback
            })
          }
        ]
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Ollama request timed out after ${OLLAMA_TIMEOUT_MS}ms.`);
    }

    throw new Error(`Ollama request failed: ${error.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    const errorPayload = errorText ? tryParseJson(errorText) : null;

    if (typeof errorPayload?.error === "string" && errorPayload.error.trim() !== "") {
      throw new Error(errorPayload.error);
    }

    throw new Error(`Ollama request failed with status ${response.status}.`);
  }

  const responseText = await response.text();
  let payload = null;

  if (responseText) {
    try {
      payload = parseJson(responseText);
    } catch {
      throw new Error("Ollama returned invalid JSON.");
    }
  }

  const rawContent = payload?.message?.content;

  if (typeof rawContent !== "string" || rawContent.trim() === "") {
    throw new Error("Ollama returned an empty response.");
  }

  let parsedContent;

  try {
    parsedContent = parseJson(rawContent);
  } catch {
    throw new Error("Ollama returned invalid JSON.");
  }

  try {
    return ollamaRecipeSchema.parse(parsedContent);
  } catch {
    throw new Error("Ollama response did not match the recipe schema.");
  }
}

export async function generateOllamaRecipe({ prompt, inventoryItems, servings = 2 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, OLLAMA_TIMEOUT_MS);

  try {
    let correctiveFeedback = "";

    for (let attempt = 0; attempt <= OLLAMA_MAX_RETRIES; attempt += 1) {
      const parsedRecipe = await requestOllamaRecipe({
        prompt,
        inventoryItems,
        servings,
        correctiveFeedback,
        controller
      });

      try {
        validateRecipeQuality(parsedRecipe);
        return {
          ...parsedRecipe,
          provider: "ollama"
        };
      } catch (error) {
        if (!(error instanceof RecipeQualityError) || attempt === OLLAMA_MAX_RETRIES) {
          throw error;
        }

        correctiveFeedback = error.issues.join(" ");
      }
    }

    throw new Error("Ollama recipe generation failed.");
  } finally {
    clearTimeout(timeoutId);
  }
}
