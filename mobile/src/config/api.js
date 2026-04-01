import { apiBaseUrl } from "./env";

export const API_URL = apiBaseUrl;
export const API_TIMEOUT = 15000;

export const API_PATHS = {
  health: "/health",
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    me: "/api/auth/me"
  },
  inventory: {
    list: "/api/inventory",
    summary: "/api/inventory/summary",
    expiring: "/api/inventory/expiring"
  },
  imageRecognition: {
    analyze: "/api/image-recognition/analyze",
    confirm: "/api/image-recognition/confirm"
  },
  recipes: {
    generate: "/api/recipes/generate",
    job: (jobId) => `/api/recipes/jobs/${jobId}`,
    detail: (recipeId) => `/api/recipes/${recipeId}`,
    cook: (recipeId) => `/api/recipes/${recipeId}/cook`
  },
  favorites: {
    list: "/api/favorites",
    byRecipeId: (recipeId) => `/api/favorites/${recipeId}`
  },
  history: {
    list: "/api/history"
  }
};
