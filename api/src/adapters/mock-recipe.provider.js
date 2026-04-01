function toTitleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function buildTitle(prompt, inventoryItems) {
  const cleanedPrompt = String(prompt || "").trim();

  if (cleanedPrompt) {
    return `Mock ${toTitleCase(cleanedPrompt)} Recipe`;
  }

  const firstIngredient = inventoryItems[0]?.name;

  if (firstIngredient) {
    return `${toTitleCase(firstIngredient)} Quick Bowl`;
  }

  return "Mock Pantry Recipe";
}

function buildIngredients(inventoryItems) {
  const selectedItems = inventoryItems.slice(0, 4).map((item) => ({
    name: item.name,
    quantity: Math.max(1, Math.min(item.quantity, item.unit === "gram" || item.unit === "ml" ? 200 : item.quantity)),
    unit: item.unit
  }));

  if (selectedItems.length > 0) {
    return selectedItems;
  }

  return [
    {
      name: "pasta",
      quantity: 200,
      unit: "gram"
    },
    {
      name: "olive oil",
      quantity: 1,
      unit: "piece"
    }
  ];
}

export async function generateMockRecipe({ prompt, inventoryItems }) {
  const ingredients = buildIngredients(inventoryItems);
  const ingredientNames = ingredients.map((item) => item.name);
  const mainIngredient = ingredientNames[0] || "ingredients";

  return {
    title: buildTitle(prompt, inventoryItems),
    ingredients,
    steps: [
      `Prepare the ingredients for "${prompt}".`,
      `Cook ${mainIngredient} gently and combine it with the rest of the available ingredients.`,
      "Season the dish, serve warm, and enjoy your mock AI recipe."
    ],
    estimatedTimeMinutes: 15 + ingredients.length * 5,
    calories: 180 + ingredients.length * 120,
    missingIngredients: inventoryItems.length >= 2 ? [] : ["salt", "black pepper"],
    provider: "mock"
  };
}
