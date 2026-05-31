import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "A valid id is required.");

export const createRecipeJobSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required."),
  servings: z.coerce
    .number()
    .int("Servings must be a whole number.")
    .min(1, "Servings must be at least 1.")
    .max(20, "Servings cannot be greater than 20.")
    .default(2)
});

export const recipeParamsSchema = z.object({
  id: objectIdSchema
});

export const cookPreviewParamsSchema = recipeParamsSchema;

export const cookRecipeBodySchema = z.object({
  consumedIngredients: z
    .array(
      z.object({
        ingredientName: z.string().trim().min(1, "Ingredient name is required."),
        pantryItemId: objectIdSchema,
        quantity: z.coerce.number().positive("Quantity must be greater than zero."),
        unit: z.string().trim().min(1, "Unit is required.")
      })
    )
    .min(1, "At least one consumed ingredient is required.")
});
