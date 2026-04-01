import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createInventoryItem,
  deleteInventoryItem,
  listInventoryItems,
  updateInventoryItem
} from "../services/inventory.service.js";
import {
  createInventoryItemSchema,
  inventoryItemParamsSchema,
  updateInventoryItemSchema
} from "../validators/inventory.schemas.js";

const inventoryRouter = Router();

inventoryRouter.use(requireAuth);

inventoryRouter.get("/", async (request, response, next) => {
  try {
    const result = await listInventoryItems(request.user._id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.post("/", validate(createInventoryItemSchema), async (request, response, next) => {
  try {
    const result = await createInventoryItem(request.user._id, request.body);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.patch(
  "/:id",
  validate(inventoryItemParamsSchema, "params"),
  validate(updateInventoryItemSchema),
  async (request, response, next) => {
    try {
      const result = await updateInventoryItem(request.user._id, request.params.id, request.body);
      response.json(result);
    } catch (error) {
      next(error);
    }
  }
);

inventoryRouter.delete("/:id", validate(inventoryItemParamsSchema, "params"), async (request, response, next) => {
  try {
    const result = await deleteInventoryItem(request.user._id, request.params.id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { inventoryRouter };
