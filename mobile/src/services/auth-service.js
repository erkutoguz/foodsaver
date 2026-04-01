import { API_PATHS } from "../config/api";
import { getRequest, postRequest } from "../lib/api-client";

export function registerRequest(payload) {
  return postRequest(API_PATHS.auth.register, payload);
}

export function loginRequest(payload) {
  return postRequest(API_PATHS.auth.login, payload);
}

export function getCurrentUserRequest(token) {
  return getRequest(API_PATHS.auth.me, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
