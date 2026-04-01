import mongoose from "mongoose";

const consumedIngredientSchema = new mongoose.Schema(
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

const recipeHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    prompt: {
      type: String,
      required: true,
      trim: true
    },
    consumedIngredients: {
      type: [consumedIngredientSchema],
      default: []
    },
    cookedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const RecipeHistory =
  mongoose.models.RecipeHistory || mongoose.model("RecipeHistory", recipeHistorySchema);
