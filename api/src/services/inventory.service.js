import {
  createInventoryItemRecord,
  deleteInventoryItemByIdAndUserId,
  findInventoryItemsByUserId,
  updateInventoryItemByIdAndUserId
} from "../repositories/inventory.repository.js";
import { createError } from "../utils/http-error.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_EXPIRING_WINDOW_DAYS = 7;

function getUtcDayTimestamp(value) {
  const date = new Date(value);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getExpirationMeta(expiresAt, windowDays = DEFAULT_EXPIRING_WINDOW_DAYS) {
  if (!expiresAt) {
    return {
      expirationStatus: "safe",
      daysUntilExpiration: null
    };
  }

  const todayTimestamp = getUtcDayTimestamp(new Date());
  const expirationTimestamp = getUtcDayTimestamp(expiresAt);
  const daysUntilExpiration = Math.round((expirationTimestamp - todayTimestamp) / DAY_IN_MS);

  if (daysUntilExpiration < 0) {
    return {
      expirationStatus: "expired",
      daysUntilExpiration
    };
  }

  if (daysUntilExpiration <= windowDays) {
    return {
      expirationStatus: "expiringSoon",
      daysUntilExpiration
    };
  }

  return {
    expirationStatus: "safe",
    daysUntilExpiration
  };
}

function toInventoryItemResponse(item, windowDays = DEFAULT_EXPIRING_WINDOW_DAYS) {
  const expirationMeta = getExpirationMeta(item.expiresAt, windowDays);

  return {
    id: item._id.toString(),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    expiresAt: item.expiresAt,
    expirationStatus: expirationMeta.expirationStatus,
    daysUntilExpiration: expirationMeta.daysUntilExpiration,
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

export async function getInventorySummary(userId, windowDays = DEFAULT_EXPIRING_WINDOW_DAYS) {
  const items = await findInventoryItemsByUserId(userId);

  const summary = items.reduce(
    (result, item) => {
      const expirationMeta = getExpirationMeta(item.expiresAt, windowDays);

      result.totalItems += 1;

      if (expirationMeta.expirationStatus === "expired") {
        result.expiredCount += 1;
      } else if (expirationMeta.expirationStatus === "expiringSoon") {
        result.expiringSoonCount += 1;
      } else {
        result.safeCount += 1;
      }

      return result;
    },
    {
      totalItems: 0,
      expiredCount: 0,
      expiringSoonCount: 0,
      safeCount: 0,
      windowDays
    }
  );

  return {
    summary
  };
}

export async function listExpiringInventoryItems(userId, windowDays = DEFAULT_EXPIRING_WINDOW_DAYS) {
  const items = await findInventoryItemsByUserId(userId, {
    expiresAt: 1,
    createdAt: 1
  });

  const expiringItems = items
    .map((item) => toInventoryItemResponse(item, windowDays))
    .filter((item) => item.expirationStatus === "expired" || item.expirationStatus === "expiringSoon");

  const counts = expiringItems.reduce(
    (result, item) => {
      result.total += 1;

      if (item.expirationStatus === "expired") {
        result.expired += 1;
      } else if (item.expirationStatus === "expiringSoon") {
        result.expiringSoon += 1;
      }

      return result;
    },
    {
      total: 0,
      expired: 0,
      expiringSoon: 0
    }
  );

  return {
    days: windowDays,
    counts,
    items: expiringItems
  };
}
