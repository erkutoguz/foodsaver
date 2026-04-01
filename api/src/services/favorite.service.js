import { Favorite } from "../models/favorite.model.js";
import { Recipe } from "../models/recipe.model.js";
import { createError } from "../utils/http-error.js";

function toRecipeResponse(recipe) {
  return {
    id: recipe._id.toString(),
    title: recipe.title,
    prompt: recipe.prompt,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    estimatedTimeMinutes: recipe.estimatedTimeMinutes,
    calories: recipe.calories,
    missingIngredients: recipe.missingIngredients,
    provider: recipe.provider,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt
  };
}

function toFavoriteResponse(favorite, recipe = favorite.recipeId) {
  return {
    id: favorite._id.toString(),
    recipeId: recipe?._id ? recipe._id.toString() : favorite.recipeId.toString(),
    recipe: recipe?._id ? toRecipeResponse(recipe) : null,
    createdAt: favorite.createdAt,
    updatedAt: favorite.updatedAt
  };
}

export async function listFavorites(userId) {
  const favorites = await Favorite.find({ userId })
    .sort({
      createdAt: -1
    })
    .populate("recipeId");

  return {
    favorites: favorites
      .filter((favorite) => favorite.recipeId)
      .map((favorite) => toFavoriteResponse(favorite))
  };
}

export async function addFavorite(userId, { recipeId }) {
  const recipe = await Recipe.findOne({
    _id: recipeId,
    userId
  });

  if (!recipe) {
    throw createError(404, "RECIPE_NOT_FOUND", "Recipe was not found.");
  }

  const existingFavorite = await Favorite.findOne({
    userId,
    recipeId
  });

  if (existingFavorite) {
    throw createError(409, "FAVORITE_ALREADY_EXISTS", "Recipe is already in favorites.");
  }

  const favorite = await Favorite.create({
    userId,
    recipeId
  });

  return {
    favorite: toFavoriteResponse(favorite, recipe)
  };
}

export async function removeFavorite(userId, recipeId) {
  const favorite = await Favorite.findOneAndDelete({
    userId,
    recipeId
  });

  if (!favorite) {
    throw createError(404, "FAVORITE_NOT_FOUND", "Favorite recipe was not found.");
  }

  return {
    status: "deleted"
  };
}
