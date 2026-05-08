function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,\-_/\\|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// kcal per 100g (or 100ml for liquid-like entries)
const KCAL_PER_100G = new Map(
  Object.entries({
    chicken: 165,
    "chicken breast": 165,
    beef: 250,
    "ground beef": 250,
    egg: 155,
    potato: 77,
    tomato: 18,
    onion: 40,
    garlic: 149,
    bread: 265,
    breadcrumbs: 395,
    rice: 130,
    pasta: 131,
    cheese: 402,
    milk: 42,
    yogurt: 59,
    "olive oil": 884,
    oil: 884,
    butter: 717
  }).map(([k, v]) => [normalizeName(k), v])
);

// ml is treated as gram-equivalent for these liquid-like ingredients
const ML_ALLOWED = new Set(
  ["milk", "yogurt", "oil", "olive oil"].map(normalizeName)
);

// kcal per single piece
const KCAL_PER_PIECE = new Map(
  Object.entries({
    egg: 78,
    potato: 160,
    tomato: 22,
    onion: 44,
    garlic: 4,
    bread: 80
  }).map(([k, v]) => [normalizeName(k), v])
);

function isValidPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Estimate total calories for a recipe from its ingredients list.
 * Returns a rounded integer. Returns 0 for fully unknown or malformed input.
 */
export function computeEstimatedCalories(recipeIngredients) {
  if (!Array.isArray(recipeIngredients)) {
    return 0;
  }

  let total = 0;

  for (const ingredient of recipeIngredients) {
    if (ingredient == null || typeof ingredient.name !== "string" || ingredient.name.trim() === "") {
      continue;
    }

    if (!isValidPositiveNumber(ingredient.quantity)) {
      continue;
    }

    if (typeof ingredient.unit !== "string" || ingredient.unit.trim() === "") {
      continue;
    }

    const name = normalizeName(ingredient.name);
    const unit = ingredient.unit.trim().toLowerCase();
    const qty = ingredient.quantity;

    if (unit === "gram") {
      const kcalPer100 = KCAL_PER_100G.get(name);
      if (kcalPer100 != null) {
        total += (qty * kcalPer100) / 100;
      }
    } else if (unit === "ml") {
      if (ML_ALLOWED.has(name)) {
        const kcalPer100 = KCAL_PER_100G.get(name);
        if (kcalPer100 != null) {
          total += (qty * kcalPer100) / 100;
        }
      }
      // unknown ml ingredient: skip silently
    } else if (unit === "piece") {
      const kcalPerPiece = KCAL_PER_PIECE.get(name);
      if (kcalPerPiece != null) {
        total += qty * kcalPerPiece;
      }
      // unknown piece ingredient: skip silently
    }
    // unknown unit: skip silently
  }

  return Math.round(total);
}
