import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
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
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

favoriteSchema.index(
  {
    userId: 1,
    recipeId: 1
  },
  {
    unique: true
  }
);

export const Favorite = mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);
