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

const SATISFIER_MAP = new Map(
  Object.entries({
    bread: ["breadcrumbs", "bread crumbs", "panko"],
    onion: ["chopped onion", "diced onion", "sliced onion"],
    garlic: ["minced garlic", "chopped garlic"],
    cheese: ["grated cheese", "shredded cheese"]
  }).map(([key, values]) => [normalizeName(key), new Set(values.map(normalizeName))])
);

function isIngredientCoveredByPantryName(ingredientName, pantryName) {
  const normalizedIngredientName = normalizeName(ingredientName);
  const normalizedPantryName = normalizeName(pantryName);

  if (normalizedIngredientName === normalizedPantryName) {
    return true;
  }

  const satisfiedNames = SATISFIER_MAP.get(normalizedPantryName);
  return satisfiedNames ? satisfiedNames.has(normalizedIngredientName) : false;
}

function toHistoryResponse(entry) {
  const recipe = entry.recipeId?._id ? entry.recipeId : null;
  return {
    id: entry._id.toString(),
    recipeId: recipe ? recipe._id.toString() : entry.recipeId.toString(),
    title: entry.title,
    prompt: entry.prompt,
    consumedIngredients: entry.consumedIngredients,
    cookedAt: entry.cookedAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    ingredients: recipe?.ingredients ?? [],
    steps: recipe?.steps ?? [],
    estimatedTimeMinutes: recipe?.estimatedTimeMinutes ?? null,
    calories: recipe?.calories ?? null,
    missingIngredients: recipe?.missingIngredients ?? []
  };
}

function buildIngredientKey(name, unit) {
  return `${normalizeName(name)}::${String(unit || "").trim().toLowerCase()}`;
}

function findBestMatchingInventoryItem(ingredient, inventoryItems) {
  const sameNameItems = inventoryItems.filter((item) => {
    return isIngredientCoveredByPantryName(ingredient.name, item.name) && item.quantity > 0;
  });

  const sameUnitItems = sameNameItems
    .filter((item) => item.unit === ingredient.unit)
    .sort((first, second) => second.quantity - first.quantity);

  if (sameUnitItems.length > 0) {
    return {
      pantryItem: sameUnitItems[0],
      canConsume: true,
      reason: null
    };
  }

  if (sameNameItems.length > 0) {
    return {
      pantryItem: sameNameItems[0],
      canConsume: false,
      reason: "Unit mismatch"
    };
  }

  return {
    pantryItem: null,
    canConsume: false,
    reason: "No matching pantry item"
  };
}

function toCookPreviewItem(ingredient, inventoryItems) {
  const match = findBestMatchingInventoryItem(ingredient, inventoryItems);
  const availableQuantity = match.canConsume ? match.pantryItem.quantity : 0;
  const defaultUseQuantity = match.canConsume
    ? Math.min(ingredient.quantity, match.pantryItem.quantity)
    : 0;

  return {
    ingredientName: ingredient.name,
    requiredQuantity: ingredient.quantity,
    requiredUnit: ingredient.unit,
    pantryItemId: match.pantryItem ? match.pantryItem._id.toString() : null,
    pantryItemName: match.pantryItem ? match.pantryItem.name : null,
    availableQuantity,
    availableUnit: match.pantryItem ? match.pantryItem.unit : null,
    defaultUseQuantity,
    canConsume: match.canConsume,
    reason: match.reason
  };
}

async function applyInventoryConsumptionFromPayload(userId, recipe, consumedIngredients) {
  const inventoryItems = await findInventoryItemsByUserId(userId, { createdAt: 1 });
  const inventoryById = new Map(
    inventoryItems.map((item) => [item._id.toString(), item])
  );
  const recipeIngredientsByKey = new Map(
    recipe.ingredients.map((ingredient) => [buildIngredientKey(ingredient.name, ingredient.unit), ingredient])
  );
  const totalsByPantryItemId = new Map();
  const totalsByIngredientKey = new Map();

  for (const entry of consumedIngredients) {
    const pantryItem = inventoryById.get(entry.pantryItemId);

    if (!pantryItem) {
      throw createError(404, "PANTRY_ITEM_NOT_FOUND", "Pantry item was not found.");
    }

    if (pantryItem.unit !== entry.unit) {
      throw createError(400, "UNIT_MISMATCH", "Consumed ingredient unit does not match the pantry item unit.");
    }

    if (!isIngredientCoveredByPantryName(entry.ingredientName, pantryItem.name)) {
      throw createError(
        400,
        "PANTRY_ITEM_INGREDIENT_MISMATCH",
        "Consumed ingredient does not match the selected pantry item."
      );
    }

    const ingredientKey = buildIngredientKey(entry.ingredientName, entry.unit);
    const recipeIngredient = recipeIngredientsByKey.get(ingredientKey);

    if (!recipeIngredient) {
      throw createError(
        400,
        "RECIPE_INGREDIENT_NOT_FOUND",
        "Consumed ingredient does not belong to this recipe."
      );
    }

    totalsByPantryItemId.set(
      entry.pantryItemId,
      (totalsByPantryItemId.get(entry.pantryItemId) || 0) + entry.quantity
    );

    totalsByIngredientKey.set(
      ingredientKey,
      (totalsByIngredientKey.get(ingredientKey) || 0) + entry.quantity
    );
  }

  for (const [pantryItemId, totalQuantity] of totalsByPantryItemId.entries()) {
    const pantryItem = inventoryById.get(pantryItemId);

    if (totalQuantity > pantryItem.quantity) {
      throw createError(
        400,
        "CONSUMPTION_EXCEEDS_AVAILABLE",
        "Consumed ingredient quantity cannot be greater than available pantry quantity."
      );
    }
  }

  for (const [ingredientKey, totalQuantity] of totalsByIngredientKey.entries()) {
    const recipeIngredient = recipeIngredientsByKey.get(ingredientKey);

    if (totalQuantity > recipeIngredient.quantity) {
      throw createError(
        400,
        "CONSUMPTION_EXCEEDS_REQUIRED",
        "Consumed ingredient quantity cannot be greater than the recipe requirement."
      );
    }
  }

  await Promise.all(
    Array.from(totalsByPantryItemId.entries()).map(async ([pantryItemId, totalQuantity]) => {
      const pantryItem = inventoryById.get(pantryItemId);
      const remainingQuantity = pantryItem.quantity - totalQuantity;

      if (remainingQuantity <= 0) {
        await deleteInventoryItemById(pantryItem._id);
        return;
      }

      await updateInventoryItemQuantityById(pantryItem._id, remainingQuantity);
    })
  );
}

export async function getCookPreview(userId, recipeId) {
  const recipe = await findRecipeByIdAndUserId(recipeId, userId);

  if (!recipe) {
    throw createError(404, "RECIPE_NOT_FOUND", "Recipe was not found.");
  }

  const inventoryItems = await findInventoryItemsByUserId(userId, { createdAt: 1 });

  return {
    recipeId: recipe._id.toString(),
    items: recipe.ingredients.map((ingredient) => toCookPreviewItem(ingredient, inventoryItems))
  };
}

export async function cookRecipe(userId, recipeId, consumedIngredients) {
  const recipe = await findRecipeByIdAndUserId(recipeId, userId);

  if (!recipe) {
    throw createError(404, "RECIPE_NOT_FOUND", "Recipe was not found.");
  }

  await applyInventoryConsumptionFromPayload(userId, recipe, consumedIngredients);

  const historyEntry = await createRecipeHistoryRecord({
    userId,
    recipeId: recipe._id,
    title: recipe.title,
    prompt: recipe.prompt,
    consumedIngredients: consumedIngredients
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        name: item.ingredientName,
        quantity: item.quantity,
        unit: item.unit
      })),
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
