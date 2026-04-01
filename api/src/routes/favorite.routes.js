import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { addFavorite, listFavorites, removeFavorite } from "../services/favorite.service.js";
import { createFavoriteSchema, favoriteRecipeParamsSchema } from "../validators/favorite.schemas.js";

const favoriteRouter = Router();

favoriteRouter.use(requireAuth);

favoriteRouter.get("/", async (request, response, next) => {
  try {
    const result = await listFavorites(request.user._id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

favoriteRouter.post("/", validate(createFavoriteSchema), async (request, response, next) => {
  try {
    const result = await addFavorite(request.user._id, request.body);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

favoriteRouter.delete(
  "/:recipeId",
  validate(favoriteRecipeParamsSchema, "params"),
  async (request, response, next) => {
    try {
      const result = await removeFavorite(request.user._id, request.params.recipeId);
      response.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export { favoriteRouter };
