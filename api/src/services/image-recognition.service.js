import { analyzeMockImage } from "../adapters/mock-image-recognition.provider.js";
import {
  createInventoryItemRecord,
  findInventoryItemByUserIdNameAndUnit,
  updateInventoryItemByIdAndUserId
} from "../repositories/inventory.repository.js";

function toDetectedItemResponse(item) {
  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    confidence: item.confidence
  };
}

function toConfirmedInventoryItemResponse(item, action) {
  return {
    id: item._id.toString(),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    expiresAt: item.expiresAt,
    action,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
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

export async function confirmDetectedItems(userId, { items }) {
  const savedItems = [];
  let createdCount = 0;
  let mergedCount = 0;

  for (const item of items) {
    const existingItem = await findInventoryItemByUserIdNameAndUnit(userId, item.name, item.unit);

    if (!existingItem) {
      const createdItem = await createInventoryItemRecord({
        userId,
        ...item
      });

      savedItems.push(toConfirmedInventoryItemResponse(createdItem, "created"));
      createdCount += 1;
      continue;
    }

    const updatedItem = await updateInventoryItemByIdAndUserId(existingItem._id, userId, {
      quantity: existingItem.quantity + item.quantity,
      category: item.category === undefined ? existingItem.category : item.category,
      expiresAt: item.expiresAt === undefined ? existingItem.expiresAt : item.expiresAt
    });

    savedItems.push(toConfirmedInventoryItemResponse(updatedItem, "merged"));
    mergedCount += 1;
  }

  return {
    savedItems,
    summary: {
      processedCount: items.length,
      createdCount,
      mergedCount
    }
  };
}
