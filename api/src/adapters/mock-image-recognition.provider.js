const MOCK_IMAGE_CATALOG = [
  {
    keywords: ["milk", "carton", "dairy"],
    name: "Milk",
    quantity: 1,
    unit: "piece",
    category: "dairy",
    confidence: 0.96
  },
  {
    keywords: ["egg", "eggs"],
    name: "Egg",
    quantity: 6,
    unit: "piece",
    category: "protein",
    confidence: 0.94
  },
  {
    keywords: ["tomato", "tomatoes"],
    name: "Tomato",
    quantity: 4,
    unit: "piece",
    category: "vegetable",
    confidence: 0.92
  },
  {
    keywords: ["banana", "bananas"],
    name: "Banana",
    quantity: 5,
    unit: "piece",
    category: "fruit",
    confidence: 0.91
  },
  {
    keywords: ["apple", "apples"],
    name: "Apple",
    quantity: 4,
    unit: "piece",
    category: "fruit",
    confidence: 0.9
  },
  {
    keywords: ["cheese"],
    name: "Cheese",
    quantity: 1,
    unit: "piece",
    category: "dairy",
    confidence: 0.89
  },
  {
    keywords: ["chicken"],
    name: "Chicken",
    quantity: 2,
    unit: "piece",
    category: "protein",
    confidence: 0.88
  },
  {
    keywords: ["rice"],
    name: "Rice",
    quantity: 500,
    unit: "gram",
    category: "grain",
    confidence: 0.87
  },
  {
    keywords: ["bread", "toast"],
    name: "Bread",
    quantity: 1,
    unit: "piece",
    category: "bakery",
    confidence: 0.86
  },
  {
    keywords: ["onion", "onions"],
    name: "Onion",
    quantity: 2,
    unit: "piece",
    category: "vegetable",
    confidence: 0.85
  }
];

const FALLBACK_ITEMS = [
  {
    name: "Tomato",
    quantity: 3,
    unit: "piece",
    category: "vegetable",
    confidence: 0.72
  },
  {
    name: "Egg",
    quantity: 6,
    unit: "piece",
    category: "protein",
    confidence: 0.69
  }
];

function pickSourceType({ imageUrl, fileName, imageBase64 }) {
  if (imageUrl) {
    return "imageUrl";
  }

  if (fileName) {
    return "fileName";
  }

  if (imageBase64) {
    return "imageBase64";
  }

  return "unknown";
}

function buildRecognitionText({ imageUrl, fileName, context }) {
  return [imageUrl, fileName, context].filter(Boolean).join(" ").toLowerCase();
}

function pickDetectedItems(sourceText) {
  const matchedItems = MOCK_IMAGE_CATALOG.filter((item) =>
    item.keywords.some((keyword) => sourceText.includes(keyword))
  ).map(({ keywords: _keywords, ...item }) => item);

  if (matchedItems.length > 0) {
    return matchedItems.slice(0, 5);
  }

  return FALLBACK_ITEMS;
}

export async function analyzeMockImage(input) {
  const sourceType = pickSourceType(input);
  const sourceText = buildRecognitionText(input);
  const detectedItems = pickDetectedItems(sourceText);

  return {
    provider: "mock",
    sourceType,
    summary: `Detected ${detectedItems.length} possible item${detectedItems.length === 1 ? "" : "s"} from mock image analysis.`,
    detectedItems
  };
}
