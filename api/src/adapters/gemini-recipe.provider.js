import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { env } from "../config/env.js";

const ingredientSchema = z.object({
  name: z.string().trim().min(1).describe("Ingredient name."),
  quantity: z.number().positive().describe("Ingredient quantity as a number."),
  unit: z.enum(["piece", "gram", "ml"]).describe("Ingredient unit. Use only piece, gram, or ml.")
});

const geminiRecipeSchema = z.object({
  title: z.string().trim().min(1).describe("Short recipe title."),
  ingredients: z.array(ingredientSchema).min(1).max(8).describe("Ingredients for the recipe."),
  steps: z.array(z.string().trim().min(1)).min(2).max(8).describe("Cooking steps."),
  estimatedTimeMinutes: z.number().int().min(5).max(180).describe("Estimated cooking time in minutes."),
  calories: z.number().int().min(0).max(2500).describe("Estimated calories for the full recipe."),
  missingIngredients: z.array(z.string().trim().min(1)).max(8).describe("Ingredients the user may still need.")
});

function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Gemini provider is enabled but GEMINI_API_KEY is missing.");
  }

  return new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY
  });
}

function toInventoryList(inventoryItems) {
  if (inventoryItems.length === 0) {
    return "- No inventory items available.";
  }

  return inventoryItems
    .map((item) => `- ${item.name}: ${item.quantity} ${item.unit}${item.category ? ` (${item.category})` : ""}`)
    .join("\n");
}

function buildRecipePrompt({ prompt, inventoryItems }) {
  return `
Create one practical recipe for the user.

User request:
${prompt}

Available inventory:
${toInventoryList(inventoryItems)}

Rules:
- Prefer using the available inventory first.
- Use only these units for ingredients: piece, gram, ml.
- Keep the recipe realistic and simple for a student user.
- Return estimatedTimeMinutes and calories as numbers.
- Put unavailable but useful items into missingIngredients.
- Do not include markdown or extra explanation outside the JSON response.
  `.trim();
}

export async function generateGeminiRecipe({ prompt, inventoryItems }) {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: buildRecipePrompt({
      prompt,
      inventoryItems
    }),
    config: {
      systemInstruction:
        "You are a recipe generator for a pantry app. Always return valid JSON that matches the provided schema.",
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(geminiRecipeSchema)
    }
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  const parsedRecipe = geminiRecipeSchema.parse(JSON.parse(response.text));

  return {
    ...parsedRecipe,
    provider: "gemini"
  };
}
