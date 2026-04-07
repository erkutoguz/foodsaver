import { env } from "../config/env.js";
import { analyzeGeminiImage } from "./gemini-vision.provider.js";
import { analyzeMockImage } from "./mock-image-recognition.provider.js";

export async function analyzeImage(input) {
  if (env.IMAGE_AI_PROVIDER === "gemini") {
    return analyzeGeminiImage(input);
  }

  return analyzeMockImage(input);
}
