function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,\-_/\\|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function isSatisfied(normalizedRecipeName, pantryNormalizedSet) {
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

/**
 * Compute which recipe ingredients are not covered by the inventory snapshot.
 * Result is derived solely from recipeIngredients and inventorySnapshot —
 * never from provider output.
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

  const pantryNormalizedSet = new Set(
    inventorySnapshot
      .filter((item) => item != null && typeof item.name === "string" && item.name.trim() !== "")
      .map((item) => normalizeName(item.name))
  );

  const missing = [];
  const seen = new Set();

  for (const ingredient of validIngredients) {
    const normalized = normalizeName(ingredient.name);

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);

    if (!isSatisfied(normalized, pantryNormalizedSet)) {
      missing.push(ingredient.name.trim());
    }
  }

  return missing;
}
