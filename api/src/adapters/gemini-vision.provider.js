import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { env } from "../config/env.js";

const detectedItemSchema = z.object({
  name: z.string().trim().min(1).describe("Food item name."),
  quantity: z.number().positive().describe("Quantity as a number."),
  unit: z.enum(["piece", "gram", "ml"]).describe("Unit. Use only piece, gram, or ml."),
  category: z.enum(["dairy", "protein", "vegetable", "fruit", "grain", "bakery", "other"])
    .describe("Food category."),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1.")
});

const geminiVisionSchema = z.object({
  detectedItems: z.array(detectedItemSchema).min(1).max(10)
    .describe("Detected food items from the image.")
});

function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Gemini vision provider is enabled but GEMINI_API_KEY is missing.");
  }

  return new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY
  });
}

function buildVisionPrompt(context) {
  const basePrompt = `Analyze this image and identify food items.

Rules:
- Only return detected food items (no containers, appliances, or non-food objects)
- For each item: name, quantity, unit, category, and confidence
- Use only these units: piece, gram, ml
- Use only these categories: dairy, protein, vegetable, fruit, grain, bakery, other
- Confidence should be a number between 0 and 1
- Be realistic with quantities based on what's visible in the image
- Return valid JSON only, no markdown or extra text`;

  if (context) {
    return `${basePrompt}\n\nAdditional context: ${context}`;
  }

  return basePrompt;
}

function getContentType(sourceType) {
  if (sourceType === "imageUrl") {
    return "image/jpeg";
  }

  if (sourceType === "imageBase64") {
    return "image/jpeg";
  }

  if (sourceType === "fileName") {
    return "image/jpeg";
  }

  return "image/jpeg";
}

function formatInlineData(input, sourceType) {
  if (sourceType === "imageUrl") {
    return {
      inlineData: {
        mimeType: "image/jpeg",
        data: input.imageUrl
      }
    };
  }

  if (sourceType === "imageBase64") {
    return {
      inlineData: {
        mimeType: "image/jpeg",
        data: input.imageBase64
      }
    };
  }

  if (sourceType === "fileName") {
    return {
      inlineData: {
        mimeType: "image/jpeg",
        data: input.fileName
      }
    };
  }

  return null;
}

export async function analyzeGeminiImage(input) {
  const ai = getGeminiClient();

  const sourceType = input.imageUrl ? "imageUrl"
    : input.imageBase64 ? "imageBase64"
      : input.fileName ? "fileName"
        : "unknown";

  const imageData = formatInlineData(input, sourceType);

  if (!imageData) {
    throw new Error("No valid image source provided. Provide imageUrl, imageBase64, or fileName.");
  }

  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: buildVisionPrompt(input.context) },
          imageData
        ]
      }
    ],
    config: {
      systemInstruction: "You are a food recognition assistant. Always return valid JSON that matches the provided schema.",
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(geminiVisionSchema)
    }
  });

  if (!response.text) {
    throw new Error("Gemini vision returned an empty response.");
  }

  const parsedResult = geminiVisionSchema.parse(JSON.parse(response.text));

  return {
    provider: "gemini",
    sourceType,
    summary: `Detected ${parsedResult.detectedItems.length} item${parsedResult.detectedItems.length === 1 ? "" : "s"} from image analysis using Gemini Vision.`,
    detectedItems: parsedResult.detectedItems
  };
}
