import { env } from "../config/env.js";
import { generateMockRecipe } from "./mock-recipe.provider.js";
import { generateOllamaRecipe } from "./ollama-recipe.provider.js";

export async function generateRecipe(payload) {
  if (env.AI_PROVIDER === "ollama") {
    return generateOllamaRecipe(payload);
  }

  return generateMockRecipe(payload);
}
