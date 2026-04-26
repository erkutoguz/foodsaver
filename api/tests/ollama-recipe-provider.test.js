import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import { generateOllamaRecipe } from "../src/adapters/ollama-recipe.provider.js";

function buildRecipeContent(overrides = {}) {
  return {
    title: "Pantry Rice Bowl",
    ingredients: [
      {
        name: "Rice",
        quantity: 200,
        unit: "gram"
      },
      {
        name: "Egg",
        quantity: 2,
        unit: "piece"
      }
    ],
    steps: ["Cook the rice.", "Top the rice with eggs and serve."],
    estimatedTimeMinutes: 20,
    calories: 480,
    missingIngredients: [],
    ...overrides
  };
}

function buildFetchResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return typeof body === "string" ? body : JSON.stringify(body);
    }
  };
}

describe("ollama recipe provider", () => {
  const originalProvider = env.AI_PROVIDER;
  const originalBaseUrl = env.OLLAMA_BASE_URL;
  const originalModel = env.OLLAMA_MODEL;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    env.AI_PROVIDER = "ollama";
    env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
    env.OLLAMA_MODEL = "llama3.2";
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    env.AI_PROVIDER = originalProvider;
    env.OLLAMA_BASE_URL = originalBaseUrl;
    env.OLLAMA_MODEL = originalModel;
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("throws when OLLAMA_MODEL is missing", async () => {
    env.OLLAMA_MODEL = "";

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama provider is enabled but OLLAMA_MODEL is missing.");
  });

  it("returns a normalized recipe with provider set to ollama", async () => {
    globalThis.fetch.mockResolvedValue(
      buildFetchResponse({
        message: {
          content: JSON.stringify(buildRecipeContent())
        }
      })
    );

    const recipe = await generateOllamaRecipe({
      prompt: "quick lunch",
      inventoryItems: [
        {
          name: "Rice",
          quantity: 300,
          unit: "gram",
          category: "grain",
          expiresAt: null
        }
      ]
    });

    expect(recipe.provider).toBe("ollama");
    expect(recipe.title).toBe("Pantry Rice Bowl");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:11434/api/chat",
      expect.objectContaining({
        method: "POST",
        signal: expect.any(AbortSignal)
      })
    );
  });

  it("does not leak unexpected extra fields from the model output", async () => {
    globalThis.fetch.mockResolvedValue(
      buildFetchResponse({
        message: {
          content: JSON.stringify(
            buildRecipeContent({
              unexpected: "value"
            })
          )
        }
      })
    );

    const recipe = await generateOllamaRecipe({
      prompt: "quick lunch",
      inventoryItems: []
    });

    expect(recipe).not.toHaveProperty("unexpected");
    expect(recipe.provider).toBe("ollama");
  });

  it("wraps network failures with a clear message", async () => {
    globalThis.fetch.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama request failed: connect ECONNREFUSED");
  });

  it("throws a timeout error when the request exceeds the timeout", async () => {
    vi.useFakeTimers();
    globalThis.fetch.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            const error = new Error("This operation was aborted");
            error.name = "AbortError";
            reject(error);
          });
        })
    );

    const promise = generateOllamaRecipe({
      prompt: "quick lunch",
      inventoryItems: []
    });
    const expectation = expect(promise).rejects.toThrow("Ollama request timed out after 120000ms.");

    await vi.advanceTimersByTimeAsync(120000);

    await expectation;
  });

  it("treats AbortError rejections as timeout failures", async () => {
    const error = new Error("This operation was aborted");
    error.name = "AbortError";
    globalThis.fetch.mockRejectedValue(error);

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama request timed out after 120000ms.");
  });

  it("returns the ollama error message for non-200 json responses", async () => {
    globalThis.fetch.mockResolvedValue(buildFetchResponse({ error: "model not found" }, 404));

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("model not found");
  });

  it("falls back to the status code for non-200 non-json responses", async () => {
    globalThis.fetch.mockResolvedValue(buildFetchResponse("service unavailable", 502));

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama request failed with status 502.");
  });

  it("throws when the response is missing the message field", async () => {
    globalThis.fetch.mockResolvedValue(buildFetchResponse({ done: true }));

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama returned an empty response.");
  });

  it("throws when the response is missing message.content", async () => {
    globalThis.fetch.mockResolvedValue(
      buildFetchResponse({
        message: {}
      })
    );

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama returned an empty response.");
  });

  it("throws when message.content is empty", async () => {
    globalThis.fetch.mockResolvedValue(
      buildFetchResponse({
        message: {
          content: "   "
        }
      })
    );

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama returned an empty response.");
  });

  it("throws when message.content is not valid json", async () => {
    globalThis.fetch.mockResolvedValue(
      buildFetchResponse({
        message: {
          content: "not json"
        }
      })
    );

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama returned invalid JSON.");
  });

  it("throws when the structured output is malformed json", async () => {
    globalThis.fetch.mockResolvedValue(
      buildFetchResponse({
        message: {
          content: '{"title":"Broken"'
        }
      })
    );

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama returned invalid JSON.");
  });

  it("throws when required fields are missing", async () => {
    globalThis.fetch.mockResolvedValue(
      buildFetchResponse({
        message: {
          content: JSON.stringify(
            buildRecipeContent({
              steps: undefined
            })
          )
        }
      })
    );

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama response did not match the recipe schema.");
  });

  it("throws when field types are wrong", async () => {
    globalThis.fetch.mockResolvedValue(
      buildFetchResponse({
        message: {
          content: JSON.stringify(
            buildRecipeContent({
              calories: "a lot"
            })
          )
        }
      })
    );

    await expect(
      generateOllamaRecipe({
        prompt: "quick lunch",
        inventoryItems: []
      })
    ).rejects.toThrow("Ollama response did not match the recipe schema.");
  });
});
