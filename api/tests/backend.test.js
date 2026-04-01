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

let mongoServer;
let app;
let createApp;
let connectDatabase;
let InventoryItem;
let Recipe;
let RecipeJob;
let User;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  ({ createApp } = await import("../src/app.js"));
  ({ connectDatabase } = await import("../src/config/database.js"));
  ({ InventoryItem } = await import("../src/models/inventory-item.model.js"));
  ({ Recipe } = await import("../src/models/recipe.model.js"));
  ({ RecipeJob } = await import("../src/models/recipe-job.model.js"));
  ({ User } = await import("../src/models/user.model.js"));

  await connectDatabase();
  app = createApp();
});

beforeEach(async () => {
  await InventoryItem.deleteMany({});
  await Recipe.deleteMany({});
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
});
