import { env } from "../config/env.js";
import { generateGeminiRecipe } from "./gemini-recipe.provider.js";
import { generateMockRecipe } from "./mock-recipe.provider.js";

export async function generateRecipe(payload) {
  if (env.AI_PROVIDER === "gemini") {
    return generateGeminiRecipe(payload);
  }

  return generateMockRecipe(payload);
}
