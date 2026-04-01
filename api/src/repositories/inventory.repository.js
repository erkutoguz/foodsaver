import { InventoryItem } from "../models/inventory-item.model.js";

export function findInventoryItemsByUserId(userId, sort = { createdAt: -1 }) {
  return InventoryItem.find({ userId }).sort(sort);
}

export function createInventoryItemRecord(payload) {
  return InventoryItem.create(payload);
}

export function updateInventoryItemByIdAndUserId(itemId, userId, payload) {
  return InventoryItem.findOneAndUpdate(
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
}

export function deleteInventoryItemByIdAndUserId(itemId, userId) {
  return InventoryItem.findOneAndDelete({
    _id: itemId,
    userId
  });
}

export function updateInventoryItemQuantityById(itemId, quantity) {
  return InventoryItem.findByIdAndUpdate(
    itemId,
    {
      quantity
    },
    {
      new: true,
      runValidators: true
    }
  );
}

export function deleteInventoryItemById(itemId) {
  return InventoryItem.findByIdAndDelete(itemId);
}
