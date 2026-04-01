import mongoose from "mongoose";

const inventorySnapshotSchema = new mongoose.Schema(
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
    },
    category: {
      type: String,
      trim: true,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: false
  }
);

const recipeJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    prompt: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true
    },
    inventorySnapshot: {
      type: [inventorySnapshotSchema],
      default: []
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const RecipeJob = mongoose.models.RecipeJob || mongoose.model("RecipeJob", recipeJobSchema);
