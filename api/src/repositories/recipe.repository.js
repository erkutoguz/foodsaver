import { Recipe } from "../models/recipe.model.js";

export function createRecipeRecord(payload) {
  return Recipe.create(payload);
}

export function findRecipeByIdAndUserId(recipeId, userId) {
  return Recipe.findOne({
    _id: recipeId,
    userId
  });
}
