import mongoose from "mongoose";

const recipeIngredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

const recipeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipeJob",
      required: true,
      index: true
    },
    prompt: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    ingredients: {
      type: [recipeIngredientSchema],
      default: []
    },
    steps: {
      type: [String],
      default: []
    },
    estimatedTimeMinutes: {
      type: Number,
      required: true,
      min: 1
    },
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    missingIngredients: {
      type: [String],
      default: []
    },
    provider: {
      type: String,
      required: true,
      default: "mock"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Recipe = mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);
