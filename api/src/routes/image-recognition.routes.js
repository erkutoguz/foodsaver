import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { analyzeImage } from "../services/image-recognition.service.js";
import { analyzeImageSchema } from "../validators/image-recognition.schemas.js";

const imageRecognitionRouter = Router();

imageRecognitionRouter.use(requireAuth);

imageRecognitionRouter.post("/analyze", validate(analyzeImageSchema), async (request, response, next) => {
  try {
    const result = await analyzeImage(request.user._id, request.body);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { imageRecognitionRouter };
