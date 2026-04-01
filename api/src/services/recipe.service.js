import { generateMockRecipe } from "../adapters/mock-recipe.provider.js";
import { env } from "../config/env.js";
import { InventoryItem } from "../models/inventory-item.model.js";
import { RecipeJob } from "../models/recipe-job.model.js";
import { Recipe } from "../models/recipe.model.js";
import { logger } from "../lib/logger.js";
import { createError } from "../utils/http-error.js";

function toRecipeResponse(recipe) {
  return {
    id: recipe._id.toString(),
    title: recipe.title,
    prompt: recipe.prompt,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    estimatedTimeMinutes: recipe.estimatedTimeMinutes,
    calories: recipe.calories,
    missingIngredients: recipe.missingIngredients,
    provider: recipe.provider,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt
  };
}

function toRecipeJobResponse(job) {
  return {
    jobId: job._id.toString(),
    status: job.status,
    recipeId: job.recipeId ? job.recipeId.toString() : null,
    errorMessage: job.errorMessage,
    completedAt: job.completedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

function scheduleRecipeJobProcessing(jobId) {
  setTimeout(() => {
    void processRecipeJob(jobId).catch((error) => {
      logger.error("Recipe job processing crashed", error);
    });
  }, env.RECIPE_JOB_DELAY_MS);
}

function toInventorySnapshot(items) {
  return items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    expiresAt: item.expiresAt
  }));
}

export async function createRecipeJob(userId, { prompt }) {
  const inventoryItems = await InventoryItem.find({ userId }).sort({
    createdAt: -1
  });

  const job = await RecipeJob.create({
    userId,
    prompt,
    status: "queued",
    inventorySnapshot: toInventorySnapshot(inventoryItems)
  });

  scheduleRecipeJobProcessing(job._id.toString());

  return {
    jobId: job._id.toString(),
    status: job.status
  };
}

export async function getRecipeJob(userId, jobId) {
  const job = await RecipeJob.findOne({
    _id: jobId,
    userId
  });

  if (!job) {
    throw createError(404, "RECIPE_JOB_NOT_FOUND", "Recipe job was not found.");
  }

  return toRecipeJobResponse(job);
}

export async function getRecipeById(userId, recipeId) {
  const recipe = await Recipe.findOne({
    _id: recipeId,
    userId
  });

  if (!recipe) {
    throw createError(404, "RECIPE_NOT_FOUND", "Recipe was not found.");
  }

  return {
    recipe: toRecipeResponse(recipe)
  };
}

export async function processRecipeJob(jobId) {
  const queuedJob = await RecipeJob.findById(jobId);

  if (!queuedJob || queuedJob.status === "completed" || queuedJob.status === "failed") {
    return;
  }

  queuedJob.status = "processing";
  queuedJob.errorMessage = null;
  await queuedJob.save();

  try {
    const generatedRecipe = await generateMockRecipe({
      prompt: queuedJob.prompt,
      inventoryItems: queuedJob.inventorySnapshot
    });

    const recipe = await Recipe.create({
      userId: queuedJob.userId,
      jobId: queuedJob._id,
      prompt: queuedJob.prompt,
      ...generatedRecipe
    });

    queuedJob.status = "completed";
    queuedJob.recipeId = recipe._id;
    queuedJob.completedAt = new Date();
    await queuedJob.save();
  } catch (error) {
    queuedJob.status = "failed";
    queuedJob.errorMessage = error.message || "Recipe generation failed.";
    await queuedJob.save();
    logger.error("Recipe job failed", error);
  }
}
