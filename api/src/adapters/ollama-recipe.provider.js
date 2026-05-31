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
const GENERIC_MAX_PER_SERVING = {
  piece: 6,
  gram: 450,
  ml: 600
};
const INGREDIENT_MAX_PER_SERVING = new Map(
  Object.entries({
    tomato: { piece: 3, gram: 300 },
    egg: { piece: 3 },
    rice: { gram: 150 },
    chicken: { gram: 300 },
    "chicken breast": { gram: 300 },
    onion: { piece: 1, gram: 220 },
    milk: { ml: 350 },
    potato: { piece: 3, gram: 450 },
    pasta: { gram: 180 }
  })
);
const STOCK_ONLY_EXAMPLE = [
  "Example pantry stock for a 2-serving breakfast:",
  "- Tomato: available 18 piece",
  "- Egg: available 6 piece",
  "Those numbers are maximum available stock only.",
  "A good 2-serving recipe can still use 2 tomatoes and 4 eggs if that is the normal amount."
].join("\n");
const QUALITY_EXAMPLE = JSON.stringify({
  title: "Tomato Egg Breakfast Skillet",
  ingredients: [
    { name: "egg", quantity: 4, unit: "piece" },
    { name: "tomato", quantity: 2, unit: "piece" },
    { name: "onion", quantity: 1, unit: "piece" }
  ],
  steps: [
    "Crack the eggs into a bowl, add a pinch of salt, and beat them for 20 seconds until smooth.",
    "Heat a pan over medium heat for 1 minute, then cook the onion for 2 to 3 minutes until softened and fragrant.",
    "Add the tomato and cook for 2 minutes until it softens and releases a little juice.",
    "Pour in the eggs and cook over medium-low heat for 2 to 3 minutes, stirring gently until softly set."
  ],
  estimatedTimeMinutes: 15
});
const SINGULAR_WORD_MAP = new Map(
  Object.entries({
    tomatoes: "tomato",
    eggs: "egg",
    onions: "onion",
    potatoes: "potato",
    breasts: "breast"
  })
);

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

function singularizeWord(word) {
  if (SINGULAR_WORD_MAP.has(word)) {
    return SINGULAR_WORD_MAP.get(word);
  }

  if (word.endsWith("ies") && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith("oes") && word.length > 4) {
    return word.slice(0, -2);
  }

  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1);
  }

  return word;
}

function normalizeIngredientName(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return normalized;
  }

  const words = normalized.split(" ");
  const lastWordIndex = words.length - 1;

  words[lastWordIndex] = singularizeWord(words[lastWordIndex]);

  return words.join(" ");
}

function normalizeUnit(value) {
  return String(value || "").trim().toLowerCase();
}

function toPantryReferenceItems(inventoryItems) {
  return inventoryItems
    .filter((item) => item && typeof item.name === "string" && item.name.trim() !== "")
    .map((item) => ({
      normalizedName: normalizeIngredientName(item.name),
      quantity: typeof item.quantity === "number" ? item.quantity : null,
      unit: normalizeUnit(item.unit)
    }));
}

function findMatchingPantryItems(ingredientName, ingredientUnit, pantryItems) {
  const normalizedIngredientName = normalizeIngredientName(ingredientName);
  const normalizedIngredientUnit = normalizeUnit(ingredientUnit);

  return pantryItems.filter((item) => {
    return item.normalizedName === normalizedIngredientName && item.unit === normalizedIngredientUnit;
  });
}

function getIngredientMaxQuantity(name, unit, servings) {
  const normalizedName = normalizeIngredientName(name);
  const normalizedUnit = normalizeUnit(unit);
  const ingredientSpecific = INGREDIENT_MAX_PER_SERVING.get(normalizedName)?.[normalizedUnit];
  const perServingLimit = ingredientSpecific ?? GENERIC_MAX_PER_SERVING[normalizedUnit];

  if (perServingLimit == null) {
    return Number.POSITIVE_INFINITY;
  }

  return perServingLimit * servings;
}

function isClearlyAboveNormalQuantity(quantity, maxAllowedQuantity) {
  return Number.isFinite(maxAllowedQuantity) && quantity > maxAllowedQuantity;
}

function buildQuantityIssueMessage(ingredient, servings, maxAllowedQuantity) {
  return `${ingredient.name} quantity ${ingredient.quantity} ${ingredient.unit} is too high for ${servings} servings. Keep it at or below ${maxAllowedQuantity} ${ingredient.unit}.`;
}

function buildStockCopyIssueMessage(ingredient, servings, pantryQuantity, maxAllowedQuantity) {
  return `${ingredient.name} copies pantry stock quantity ${pantryQuantity} ${ingredient.unit} for ${servings} servings. Pantry amounts are maximum available stock, not recipe targets. Keep it at or below ${maxAllowedQuantity} ${ingredient.unit}.`;
}

function toInventoryList(inventoryItems) {
  if (inventoryItems.length === 0) {
    return "- No pantry items available.";
  }

  return inventoryItems
    .map((item) => {
      const details = [];

      if (item.category) {
        details.push(`category: ${item.category}`);
      }

      if (item.expiresAt) {
        details.push(`expiresAt: ${item.expiresAt}`);
      }

      const detailSuffix = details.length > 0 ? ` (${details.join("; ")})` : "";

      return `- ${item.name}: available ${item.quantity} ${item.unit}${detailSuffix}`;
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
    "Available pantry stock. These are maximum available amounts, NOT recipe amounts:",
    toInventoryList(inventoryItems),
    "",
    "Constraints:",
    "- Recipe must feel like a real home-cookable dish.",
    "- Recipe must match the user request closely.",
    `- Recipe must be designed for exactly ${servings} servings.`,
    `- Ingredient quantities must be practical and scaled for exactly ${servings} servings.`,
    "- Available pantry quantities are upper bounds only, not target recipe amounts.",
    "- Never copy pantry stock quantities directly into recipe ingredients.",
    "- Pantry stock tells what is available, not what must be used.",
    `- For ${servings} servings, use normal ${servings}-serving culinary amounts even if the pantry has much more.`,
    "- If pantry has 18 tomatoes and the recipe needs tomatoes for 2 servings, use a normal amount such as 1 to 3 tomatoes, not 18.",
    "- Every ingredient must include both quantity and unit.",
    "- Do not use all pantry quantity unless that amount is genuinely normal for the dish and serving count.",
    "- If the pantry has more stock than needed, use only the normal required quantity in the recipe.",
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
    "Compact example showing stock-versus-recipe distinction:",
    STOCK_ONLY_EXAMPLE,
    "",
    "Compact example of the expected JSON quality:",
    QUALITY_EXAMPLE,
    "Do not copy the example exactly. Use it only as a guide for specificity, realism, and step detail.",
    ...(correctiveFeedback
      ? [
          "",
          "Your previous draft was too weak.",
          `Regenerate using normal culinary quantities for exactly ${servings} servings.`,
          "Previous output copied or overused pantry stock quantities.",
          "Pantry amounts are maximum available stock, not target recipe amounts.",
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

function validateRecipeQuality(recipe, { servings, inventoryItems }) {
  const issues = [];
  const normalizedTitle = normalizeText(recipe.title);
  const normalizedSteps = recipe.steps.map(normalizeText);
  const normalizedIngredients = recipe.ingredients.map((ingredient) => normalizeText(ingredient.name));
  const uniqueIngredients = new Set(normalizedIngredients);
  const pantryItems = toPantryReferenceItems(inventoryItems);

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

  for (const ingredient of recipe.ingredients) {
    const maxAllowedQuantity = getIngredientMaxQuantity(
      ingredient.name,
      ingredient.unit,
      servings
    );

    if (isClearlyAboveNormalQuantity(ingredient.quantity, maxAllowedQuantity)) {
      issues.push(buildQuantityIssueMessage(ingredient, servings, maxAllowedQuantity));
    }

    const matchingPantryItems = findMatchingPantryItems(ingredient.name, ingredient.unit, pantryItems);
    const copiedPantryItem = matchingPantryItems.find((item) => item.quantity === ingredient.quantity);

    if (
      copiedPantryItem &&
      isClearlyAboveNormalQuantity(ingredient.quantity, maxAllowedQuantity)
    ) {
      issues.push(
        buildStockCopyIssueMessage(
          ingredient,
          servings,
          copiedPantryItem.quantity,
          maxAllowedQuantity
        )
      );
    }
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
        validateRecipeQuality(parsedRecipe, {
          servings,
          inventoryItems
        });
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
