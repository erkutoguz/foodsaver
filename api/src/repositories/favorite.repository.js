import { Favorite } from "../models/favorite.model.js";

export function findFavoritesByUserIdWithRecipe(userId) {
  return Favorite.find({ userId })
    .sort({
      createdAt: -1
    })
    .populate("recipeId");
}

export function findFavoriteByUserIdAndRecipeId(userId, recipeId) {
  return Favorite.findOne({
    userId,
    recipeId
  });
}

export function createFavoriteRecord(payload) {
  return Favorite.create(payload);
}

export function deleteFavoriteByUserIdAndRecipeId(userId, recipeId) {
  return Favorite.findOneAndDelete({
    userId,
    recipeId
  });
}
