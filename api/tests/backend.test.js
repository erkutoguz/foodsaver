import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.CLIENT_ORIGIN = "*";
process.env.LOG_LEVEL = "error";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "7d";
process.env.RECIPE_JOB_DELAY_MS = "10";
process.env.AI_PROVIDER = "mock";

let mongoServer;
let app;
let createApp;
let connectDatabase;
let Favorite;
let InventoryItem;
let Recipe;
let RecipeHistory;
let RecipeJob;
let User;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  ({ createApp } = await import("../src/app.js"));
  ({ connectDatabase } = await import("../src/config/database.js"));
  ({ Favorite } = await import("../src/models/favorite.model.js"));
  ({ InventoryItem } = await import("../src/models/inventory-item.model.js"));
  ({ RecipeHistory } = await import("../src/models/recipe-history.model.js"));
  ({ Recipe } = await import("../src/models/recipe.model.js"));
  ({ RecipeJob } = await import("../src/models/recipe-job.model.js"));
  ({ User } = await import("../src/models/user.model.js"));

  await connectDatabase();
  app = createApp();
});

beforeEach(async () => {
  await Favorite.deleteMany({});
  await InventoryItem.deleteMany({});
  await Recipe.deleteMany({});
  await RecipeHistory.deleteMany({});
  await RecipeJob.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("backend", () => {
  function daysFromNow(days) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    date.setUTCHours(12, 0, 0, 0);
    return date.toISOString();
  }

  async function waitForRecipeJobCompletion(authHeader, jobId) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await request(app).get(`/api/recipes/jobs/${jobId}`).set("Authorization", authHeader);

      if (response.body.status === "completed" || response.body.status === "failed") {
        return response;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
    }

    throw new Error(`Recipe job ${jobId} did not finish in time.`);
  }

  async function registerAndGetAuthHeader(user = {}) {
    const response = await request(app).post("/api/auth/register").send({
      fullName: user.fullName || "Erkut O.",
      email: user.email || "erkut@example.com",
      password: user.password || "123456"
    });

    return {
      token: response.body.token,
      authHeader: `Bearer ${response.body.token}`,
      user: response.body.user
    };
  }

  async function createRecipeForUser(session, prompt = "easy lunch") {
    const createJobResponse = await request(app)
      .post("/api/recipes/generate")
      .set("Authorization", session.authHeader)
      .send({
        prompt
      });

    const completedJobResponse = await waitForRecipeJobCompletion(session.authHeader, createJobResponse.body.jobId);

    return {
      job: completedJobResponse.body,
      recipeId: completedJobResponse.body.recipeId
    };
  }

  it("returns health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.environment).toBe("test");
  });

  it("registers a user", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Erkut O.",
      email: "ERKUT@example.com",
      password: "123456"
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTypeOf("string");
    expect(response.body.user.email).toBe("erkut@example.com");
    expect(response.body.user.fullName).toBe("Erkut O.");
  });

  it("does not register the same email twice", async () => {
    await request(app).post("/api/auth/register").send({
      fullName: "Erkut O.",
      email: "erkut@example.com",
      password: "123456"
    });

    const response = await request(app).post("/api/auth/register").send({
      fullName: "Erkut O.",
      email: "erkut@example.com",
      password: "123456"
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("EMAIL_ALREADY_USED");
  });

  it("logs in an existing user", async () => {
    await request(app).post("/api/auth/register").send({
      fullName: "Erkut O.",
      email: "erkut@example.com",
      password: "123456"
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "erkut@example.com",
      password: "123456"
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTypeOf("string");
    expect(response.body.user.email).toBe("erkut@example.com");
  });

  it("returns validation error for bad register payload", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "",
      email: "not-an-email",
      password: "123"
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns current user for a valid token", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({
      fullName: "Erkut O.",
      email: "erkut@example.com",
      password: "123456"
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registerResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("erkut@example.com");
  });

  it("rejects /me without token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
  });

  it("creates an inventory item for the authenticated user", async () => {
    const session = await registerAndGetAuthHeader();

    const response = await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Milk",
      quantity: 2,
      unit: "piece",
      category: "dairy",
      expiresAt: "2026-05-01T00:00:00.000Z"
    });

    expect(response.status).toBe(201);
    expect(response.body.item.name).toBe("Milk");
    expect(response.body.item.quantity).toBe(2);
    expect(response.body.item.category).toBe("dairy");
  });

  it("lists only the current user's inventory items", async () => {
    const firstUser = await registerAndGetAuthHeader({
      email: "first@example.com"
    });
    const secondUser = await registerAndGetAuthHeader({
      email: "second@example.com"
    });

    await request(app).post("/api/inventory").set("Authorization", firstUser.authHeader).send({
      name: "Egg",
      quantity: 6,
      unit: "piece"
    });

    await request(app).post("/api/inventory").set("Authorization", secondUser.authHeader).send({
      name: "Rice",
      quantity: 500,
      unit: "gram"
    });

    const response = await request(app).get("/api/inventory").set("Authorization", firstUser.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].name).toBe("Egg");
  });

  it("updates an existing inventory item", async () => {
    const session = await registerAndGetAuthHeader();
    const createResponse = await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Tomato",
      quantity: 3,
      unit: "piece"
    });

    const response = await request(app)
      .patch(`/api/inventory/${createResponse.body.item.id}`)
      .set("Authorization", session.authHeader)
      .send({
        quantity: 5,
        category: "vegetable"
      });

    expect(response.status).toBe(200);
    expect(response.body.item.quantity).toBe(5);
    expect(response.body.item.category).toBe("vegetable");
  });

  it("deletes an inventory item", async () => {
    const session = await registerAndGetAuthHeader();
    const createResponse = await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Water",
      quantity: 1000,
      unit: "ml"
    });

    const response = await request(app)
      .delete(`/api/inventory/${createResponse.body.item.id}`)
      .set("Authorization", session.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("deleted");

    const itemsInDatabase = await InventoryItem.find({});
    expect(itemsInDatabase).toHaveLength(0);
  });

  it("rejects inventory requests without token", async () => {
    const response = await request(app).get("/api/inventory");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
  });

  it("returns validation error for bad inventory payload", async () => {
    const session = await registerAndGetAuthHeader();

    const response = await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "",
      quantity: 0,
      unit: "box"
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("does not allow one user to update another user's inventory item", async () => {
    const firstUser = await registerAndGetAuthHeader({
      email: "first-owner@example.com"
    });
    const secondUser = await registerAndGetAuthHeader({
      email: "second-owner@example.com"
    });

    const createResponse = await request(app).post("/api/inventory").set("Authorization", firstUser.authHeader).send({
      name: "Cheese",
      quantity: 1,
      unit: "piece"
    });

    const response = await request(app)
      .patch(`/api/inventory/${createResponse.body.item.id}`)
      .set("Authorization", secondUser.authHeader)
      .send({
        quantity: 2
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("INVENTORY_ITEM_NOT_FOUND");
  });

  it("returns inventory summary counts for expired, expiring soon, and safe items", async () => {
    const session = await registerAndGetAuthHeader({
      email: "summary@example.com"
    });

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Old Milk",
      quantity: 1,
      unit: "piece",
      expiresAt: daysFromNow(-1)
    });

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Yogurt",
      quantity: 1,
      unit: "piece",
      expiresAt: daysFromNow(2)
    });

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Rice",
      quantity: 500,
      unit: "gram",
      expiresAt: daysFromNow(20)
    });

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Salt",
      quantity: 100,
      unit: "gram"
    });

    const response = await request(app)
      .get("/api/inventory/summary?days=7")
      .set("Authorization", session.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.summary.totalItems).toBe(4);
    expect(response.body.summary.expiredCount).toBe(1);
    expect(response.body.summary.expiringSoonCount).toBe(1);
    expect(response.body.summary.safeCount).toBe(2);
    expect(response.body.summary.windowDays).toBe(7);
  });

  it("lists only expired and expiring-soon inventory items", async () => {
    const firstUser = await registerAndGetAuthHeader({
      email: "expiring-first@example.com"
    });
    const secondUser = await registerAndGetAuthHeader({
      email: "expiring-second@example.com"
    });

    await request(app).post("/api/inventory").set("Authorization", firstUser.authHeader).send({
      name: "Old Cheese",
      quantity: 1,
      unit: "piece",
      expiresAt: daysFromNow(-2)
    });

    await request(app).post("/api/inventory").set("Authorization", firstUser.authHeader).send({
      name: "Fresh Milk",
      quantity: 1,
      unit: "piece",
      expiresAt: daysFromNow(3)
    });

    await request(app).post("/api/inventory").set("Authorization", firstUser.authHeader).send({
      name: "Pasta",
      quantity: 500,
      unit: "gram",
      expiresAt: daysFromNow(15)
    });

    await request(app).post("/api/inventory").set("Authorization", secondUser.authHeader).send({
      name: "Private Item",
      quantity: 1,
      unit: "piece",
      expiresAt: daysFromNow(1)
    });

    const response = await request(app)
      .get("/api/inventory/expiring?days=5")
      .set("Authorization", firstUser.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.days).toBe(5);
    expect(response.body.counts.total).toBe(2);
    expect(response.body.counts.expired).toBe(1);
    expect(response.body.counts.expiringSoon).toBe(1);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0].expirationStatus).toBe("expired");
    expect(response.body.items[1].expirationStatus).toBe("expiringSoon");
    expect(response.body.items.map((item) => item.name)).toEqual(["Old Cheese", "Fresh Milk"]);
  });

  it("returns validation error for invalid inventory expiration query", async () => {
    const session = await registerAndGetAuthHeader({
      email: "expiring-validation@example.com"
    });

    const response = await request(app)
      .get("/api/inventory/expiring?days=0")
      .set("Authorization", session.authHeader);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects inventory summary requests without token", async () => {
    const response = await request(app).get("/api/inventory/summary");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
  });

  it("analyzes an image with the mock image recognition provider", async () => {
    const session = await registerAndGetAuthHeader({
      email: "image-recognition@example.com"
    });

    const response = await request(app)
      .post("/api/image-recognition/analyze")
      .set("Authorization", session.authHeader)
      .send({
        imageUrl: "https://example.com/uploads/milk-eggs-tomato.jpg",
        context: "items on a kitchen counter"
      });

    expect(response.status).toBe(200);
    expect(response.body.analysis.provider).toBe("mock");
    expect(response.body.analysis.sourceType).toBe("imageUrl");
    expect(response.body.analysis.detectedItems.length).toBeGreaterThanOrEqual(3);
    expect(response.body.analysis.detectedItems.map((item) => item.name)).toEqual(
      expect.arrayContaining(["Milk", "Egg", "Tomato"])
    );
  });

  it("returns fallback image recognition suggestions when no clear item is found", async () => {
    const session = await registerAndGetAuthHeader({
      email: "image-recognition-fallback@example.com"
    });

    const response = await request(app)
      .post("/api/image-recognition/analyze")
      .set("Authorization", session.authHeader)
      .send({
        fileName: "mystery-photo.png"
      });

    expect(response.status).toBe(200);
    expect(response.body.analysis.detectedItems).toHaveLength(2);
    expect(response.body.analysis.detectedItems[0].name).toBe("Tomato");
  });

  it("confirms detected items and saves them into inventory", async () => {
    const session = await registerAndGetAuthHeader({
      email: "image-confirm@example.com"
    });

    const analyzeResponse = await request(app)
      .post("/api/image-recognition/analyze")
      .set("Authorization", session.authHeader)
      .send({
        imageUrl: "https://example.com/uploads/milk-eggs.jpg"
      });

    const response = await request(app)
      .post("/api/image-recognition/confirm")
      .set("Authorization", session.authHeader)
      .send({
        items: analyzeResponse.body.analysis.detectedItems.slice(0, 2)
      });

    expect(response.status).toBe(201);
    expect(response.body.summary.processedCount).toBe(2);
    expect(response.body.summary.createdCount).toBe(2);
    expect(response.body.summary.mergedCount).toBe(0);
    expect(response.body.savedItems[0].action).toBe("created");

    const inventoryResponse = await request(app).get("/api/inventory").set("Authorization", session.authHeader);

    expect(inventoryResponse.status).toBe(200);
    expect(inventoryResponse.body.items).toHaveLength(2);
    expect(inventoryResponse.body.items.map((item) => item.name)).toEqual(expect.arrayContaining(["Milk", "Egg"]));
  });

  it("merges confirmed items with an existing inventory record", async () => {
    const session = await registerAndGetAuthHeader({
      email: "image-confirm-merge@example.com"
    });

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Milk",
      quantity: 1,
      unit: "piece",
      category: "dairy"
    });

    const response = await request(app)
      .post("/api/image-recognition/confirm")
      .set("Authorization", session.authHeader)
      .send({
        items: [
          {
            name: "milk",
            quantity: 2,
            unit: "piece",
            category: "dairy"
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.summary.createdCount).toBe(0);
    expect(response.body.summary.mergedCount).toBe(1);
    expect(response.body.savedItems[0].action).toBe("merged");
    expect(response.body.savedItems[0].quantity).toBe(3);

    const itemsInDatabase = await InventoryItem.find({ userId: session.user.id });
    expect(itemsInDatabase).toHaveLength(1);
    expect(itemsInDatabase[0].quantity).toBe(3);
  });

  it("returns validation error when image recognition input is missing", async () => {
    const session = await registerAndGetAuthHeader({
      email: "image-recognition-validation@example.com"
    });

    const response = await request(app)
      .post("/api/image-recognition/analyze")
      .set("Authorization", session.authHeader)
      .send({
        context: "fridge photo"
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error for bad image confirmation payload", async () => {
    const session = await registerAndGetAuthHeader({
      email: "image-confirm-validation@example.com"
    });

    const response = await request(app)
      .post("/api/image-recognition/confirm")
      .set("Authorization", session.authHeader)
      .send({
        items: []
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects image recognition requests without token", async () => {
    const response = await request(app).post("/api/image-recognition/analyze").send({
      fileName: "eggs.jpg"
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
  });

  it("rejects image confirmation requests without token", async () => {
    const response = await request(app).post("/api/image-recognition/confirm").send({
      items: [
        {
          name: "Milk",
          quantity: 1,
          unit: "piece"
        }
      ]
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
  });

  it("creates a mock recipe job and returns the generated recipe", async () => {
    const session = await registerAndGetAuthHeader();

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Chicken",
      quantity: 2,
      unit: "piece"
    });

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Rice",
      quantity: 300,
      unit: "gram"
    });

    const createJobResponse = await request(app)
      .post("/api/recipes/generate")
      .set("Authorization", session.authHeader)
      .send({
        prompt: "high protein dinner"
      });

    expect(createJobResponse.status).toBe(202);
    expect(createJobResponse.body.status).toBe("queued");

    const jobResponse = await waitForRecipeJobCompletion(session.authHeader, createJobResponse.body.jobId);

    expect(jobResponse.status).toBe(200);
    expect(jobResponse.body.status).toBe("completed");
    expect(jobResponse.body.recipeId).toBeTypeOf("string");

    const recipeResponse = await request(app)
      .get(`/api/recipes/${jobResponse.body.recipeId}`)
      .set("Authorization", session.authHeader);

    expect(recipeResponse.status).toBe(200);
    expect(recipeResponse.body.recipe.title).toContain("Mock");
    expect(recipeResponse.body.recipe.ingredients.length).toBeGreaterThan(0);
    expect(recipeResponse.body.recipe.steps.length).toBeGreaterThan(0);
    expect(recipeResponse.body.recipe.provider).toBe("mock");
  });

  it("rejects recipe generation without token", async () => {
    const response = await request(app).post("/api/recipes/generate").send({
      prompt: "quick breakfast"
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
  });

  it("returns validation error for bad recipe prompt", async () => {
    const session = await registerAndGetAuthHeader();

    const response = await request(app)
      .post("/api/recipes/generate")
      .set("Authorization", session.authHeader)
      .send({
        prompt: ""
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("does not allow one user to access another user's recipe", async () => {
    const firstUser = await registerAndGetAuthHeader({
      email: "recipe-owner@example.com"
    });
    const secondUser = await registerAndGetAuthHeader({
      email: "recipe-viewer@example.com"
    });

    const createJobResponse = await request(app)
      .post("/api/recipes/generate")
      .set("Authorization", firstUser.authHeader)
      .send({
        prompt: "easy lunch"
      });

    const completedJobResponse = await waitForRecipeJobCompletion(firstUser.authHeader, createJobResponse.body.jobId);

    const recipeResponse = await request(app)
      .get(`/api/recipes/${completedJobResponse.body.recipeId}`)
      .set("Authorization", secondUser.authHeader);

    expect(recipeResponse.status).toBe(404);
    expect(recipeResponse.body.code).toBe("RECIPE_NOT_FOUND");
  });

  it("adds a recipe to favorites", async () => {
    const session = await registerAndGetAuthHeader();
    const recipe = await createRecipeForUser(session, "favorite dinner");

    const response = await request(app).post("/api/favorites").set("Authorization", session.authHeader).send({
      recipeId: recipe.recipeId
    });

    expect(response.status).toBe(201);
    expect(response.body.favorite.recipeId).toBe(recipe.recipeId);
    expect(response.body.favorite.recipe.title).toContain("Mock");
  });

  it("lists only the current user's favorites", async () => {
    const firstUser = await registerAndGetAuthHeader({
      email: "favorite-first@example.com"
    });
    const secondUser = await registerAndGetAuthHeader({
      email: "favorite-second@example.com"
    });

    const firstRecipe = await createRecipeForUser(firstUser, "first favorite");
    const secondRecipe = await createRecipeForUser(secondUser, "second favorite");

    await request(app).post("/api/favorites").set("Authorization", firstUser.authHeader).send({
      recipeId: firstRecipe.recipeId
    });
    await request(app).post("/api/favorites").set("Authorization", secondUser.authHeader).send({
      recipeId: secondRecipe.recipeId
    });

    const response = await request(app).get("/api/favorites").set("Authorization", firstUser.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.favorites).toHaveLength(1);
    expect(response.body.favorites[0].recipeId).toBe(firstRecipe.recipeId);
  });

  it("does not allow the same recipe to be favorited twice", async () => {
    const session = await registerAndGetAuthHeader();
    const recipe = await createRecipeForUser(session, "duplicate favorite");

    await request(app).post("/api/favorites").set("Authorization", session.authHeader).send({
      recipeId: recipe.recipeId
    });

    const response = await request(app).post("/api/favorites").set("Authorization", session.authHeader).send({
      recipeId: recipe.recipeId
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("FAVORITE_ALREADY_EXISTS");
  });

  it("removes a favorite by recipe id", async () => {
    const session = await registerAndGetAuthHeader();
    const recipe = await createRecipeForUser(session, "remove favorite");

    await request(app).post("/api/favorites").set("Authorization", session.authHeader).send({
      recipeId: recipe.recipeId
    });

    const response = await request(app)
      .delete(`/api/favorites/${recipe.recipeId}`)
      .set("Authorization", session.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("deleted");

    const favoritesInDatabase = await Favorite.find({});
    expect(favoritesInDatabase).toHaveLength(0);
  });

  it("rejects favorites requests without token", async () => {
    const response = await request(app).get("/api/favorites");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
  });

  it("does not allow one user to favorite another user's recipe", async () => {
    const firstUser = await registerAndGetAuthHeader({
      email: "recipe-owner-favorite@example.com"
    });
    const secondUser = await registerAndGetAuthHeader({
      email: "recipe-other-favorite@example.com"
    });

    const recipe = await createRecipeForUser(firstUser, "private favorite");

    const response = await request(app).post("/api/favorites").set("Authorization", secondUser.authHeader).send({
      recipeId: recipe.recipeId
    });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("RECIPE_NOT_FOUND");
  });

  it("cooks a recipe and writes a history record", async () => {
    const session = await registerAndGetAuthHeader();

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Chicken",
      quantity: 2,
      unit: "piece"
    });

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Rice",
      quantity: 300,
      unit: "gram"
    });

    const recipe = await createRecipeForUser(session, "protein bowl");

    const response = await request(app)
      .post(`/api/recipes/${recipe.recipeId}/cook`)
      .set("Authorization", session.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("cooked");
    expect(response.body.history.recipeId).toBe(recipe.recipeId);
    expect(response.body.history.consumedIngredients.length).toBeGreaterThan(0);

    const remainingInventory = await InventoryItem.find({ userId: session.user.id }).sort({ createdAt: 1 });
    expect(remainingInventory).toHaveLength(1);
    expect(remainingInventory[0].name).toBe("Rice");
    expect(remainingInventory[0].quantity).toBe(100);

    const historyInDatabase = await RecipeHistory.find({ userId: session.user.id });
    expect(historyInDatabase).toHaveLength(1);
  });

  it("lists recipe history for the authenticated user", async () => {
    const firstUser = await registerAndGetAuthHeader({
      email: "history-first@example.com"
    });
    const secondUser = await registerAndGetAuthHeader({
      email: "history-second@example.com"
    });

    await request(app).post("/api/inventory").set("Authorization", firstUser.authHeader).send({
      name: "Egg",
      quantity: 4,
      unit: "piece"
    });

    await request(app).post("/api/inventory").set("Authorization", secondUser.authHeader).send({
      name: "Milk",
      quantity: 500,
      unit: "ml"
    });

    const firstRecipe = await createRecipeForUser(firstUser, "history breakfast");
    const secondRecipe = await createRecipeForUser(secondUser, "history drink");

    await request(app).post(`/api/recipes/${firstRecipe.recipeId}/cook`).set("Authorization", firstUser.authHeader);
    await request(app).post(`/api/recipes/${secondRecipe.recipeId}/cook`).set("Authorization", secondUser.authHeader);

    const response = await request(app).get("/api/history").set("Authorization", firstUser.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.history).toHaveLength(1);
    expect(response.body.history[0].recipeId).toBe(firstRecipe.recipeId);
    expect(response.body.history[0].title).toContain("Mock");
  });

  it("rejects cooking when inventory is not sufficient anymore", async () => {
    const session = await registerAndGetAuthHeader();

    await request(app).post("/api/inventory").set("Authorization", session.authHeader).send({
      name: "Egg",
      quantity: 2,
      unit: "piece"
    });

    const recipe = await createRecipeForUser(session, "egg breakfast");

    const currentInventory = await request(app).get("/api/inventory").set("Authorization", session.authHeader);
    await request(app)
      .delete(`/api/inventory/${currentInventory.body.items[0].id}`)
      .set("Authorization", session.authHeader);

    const response = await request(app)
      .post(`/api/recipes/${recipe.recipeId}/cook`)
      .set("Authorization", session.authHeader);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("INSUFFICIENT_INVENTORY");
  });

  it("rejects history requests without token", async () => {
    const response = await request(app).get("/api/history");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_REQUIRED");
  });
});
