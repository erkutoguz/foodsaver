import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.CLIENT_ORIGIN = "*";
process.env.LOG_LEVEL = "error";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "7d";

let mongoServer;
let app;
let createApp;
let connectDatabase;
let User;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  ({ createApp } = await import("../src/app.js"));
  ({ connectDatabase } = await import("../src/config/database.js"));
  ({ User } = await import("../src/models/user.model.js"));

  await connectDatabase();
  app = createApp();
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("backend", () => {
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
});
