import { RecipeHistory } from "../models/recipe-history.model.js";

export function createRecipeHistoryRecord(payload) {
  return RecipeHistory.create(payload);
}

export function findHistoryByUserId(userId) {
  return RecipeHistory.find({ userId })
    .populate("recipeId", "ingredients steps estimatedTimeMinutes calories missingIngredients")
    .sort({ cookedAt: -1 });
}
