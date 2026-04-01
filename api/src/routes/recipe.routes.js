import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createRecipeJob, getRecipeById, getRecipeJob } from "../services/recipe.service.js";
import { cookRecipe } from "../services/history.service.js";
import { createRecipeJobSchema, recipeParamsSchema } from "../validators/recipe.schemas.js";

const recipeRouter = Router();

recipeRouter.use(requireAuth);

recipeRouter.post("/generate", validate(createRecipeJobSchema), async (request, response, next) => {
  try {
    const result = await createRecipeJob(request.user._id, request.body);
    response.status(202).json(result);
  } catch (error) {
    next(error);
  }
});

recipeRouter.get("/jobs/:id", validate(recipeParamsSchema, "params"), async (request, response, next) => {
  try {
    const result = await getRecipeJob(request.user._id, request.params.id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

recipeRouter.post("/:id/cook", validate(recipeParamsSchema, "params"), async (request, response, next) => {
  try {
    const result = await cookRecipe(request.user._id, request.params.id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

recipeRouter.get("/:id", validate(recipeParamsSchema, "params"), async (request, response, next) => {
  try {
    const result = await getRecipeById(request.user._id, request.params.id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { recipeRouter };
