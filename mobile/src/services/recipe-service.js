import { API_PATHS } from "../config/api";
import { getRequest, postRequest } from "../lib/api-client";

export function createRecipeJobRequest(token, payload) {
  return postRequest(API_PATHS.recipes.generate, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getRecipeJobRequest(token, jobId) {
  return getRequest(API_PATHS.recipes.job(jobId), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getRecipeDetailRequest(token, recipeId) {
  return getRequest(API_PATHS.recipes.detail(recipeId), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getCookPreviewRequest(token, recipeId) {
  return getRequest(API_PATHS.recipes.cookPreview(recipeId), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function cookRecipeRequest(token, recipeId, payload) {
  return postRequest(API_PATHS.recipes.cook(recipeId), payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
