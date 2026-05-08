import { describe, expect, it } from "vitest";
import { computeEstimatedCalories } from "../src/lib/recipe-calories.js";

// ---------------------------------------------------------------------------
// gram
// ---------------------------------------------------------------------------
describe("gram calculation", () => {
  it("chicken 200 gram → 330", () => {
    expect(computeEstimatedCalories([{ name: "chicken", quantity: 200, unit: "gram" }])).toBe(330);
  });

  it("potato 300 gram → 231", () => {
    expect(computeEstimatedCalories([{ name: "potato", quantity: 300, unit: "gram" }])).toBe(231);
  });

  it("chicken breast 200 gram → 330", () => {
    expect(computeEstimatedCalories([{ name: "chicken breast", quantity: 200, unit: "gram" }])).toBe(330);
  });

  it("olive oil 50 gram → 442", () => {
    expect(computeEstimatedCalories([{ name: "olive oil", quantity: 50, unit: "gram" }])).toBe(442);
  });
});

// ---------------------------------------------------------------------------
// piece
// ---------------------------------------------------------------------------
describe("piece calculation", () => {
  it("egg 2 piece → 156", () => {
    expect(computeEstimatedCalories([{ name: "egg", quantity: 2, unit: "piece" }])).toBe(156);
  });

  it("tomato 2 piece → 44", () => {
    expect(computeEstimatedCalories([{ name: "tomato", quantity: 2, unit: "piece" }])).toBe(44);
  });

  it("onion 1 piece → 44", () => {
    expect(computeEstimatedCalories([{ name: "onion", quantity: 1, unit: "piece" }])).toBe(44);
  });

  it("garlic 3 piece → 12", () => {
    expect(computeEstimatedCalories([{ name: "garlic", quantity: 3, unit: "piece" }])).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// ml — liquid-like
// ---------------------------------------------------------------------------
describe("ml liquid calculation", () => {
  it("milk 200 ml → 84", () => {
    expect(computeEstimatedCalories([{ name: "milk", quantity: 200, unit: "ml" }])).toBe(84);
  });

  it("olive oil 10 ml → 88", () => {
    expect(computeEstimatedCalories([{ name: "olive oil", quantity: 10, unit: "ml" }])).toBe(88);
  });

  it("yogurt 100 ml → 59", () => {
    expect(computeEstimatedCalories([{ name: "yogurt", quantity: 100, unit: "ml" }])).toBe(59);
  });
});

// ---------------------------------------------------------------------------
// ml — unknown (skipped, not crashed)
// ---------------------------------------------------------------------------
describe("ml unknown ingredient", () => {
  it("unknown ingredient in ml is skipped, returns 0", () => {
    expect(computeEstimatedCalories([{ name: "soy sauce", quantity: 15, unit: "ml" }])).toBe(0);
  });

  it("known gram ingredient in ml is skipped (not in ml allowed list)", () => {
    expect(computeEstimatedCalories([{ name: "chicken", quantity: 200, unit: "ml" }])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// unknown ingredients
// ---------------------------------------------------------------------------
describe("unknown ingredients", () => {
  it("single unknown ingredient returns 0", () => {
    expect(computeEstimatedCalories([{ name: "unicorn powder", quantity: 100, unit: "gram" }])).toBe(0);
  });

  it("all unknown ingredients returns 0", () => {
    expect(
      computeEstimatedCalories([
        { name: "mystery spice", quantity: 5, unit: "gram" },
        { name: "dragon fruit", quantity: 1, unit: "piece" }
      ])
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// mixed known + unknown
// ---------------------------------------------------------------------------
describe("mixed known + unknown", () => {
  it("known ingredients counted, unknown skipped", () => {
    const result = computeEstimatedCalories([
      { name: "chicken", quantity: 200, unit: "gram" }, // 330
      { name: "mystery spice", quantity: 5, unit: "gram" }, // 0
      { name: "egg", quantity: 1, unit: "piece" } // 78
    ]);
    expect(result).toBe(408);
  });
});

// ---------------------------------------------------------------------------
// name normalization
// ---------------------------------------------------------------------------
describe("name normalization", () => {
  it("uppercase name matches", () => {
    expect(computeEstimatedCalories([{ name: "CHICKEN", quantity: 200, unit: "gram" }])).toBe(330);
  });

  it("leading/trailing whitespace is trimmed", () => {
    expect(computeEstimatedCalories([{ name: "  chicken  ", quantity: 200, unit: "gram" }])).toBe(330);
  });

  it("extra internal whitespace is collapsed", () => {
    expect(computeEstimatedCalories([{ name: "chicken  breast", quantity: 200, unit: "gram" }])).toBe(330);
  });

  it("punctuation in name is removed", () => {
    expect(computeEstimatedCalories([{ name: "olive-oil", quantity: 10, unit: "ml" }])).toBe(88);
  });
});

// ---------------------------------------------------------------------------
// malformed input
// ---------------------------------------------------------------------------
describe("malformed input", () => {
  it("non-array input returns 0", () => {
    expect(computeEstimatedCalories(null)).toBe(0);
    expect(computeEstimatedCalories(undefined)).toBe(0);
    expect(computeEstimatedCalories("chicken")).toBe(0);
    expect(computeEstimatedCalories(42)).toBe(0);
  });

  it("empty array returns 0", () => {
    expect(computeEstimatedCalories([])).toBe(0);
  });

  it("null ingredient entry is skipped", () => {
    expect(
      computeEstimatedCalories([
        null,
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });

  it("missing name is skipped", () => {
    expect(
      computeEstimatedCalories([
        { quantity: 100, unit: "gram" },
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });

  it("empty name string is skipped", () => {
    expect(
      computeEstimatedCalories([
        { name: "   ", quantity: 100, unit: "gram" },
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });

  it("invalid quantity (string) is skipped", () => {
    expect(
      computeEstimatedCalories([
        { name: "chicken", quantity: "200", unit: "gram" },
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });

  it("NaN quantity is skipped", () => {
    expect(
      computeEstimatedCalories([
        { name: "chicken", quantity: NaN, unit: "gram" },
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });

  it("negative quantity is skipped", () => {
    expect(
      computeEstimatedCalories([
        { name: "chicken", quantity: -100, unit: "gram" },
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });

  it("zero quantity is skipped", () => {
    expect(
      computeEstimatedCalories([
        { name: "chicken", quantity: 0, unit: "gram" },
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });

  it("missing unit is skipped", () => {
    expect(
      computeEstimatedCalories([
        { name: "chicken", quantity: 200 },
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });

  it("empty unit string is skipped", () => {
    expect(
      computeEstimatedCalories([
        { name: "chicken", quantity: 200, unit: "   " },
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });

  it("unknown unit is skipped", () => {
    expect(
      computeEstimatedCalories([
        { name: "chicken", quantity: 200, unit: "cup" },
        { name: "egg", quantity: 1, unit: "piece" }
      ])
    ).toBe(78);
  });
});

// ---------------------------------------------------------------------------
// rounding
// ---------------------------------------------------------------------------
describe("rounding", () => {
  it("result is always an integer", () => {
    const result = computeEstimatedCalories([{ name: "olive oil", quantity: 10, unit: "ml" }]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("fractional calories are rounded to nearest integer", () => {
    // olive oil 10ml: 10 * 884 / 100 = 88.4 → 88
    expect(computeEstimatedCalories([{ name: "olive oil", quantity: 10, unit: "ml" }])).toBe(88);
  });

  it("fractional calories round up at 0.5", () => {
    // tomato 300 gram: 300 * 18 / 100 = 54.0 → 54
    // rice 1 gram: 1 * 130 / 100 = 1.3 → rounds as part of total
    const result = computeEstimatedCalories([
      { name: "tomato", quantity: 300, unit: "gram" }, // 54
      { name: "rice", quantity: 1, unit: "gram" } // 1.3
    ]);
    expect(result).toBe(55); // Math.round(55.3)
  });
});
