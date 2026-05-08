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
});
