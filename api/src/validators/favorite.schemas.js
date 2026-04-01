import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "A valid recipe id is required.");

export const createFavoriteSchema = z.object({
  recipeId: objectIdSchema
});

export const favoriteRecipeParamsSchema = z.object({
  recipeId: objectIdSchema
});
