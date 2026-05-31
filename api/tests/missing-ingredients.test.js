import { describe, expect, it } from "vitest";
import { computeMissingIngredients } from "../src/lib/missing-ingredients.js";

describe("computeMissingIngredients", () => {
  // --- exact match ---

  it("returns empty array when all recipe ingredients are in pantry", () => {
    const ingredients = [{ name: "chicken" }];
    const inventory = [{ name: "chicken" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("matches after normalizing case and whitespace", () => {
    const ingredients = [{ name: "  Chicken Breast  " }];
    const inventory = [{ name: "CHICKEN BREAST" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("returns missing ingredient when not in pantry", () => {
    const ingredients = [{ name: "pasta" }];
    const inventory = [{ name: "bread" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  // --- curated satisfier map: forward direction ---

  it("bread in pantry satisfies breadcrumbs in recipe", () => {
    const ingredients = [{ name: "breadcrumbs" }];
    const inventory = [{ name: "bread" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("bread in pantry satisfies bread crumbs (with space) in recipe", () => {
    const ingredients = [{ name: "bread crumbs" }];
    const inventory = [{ name: "bread" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("bread in pantry satisfies panko in recipe", () => {
    const ingredients = [{ name: "panko" }];
    const inventory = [{ name: "bread" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("onion in pantry satisfies chopped onion in recipe", () => {
    const ingredients = [{ name: "chopped onion" }];
    const inventory = [{ name: "onion" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("onion in pantry satisfies diced onion in recipe", () => {
    const ingredients = [{ name: "diced onion" }];
    const inventory = [{ name: "onion" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("onion in pantry satisfies sliced onion in recipe", () => {
    const ingredients = [{ name: "sliced onion" }];
    const inventory = [{ name: "onion" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("garlic in pantry satisfies minced garlic in recipe", () => {
    const ingredients = [{ name: "minced garlic" }];
    const inventory = [{ name: "garlic" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("garlic in pantry satisfies chopped garlic in recipe", () => {
    const ingredients = [{ name: "chopped garlic" }];
    const inventory = [{ name: "garlic" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("cheese in pantry satisfies grated cheese in recipe", () => {
    const ingredients = [{ name: "grated cheese" }];
    const inventory = [{ name: "cheese" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("cheese in pantry satisfies shredded cheese in recipe", () => {
    const ingredients = [{ name: "shredded cheese" }];
    const inventory = [{ name: "cheese" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  // --- curated satisfier map: reverse direction blocked ---

  it("breadcrumbs in pantry does NOT satisfy bread in recipe", () => {
    const ingredients = [{ name: "bread" }];
    const inventory = [{ name: "breadcrumbs" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["bread"]);
  });

  it("panko in pantry does NOT satisfy bread in recipe", () => {
    const ingredients = [{ name: "bread" }];
    const inventory = [{ name: "panko" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["bread"]);
  });

  it("chopped onion in pantry does NOT satisfy onion in recipe", () => {
    const ingredients = [{ name: "onion" }];
    const inventory = [{ name: "chopped onion" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["onion"]);
  });

  it("minced garlic in pantry does NOT satisfy garlic in recipe", () => {
    const ingredients = [{ name: "garlic" }];
    const inventory = [{ name: "minced garlic" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["garlic"]);
  });

  // --- normalization: hyphens ---

  it("hyphenated recipe ingredient normalizes and matches satisfier map", () => {
    const ingredients = [{ name: "bread-crumbs" }];
    const inventory = [{ name: "bread" }];
    // "bread-crumbs" → "bread crumbs" → covered by bread satisfier
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  // --- unrelated pantry items ---

  it("unrelated pantry items do not satisfy recipe ingredients", () => {
    const ingredients = [{ name: "pasta" }];
    const inventory = [{ name: "chicken" }, { name: "rice" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  // --- deduplication ---

  it("deduplicates missing ingredients with same normalized name", () => {
    const ingredients = [{ name: "pasta" }, { name: "PASTA" }, { name: "  Pasta  " }];
    const inventory = [];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  it("deduplicates satisfied ingredients without adding them to missing", () => {
    const ingredients = [{ name: "chicken" }, { name: "CHICKEN" }];
    const inventory = [{ name: "chicken" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  // --- order preservation ---

  it("preserves recipe ingredient order for missing items", () => {
    const ingredients = [{ name: "pasta" }, { name: "chicken" }, { name: "olive oil" }];
    const inventory = [{ name: "chicken" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta", "olive oil"]);
  });

  // --- invalid/empty ingredient names ---

  it("skips empty string ingredient names", () => {
    const ingredients = [{ name: "" }, { name: "   " }, { name: "pasta" }];
    const inventory = [];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  it("skips null and structurally invalid ingredients", () => {
    const ingredients = [null, undefined, { name: null }, { name: 42 }, { name: "pasta" }];
    const inventory = [];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  // --- malformed inventory fallback ---

  it("falls back to all valid ingredients when inventory snapshot is null", () => {
    const ingredients = [{ name: "pasta" }, { name: "chicken" }];
    expect(computeMissingIngredients(ingredients, null)).toEqual(["pasta", "chicken"]);
  });

  it("falls back to all valid ingredients when inventory snapshot is a string", () => {
    const ingredients = [{ name: "pasta" }];
    expect(computeMissingIngredients(ingredients, "invalid")).toEqual(["pasta"]);
  });

  it("falls back to all valid ingredients when inventory snapshot is an object", () => {
    const ingredients = [{ name: "pasta" }];
    expect(computeMissingIngredients(ingredients, {})).toEqual(["pasta"]);
  });

  it("deduplicates in fallback mode when snapshot is invalid", () => {
    const ingredients = [{ name: "pasta" }, { name: "PASTA" }];
    expect(computeMissingIngredients(ingredients, null)).toEqual(["pasta"]);
  });

  it("skips invalid entries in fallback mode", () => {
    const ingredients = [{ name: "" }, { name: "pasta" }];
    expect(computeMissingIngredients(ingredients, null)).toEqual(["pasta"]);
  });

  // --- edge cases ---

  it("returns empty array when recipe has no ingredients", () => {
    expect(computeMissingIngredients([], [{ name: "chicken" }])).toEqual([]);
  });

  it("returns empty array when recipeIngredients is null", () => {
    expect(computeMissingIngredients(null, [])).toEqual([]);
  });

  it("returns empty array when recipeIngredients is undefined", () => {
    expect(computeMissingIngredients(undefined, [])).toEqual([]);
  });

  it("handles empty inventory snapshot array", () => {
    const ingredients = [{ name: "pasta" }];
    expect(computeMissingIngredients(ingredients, [])).toEqual(["pasta"]);
  });

  it("handles malformed pantry items gracefully", () => {
    const ingredients = [{ name: "pasta" }];
    const inventory = [null, undefined, { name: null }, { name: "chicken" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  // ─── quantity-aware: same unit ───────────────────────────────────────────────

  it("piece quantity enough: pantry egg 6 piece, recipe egg 2 piece → not missing", () => {
    const ingredients = [{ name: "egg", quantity: 2, unit: "piece" }];
    const inventory = [{ name: "egg", quantity: 6, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("piece quantity insufficient: pantry egg 1 piece, recipe egg 6 piece → missing", () => {
    const ingredients = [{ name: "egg", quantity: 6, unit: "piece" }];
    const inventory = [{ name: "egg", quantity: 1, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["egg"]);
  });

  it("exact quantity match is not missing", () => {
    const ingredients = [{ name: "egg", quantity: 3, unit: "piece" }];
    const inventory = [{ name: "egg", quantity: 3, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("gram quantity enough: pantry chicken 300 gram, recipe chicken 200 gram → not missing", () => {
    const ingredients = [{ name: "chicken", quantity: 200, unit: "gram" }];
    const inventory = [{ name: "chicken", quantity: 300, unit: "gram" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("gram quantity insufficient: pantry chicken 100 gram, recipe chicken 300 gram → missing", () => {
    const ingredients = [{ name: "chicken", quantity: 300, unit: "gram" }];
    const inventory = [{ name: "chicken", quantity: 100, unit: "gram" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["chicken"]);
  });

  it("gram quantity insufficient: pantry chicken 200 gram, recipe chicken 300 gram → missing", () => {
    const ingredients = [{ name: "chicken", quantity: 300, unit: "gram" }];
    const inventory = [{ name: "chicken", quantity: 200, unit: "gram" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["chicken"]);
  });

  it("ml quantity enough: pantry milk 500 ml, recipe milk 200 ml → not missing", () => {
    const ingredients = [{ name: "milk", quantity: 200, unit: "ml" }];
    const inventory = [{ name: "milk", quantity: 500, unit: "ml" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("ml quantity insufficient: pantry milk 100 ml, recipe milk 200 ml → missing", () => {
    const ingredients = [{ name: "milk", quantity: 200, unit: "ml" }];
    const inventory = [{ name: "milk", quantity: 100, unit: "ml" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["milk"]);
  });

  // ─── quantity-aware: unit mismatch ───────────────────────────────────────────

  it("unit mismatch ml vs gram: pantry milk 500 ml, recipe milk 200 gram → missing", () => {
    const ingredients = [{ name: "milk", quantity: 200, unit: "gram" }];
    const inventory = [{ name: "milk", quantity: 500, unit: "ml" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["milk"]);
  });

  it("unit mismatch piece vs gram: pantry tomato 2 piece, recipe tomato 200 gram → missing", () => {
    const ingredients = [{ name: "tomato", quantity: 200, unit: "gram" }];
    const inventory = [{ name: "tomato", quantity: 2, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["tomato"]);
  });

  // ─── quantity-aware: multiple matching pantry items ──────────────────────────

  it("multiple matching items are summed: 100g + 150g satisfies 200g", () => {
    const ingredients = [{ name: "chicken", quantity: 200, unit: "gram" }];
    const inventory = [
      { name: "chicken", quantity: 100, unit: "gram" },
      { name: "chicken", quantity: 150, unit: "gram" }
    ];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("multiple matching items: incompatible unit item ignored, insufficient remainder → missing", () => {
    const ingredients = [{ name: "chicken", quantity: 200, unit: "gram" }];
    const inventory = [
      { name: "chicken", quantity: 100, unit: "gram" },
      { name: "chicken", quantity: 1, unit: "piece" }
    ];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["chicken"]);
  });

  it("multiple matching items: all units match and total is sufficient", () => {
    const ingredients = [{ name: "milk", quantity: 400, unit: "ml" }];
    const inventory = [
      { name: "milk", quantity: 200, unit: "ml" },
      { name: "milk", quantity: 250, unit: "ml" }
    ];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  // ─── quantity-aware: satisfier map with quantity ──────────────────────────────

  it("satisfier map + quantity enough: pantry bread 100 gram, recipe breadcrumbs 50 gram → not missing", () => {
    const ingredients = [{ name: "breadcrumbs", quantity: 50, unit: "gram" }];
    const inventory = [{ name: "bread", quantity: 100, unit: "gram" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("satisfier map + quantity insufficient: pantry bread 20 gram, recipe breadcrumbs 50 gram → missing", () => {
    const ingredients = [{ name: "breadcrumbs", quantity: 50, unit: "gram" }];
    const inventory = [{ name: "bread", quantity: 20, unit: "gram" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["breadcrumbs"]);
  });

  it("satisfier map + pantry 0 piece: pantry bread 0 piece, recipe breadcrumbs 1 piece → missing", () => {
    const ingredients = [{ name: "breadcrumbs", quantity: 1, unit: "piece" }];
    const inventory = [{ name: "bread", quantity: 0, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["breadcrumbs"]);
  });

  it("satisfier map + unit mismatch: pantry bread 5 piece, recipe breadcrumbs 50 gram → missing", () => {
    const ingredients = [{ name: "breadcrumbs", quantity: 50, unit: "gram" }];
    const inventory = [{ name: "bread", quantity: 5, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["breadcrumbs"]);
  });

  // ─── quantity-aware: invalid/missing quantity or unit ────────────────────────

  it("invalid recipe quantity (string): treated as missing", () => {
    const ingredients = [{ name: "pasta", quantity: "two", unit: "piece" }];
    const inventory = [{ name: "pasta", quantity: 5, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  it("invalid recipe quantity (NaN): treated as missing", () => {
    const ingredients = [{ name: "pasta", quantity: NaN, unit: "piece" }];
    const inventory = [{ name: "pasta", quantity: 5, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  it("invalid recipe quantity (negative): treated as missing", () => {
    const ingredients = [{ name: "pasta", quantity: -1, unit: "piece" }];
    const inventory = [{ name: "pasta", quantity: 5, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  it("invalid recipe unit (empty string): treated as missing", () => {
    const ingredients = [{ name: "pasta", quantity: 2, unit: "" }];
    const inventory = [{ name: "pasta", quantity: 5, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  it("quantity present but unit null: treated as missing", () => {
    const ingredients = [{ name: "pasta", quantity: 2, unit: null }];
    const inventory = [{ name: "pasta", quantity: 5, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  it("unit present but quantity null: treated as missing", () => {
    const ingredients = [{ name: "pasta", quantity: null, unit: "piece" }];
    const inventory = [{ name: "pasta", quantity: 5, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["pasta"]);
  });

  it("invalid pantry quantity: that item is ignored, ingredient becomes missing", () => {
    const ingredients = [{ name: "chicken", quantity: 1, unit: "piece" }];
    const inventory = [{ name: "chicken", quantity: "heavy", unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["chicken"]);
  });

  it("pantry item with zero quantity does not satisfy a nonzero recipe requirement", () => {
    const ingredients = [{ name: "egg", quantity: 1, unit: "piece" }];
    const inventory = [{ name: "egg", quantity: 0, unit: "piece" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["egg"]);
  });

  it("recipe quantity 0 is always satisfied regardless of pantry", () => {
    const ingredients = [{ name: "salt", quantity: 0, unit: "gram" }];
    const inventory = [];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  // ─── case/whitespace normalization still works with quantity ─────────────────

  it("case and whitespace normalization applies to ingredient names with qty/unit", () => {
    const ingredients = [{ name: "  Chicken Breast  ", quantity: 100, unit: "gram" }];
    const inventory = [{ name: "CHICKEN BREAST", quantity: 200, unit: "gram" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  it("unit normalization: uppercase unit in pantry matches lowercase in recipe", () => {
    const ingredients = [{ name: "milk", quantity: 100, unit: "ml" }];
    const inventory = [{ name: "milk", quantity: 200, unit: "ML" }];
    expect(computeMissingIngredients(ingredients, inventory)).toEqual([]);
  });

  // ─── mixed presence-only and quantity-aware in same call ─────────────────────

  it("mixed: ingredient without qty/unit uses presence-only, ingredient with qty/unit uses quantity check", () => {
    const ingredients = [
      { name: "salt" },                                   // presence-only
      { name: "chicken", quantity: 200, unit: "gram" }    // quantity-aware
    ];
    const inventory = [
      { name: "salt", quantity: 10, unit: "gram" },
      { name: "chicken", quantity: 100, unit: "gram" }    // only 100g, need 200g
    ];
    // salt: presence-only → in pantry → not missing
    // chicken: quantity-aware → 100 < 200 → missing
    expect(computeMissingIngredients(ingredients, inventory)).toEqual(["chicken"]);
  });
});
