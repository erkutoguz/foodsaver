function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,\-_/\\|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUnit(unit) {
  return unit.trim().toLowerCase();
}

function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// One-way map: pantry key → set of recipe names it covers.
// Pre-normalized at module load so comparison is always apples-to-apples.
const SATISFIER_MAP = new Map(
  Object.entries({
    bread: ["breadcrumbs", "bread crumbs", "panko"],
    onion: ["chopped onion", "diced onion", "sliced onion"],
    garlic: ["minced garlic", "chopped garlic"],
    cheese: ["grated cheese", "shredded cheese"]
  }).map(([key, values]) => [normalizeName(key), new Set(values.map(normalizeName))])
);

// Presence-only name check (used as fallback when ingredient has no quantity/unit).
function isNameSatisfied(normalizedRecipeName, pantryNormalizedSet) {
  if (pantryNormalizedSet.has(normalizedRecipeName)) {
    return true;
  }

  for (const [pantryKey, satisfiedNames] of SATISFIER_MAP) {
    if (pantryNormalizedSet.has(pantryKey) && satisfiedNames.has(normalizedRecipeName)) {
      return true;
    }
  }

  return false;
}

// Returns all pantry items whose normalized name covers the recipe ingredient,
// using exact match first then the one-way satisfier map.
function findMatchingPantryItems(normalizedRecipeName, pantryItems) {
  return pantryItems.filter((item) => {
    if (item.normalizedName === normalizedRecipeName) return true;
    const satisfiedNames = SATISFIER_MAP.get(item.normalizedName);
    return satisfiedNames != null && satisfiedNames.has(normalizedRecipeName);
  });
}

// Quantity-aware check: sums matching pantry quantities for the same unit.
// Items with a different unit are ignored — no cross-unit conversion.
function isQuantitySatisfied(normalizedRecipeName, recipeQty, normalizedRecipeUnit, pantryItems) {
  const matches = findMatchingPantryItems(normalizedRecipeName, pantryItems);

  const totalAvailable = matches
    .filter((item) => item.normalizedUnit === normalizedRecipeUnit)
    .reduce((sum, item) => sum + item.quantity, 0);

  return totalAvailable >= recipeQty;
}

/**
 * Compute which recipe ingredients are not covered by the inventory snapshot.
 * Result is derived solely from recipeIngredients and inventorySnapshot —
 * never from provider output.
 *
 * Quantity-aware rules (when ingredient has both quantity and unit):
 *   - same-unit pantry quantities are summed across multiple matching items
 *   - pantry items with a different unit are ignored (no conversion)
 *   - if total available < required, ingredient is missing
 *
 * Presence-only fallback (when ingredient has neither quantity nor unit):
 *   - original name-match + satisfier-map behavior is used
 *
 * Invalid quantity or unit (provided but not a valid value):
 *   - ingredient is treated as missing
 */
export function computeMissingIngredients(recipeIngredients, inventorySnapshot) {
  const validIngredients = Array.isArray(recipeIngredients)
    ? recipeIngredients.filter(
        (ing) => ing != null && typeof ing.name === "string" && ing.name.trim() !== ""
      )
    : [];

  // Fallback: malformed snapshot → every valid recipe ingredient is missing.
  if (!Array.isArray(inventorySnapshot)) {
    const seen = new Set();
    return validIngredients
      .filter((ing) => {
        const n = normalizeName(ing.name);
        if (seen.has(n)) return false;
        seen.add(n);
        return true;
      })
      .map((ing) => ing.name.trim());
  }

  // Build both lookup structures in one pass over the inventory.
  // pantryNormalizedSet — used for presence-only checks.
  // pantryItems         — used for quantity-aware checks; only items with valid qty+unit.
  const pantryNormalizedSet = new Set();
  const pantryItems = [];

  for (const item of inventorySnapshot) {
    if (item == null || typeof item.name !== "string" || item.name.trim() === "") {
      continue;
    }

    const normalizedName = normalizeName(item.name);
    pantryNormalizedSet.add(normalizedName);

    if (
      isValidNumber(item.quantity) &&
      typeof item.unit === "string" &&
      item.unit.trim() !== ""
    ) {
      pantryItems.push({
        normalizedName,
        quantity: item.quantity,
        normalizedUnit: normalizeUnit(item.unit)
      });
    }
  }

  const missing = [];
  const seen = new Set();

  for (const ingredient of validIngredients) {
    const normalized = normalizeName(ingredient.name);

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);

    const qtyPresent = ingredient.quantity != null;
    const unitPresent = ingredient.unit != null;

    let satisfied;

    if (!qtyPresent && !unitPresent) {
      // No quantity or unit provided: fall back to presence-only matching.
      // This preserves backward-compatible behavior for callers that omit qty/unit.
      satisfied = isNameSatisfied(normalized, pantryNormalizedSet);
    } else if (
      isValidNumber(ingredient.quantity) &&
      typeof ingredient.unit === "string" &&
      ingredient.unit.trim() !== ""
    ) {
      // Both quantity and unit are present and valid: full quantity-aware check.
      satisfied = isQuantitySatisfied(
        normalized,
        ingredient.quantity,
        normalizeUnit(ingredient.unit),
        pantryItems
      );
    } else {
      // Quantity or unit is provided but invalid: treat as missing.
      satisfied = false;
    }

    if (!satisfied) {
      missing.push(ingredient.name.trim());
    }
  }

  return missing;
}
