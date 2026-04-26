import { API_PATHS } from "../config/api";
import { getRequest } from "../lib/api-client";

export function getHistoryRequest(token) {
  return getRequest(API_PATHS.history.list, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
