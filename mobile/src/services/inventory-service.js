import { API_PATHS } from "../config/api";
import { getRequest } from "../lib/api-client";

export function getInventoryRequest(token) {
  return getRequest(API_PATHS.inventory.list, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
