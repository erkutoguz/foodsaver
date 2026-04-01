import { analyzeMockImage } from "../adapters/mock-image-recognition.provider.js";

function toDetectedItemResponse(item) {
  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    confidence: item.confidence
  };
}

export async function analyzeImage(_userId, payload) {
  const result = await analyzeMockImage(payload);

  return {
    analysis: {
      provider: result.provider,
      sourceType: result.sourceType,
      summary: result.summary,
      detectedItems: result.detectedItems.map(toDetectedItemResponse)
    }
  };
}
