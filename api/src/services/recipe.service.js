import { generateRecipe } from "../adapters/recipe.provider.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { findInventoryItemsByUserId } from "../repositories/inventory.repository.js";
import {
  createRecipeJobRecord,
  findRecipeJobById,
  findRecipeJobByIdAndUserId,
  updateRecipeJobById
} from "../repositories/recipe-job.repository.js";
import { createRecipeRecord, findRecipeByIdAndUserId } from "../repositories/recipe.repository.js";
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
  const inventoryItems = await findInventoryItemsByUserId(userId);

  const job = await createRecipeJobRecord({
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
  const job = await findRecipeJobByIdAndUserId(jobId, userId);

  if (!job) {
    throw createError(404, "RECIPE_JOB_NOT_FOUND", "Recipe job was not found.");
  }

  return toRecipeJobResponse(job);
}

export async function getRecipeById(userId, recipeId) {
  const recipe = await findRecipeByIdAndUserId(recipeId, userId);

  if (!recipe) {
    throw createError(404, "RECIPE_NOT_FOUND", "Recipe was not found.");
  }

  return {
    recipe: toRecipeResponse(recipe)
  };
}

export async function processRecipeJob(jobId) {
  const queuedJob = await findRecipeJobById(jobId);

  if (!queuedJob || queuedJob.status === "completed" || queuedJob.status === "failed") {
    return;
  }

  await updateRecipeJobById(jobId, {
    status: "processing",
    errorMessage: null
  });

  try {
    const generatedRecipe = await generateRecipe({
      prompt: queuedJob.prompt,
      inventoryItems: queuedJob.inventorySnapshot
    });

    const recipe = await createRecipeRecord({
      userId: queuedJob.userId,
      jobId: queuedJob._id,
      prompt: queuedJob.prompt,
      ...generatedRecipe
    });

    await updateRecipeJobById(jobId, {
      status: "completed",
      recipeId: recipe._id,
      completedAt: new Date(),
      errorMessage: null
    });
  } catch (error) {
    await updateRecipeJobById(jobId, {
      status: "failed",
      errorMessage: error.message || "Recipe generation failed."
    });
    logger.error("Recipe job failed", error);
  }
}
