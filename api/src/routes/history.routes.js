import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listHistory } from "../services/history.service.js";

const historyRouter = Router();

historyRouter.use(requireAuth);

historyRouter.get("/", async (request, response, next) => {
  try {
    const result = await listHistory(request.user._id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { historyRouter };
