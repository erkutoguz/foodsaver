import { API_TIMEOUT, API_URL } from "../config/api";

export async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, API_TIMEOUT);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      throw new Error(data?.message || `Request failed with status ${response.status}.`);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getRequest(path, options = {}) {
  return request(path, {
    ...options,
    method: "GET"
  });
}

export function postRequest(path, body, options = {}) {
  return request(path, {
    ...options,
    method: "POST",
    body
  });
}

export function patchRequest(path, body, options = {}) {
  return request(path, {
    ...options,
    method: "PATCH",
    body
  });
}

export function deleteRequest(path, options = {}) {
  return request(path, {
    ...options,
    method: "DELETE"
  });
}
