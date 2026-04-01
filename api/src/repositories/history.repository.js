import { RecipeHistory } from "../models/recipe-history.model.js";

export function createRecipeHistoryRecord(payload) {
  return RecipeHistory.create(payload);
}

export function findHistoryByUserId(userId) {
  return RecipeHistory.find({ userId }).sort({
    cookedAt: -1
  });
}
