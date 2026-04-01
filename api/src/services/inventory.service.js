import {
  createInventoryItemRecord,
  deleteInventoryItemByIdAndUserId,
  findInventoryItemsByUserId,
  updateInventoryItemByIdAndUserId
} from "../repositories/inventory.repository.js";
import { createError } from "../utils/http-error.js";

function toInventoryItemResponse(item) {
  return {
    id: item._id.toString(),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    expiresAt: item.expiresAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export async function listInventoryItems(userId) {
  const items = await findInventoryItemsByUserId(userId);

  return {
    items: items.map(toInventoryItemResponse)
  };
}

export async function createInventoryItem(userId, payload) {
  const item = await createInventoryItemRecord({
    userId,
    ...payload
  });

  return {
    item: toInventoryItemResponse(item)
  };
}

export async function updateInventoryItem(userId, itemId, payload) {
  const item = await updateInventoryItemByIdAndUserId(itemId, userId, payload);

  if (!item) {
    throw createError(404, "INVENTORY_ITEM_NOT_FOUND", "Inventory item was not found.");
  }

  return {
    item: toInventoryItemResponse(item)
  };
}

export async function deleteInventoryItem(userId, itemId) {
  const item = await deleteInventoryItemByIdAndUserId(itemId, userId);

  if (!item) {
    throw createError(404, "INVENTORY_ITEM_NOT_FOUND", "Inventory item was not found.");
  }

  return {
    status: "deleted"
  };
}
