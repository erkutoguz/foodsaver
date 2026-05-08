import { API_PATHS } from "../config/api";
import { deleteRequest, getRequest, postRequest } from "../lib/api-client";

export function getFavoritesRequest(token) {
  return getRequest(API_PATHS.favorites.list, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function addFavoriteRequest(token, recipeId) {
  return postRequest(API_PATHS.favorites.list, { recipeId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function removeFavoriteRequest(token, recipeId) {
  return deleteRequest(API_PATHS.favorites.byRecipeId(recipeId), {
    headers: { Authorization: `Bearer ${token}` }
  });
}
