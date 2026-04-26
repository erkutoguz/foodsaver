import { API_PATHS } from "../config/api";
import { deleteRequest, getRequest, postRequest } from "../lib/api-client";

export function getInventoryRequest(token) {
  return getRequest(API_PATHS.inventory.list, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createInventoryRequest(token, payload) {
  return postRequest(API_PATHS.inventory.list, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getInventorySummaryRequest(token, days = 7) {
  return getRequest(`${API_PATHS.inventory.summary}?days=${days}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getExpiringInventoryRequest(token, days = 7) {
  return getRequest(`${API_PATHS.inventory.expiring}?days=${days}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function deleteInventoryItemRequest(token, itemId) {
  return deleteRequest(`${API_PATHS.inventory.list}/${itemId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
