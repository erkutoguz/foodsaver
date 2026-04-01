import {
  deleteInventoryItemById,
  findInventoryItemsByUserId,
  updateInventoryItemQuantityById
} from "../repositories/inventory.repository.js";
import { createRecipeHistoryRecord, findHistoryByUserId } from "../repositories/history.repository.js";
import { findRecipeByIdAndUserId } from "../repositories/recipe.repository.js";
import { createError } from "../utils/http-error.js";

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function toHistoryResponse(entry) {
  return {
    id: entry._id.toString(),
    recipeId: entry.recipeId.toString(),
    title: entry.title,
    prompt: entry.prompt,
    consumedIngredients: entry.consumedIngredients,
    cookedAt: entry.cookedAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  };
}

function buildMissingIngredientLabel(ingredient) {
  return `${ingredient.name} (${ingredient.quantity} ${ingredient.unit})`;
}

async function applyInventoryConsumption(userId, ingredients) {
  const inventoryItems = await findInventoryItemsByUserId(userId, { createdAt: 1 });

  const workingItems = inventoryItems.map((item) => ({
    item,
    remainingQuantity: item.quantity
  }));

  const missingIngredients = [];

  for (const ingredient of ingredients) {
    const matchingItems = workingItems.filter(
      (entry) =>
        normalizeName(entry.item.name) === normalizeName(ingredient.name) &&
        entry.item.unit === ingredient.unit &&
        entry.remainingQuantity > 0
    );

    const availableQuantity = matchingItems.reduce((total, entry) => total + entry.remainingQuantity, 0);

    if (availableQuantity < ingredient.quantity) {
      missingIngredients.push(buildMissingIngredientLabel(ingredient));
      continue;
    }

    let quantityToConsume = ingredient.quantity;

    for (const entry of matchingItems) {
      if (quantityToConsume <= 0) {
        break;
      }

      const usedQuantity = Math.min(entry.remainingQuantity, quantityToConsume);
      entry.remainingQuantity -= usedQuantity;
      quantityToConsume -= usedQuantity;
    }
  }

  if (missingIngredients.length > 0) {
    throw createError(
      409,
      "INSUFFICIENT_INVENTORY",
      `Not enough inventory for: ${missingIngredients.join(", ")}.`
    );
  }

  await Promise.all(
    workingItems.map(async (entry) => {
      if (entry.remainingQuantity === entry.item.quantity) {
        return;
      }

      if (entry.remainingQuantity <= 0) {
        await deleteInventoryItemById(entry.item._id);
        return;
      }

      await updateInventoryItemQuantityById(entry.item._id, entry.remainingQuantity);
    })
  );
}

export async function cookRecipe(userId, recipeId) {
  const recipe = await findRecipeByIdAndUserId(recipeId, userId);

  if (!recipe) {
    throw createError(404, "RECIPE_NOT_FOUND", "Recipe was not found.");
  }

  await applyInventoryConsumption(userId, recipe.ingredients);

  const historyEntry = await createRecipeHistoryRecord({
    userId,
    recipeId: recipe._id,
    title: recipe.title,
    prompt: recipe.prompt,
    consumedIngredients: recipe.ingredients,
    cookedAt: new Date()
  });

  return {
    status: "cooked",
    history: toHistoryResponse(historyEntry)
  };
}

export async function listHistory(userId) {
  const historyEntries = await findHistoryByUserId(userId);

  return {
    history: historyEntries.map(toHistoryResponse)
  };
}
