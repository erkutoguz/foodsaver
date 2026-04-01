import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { getCurrentUser, loginUser, registerUser } from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validators/auth.schemas.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), async (request, response, next) => {
  try {
    const result = await registerUser(request.body);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", validate(loginSchema), async (request, response, next) => {
  try {
    const result = await loginUser(request.body);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (request, response) => {
  response.json(getCurrentUser(request.user));
});

export { authRouter };
