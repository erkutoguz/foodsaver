import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { env } from "../config/env.js";

const OLLAMA_TIMEOUT_MS = 120000;

const ingredientSchema = z.object({
  name: z.string().trim().min(1).describe("Ingredient name."),
  quantity: z.number().positive().describe("Ingredient quantity as a number."),
  unit: z.enum(["piece", "gram", "ml"]).describe("Ingredient unit. Use only piece, gram, or ml.")
});

const ollamaRecipeSchema = z.object({
  title: z.string().trim().min(1).describe("Short recipe title."),
  ingredients: z.array(ingredientSchema).min(1).max(8).describe("Ingredients for the recipe."),
  steps: z.array(z.string().trim().min(1)).min(2).max(8).describe("Cooking steps."),
  estimatedTimeMinutes: z.number().int().min(5).max(180).describe("Estimated cooking time in minutes."),
  calories: z.number().int().min(0).max(2500).describe("Estimated calories for the full recipe."),
  missingIngredients: z.array(z.string().trim().min(1)).max(8).describe("Ingredients the user may still need.")
});

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
    "Return ONLY valid JSON that matches the provided schema.",
    "Do not include any text outside JSON.",
    "Do not include explanations, comments, reasoning text, or markdown.",
    "Your full response must be a single JSON object with no prose before or after it."
  ].join(" ");
}

function buildUserMessage({ prompt, inventoryItems }) {
  return [
    "User recipe request:",
    prompt,
    "",
    "Available inventory:",
    toInventoryList(inventoryItems),
    "",
    "Constraints:",
    "- Prefer using the available inventory first.",
    "- Use only these units for ingredients: piece, gram, ml.",
    "- Keep the recipe realistic and simple for a student user.",
    "- Return estimatedTimeMinutes and calories as numbers.",
    "- Put unavailable but useful items into missingIngredients."
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

export async function generateOllamaRecipe({ prompt, inventoryItems }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, OLLAMA_TIMEOUT_MS);

  try {
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
            temperature: 0
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
                inventoryItems
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

    let parsedRecipe;

    try {
      parsedRecipe = ollamaRecipeSchema.parse(parsedContent);
    } catch {
      throw new Error("Ollama response did not match the recipe schema.");
    }

    return {
      ...parsedRecipe,
      provider: "ollama"
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
