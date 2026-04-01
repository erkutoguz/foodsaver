import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "A valid id is required.");

export const createRecipeJobSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required.")
});

export const recipeParamsSchema = z.object({
  id: objectIdSchema
});
