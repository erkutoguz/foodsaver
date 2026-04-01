import { InventoryItem } from "../models/inventory-item.model.js";
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
  const items = await InventoryItem.find({ userId }).sort({
    createdAt: -1
  });

  return {
    items: items.map(toInventoryItemResponse)
  };
}

export async function createInventoryItem(userId, payload) {
  const item = await InventoryItem.create({
    userId,
    ...payload
  });

  return {
    item: toInventoryItemResponse(item)
  };
}

export async function updateInventoryItem(userId, itemId, payload) {
  const item = await InventoryItem.findOneAndUpdate(
    {
      _id: itemId,
      userId
    },
    payload,
    {
      new: true,
      runValidators: true
    }
  );

  if (!item) {
    throw createError(404, "INVENTORY_ITEM_NOT_FOUND", "Inventory item was not found.");
  }

  return {
    item: toInventoryItemResponse(item)
  };
}

export async function deleteInventoryItem(userId, itemId) {
  const item = await InventoryItem.findOneAndDelete({
    _id: itemId,
    userId
  });

  if (!item) {
    throw createError(404, "INVENTORY_ITEM_NOT_FOUND", "Inventory item was not found.");
  }

  return {
    status: "deleted"
  };
}
