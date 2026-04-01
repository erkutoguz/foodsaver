import { RecipeJob } from "../models/recipe-job.model.js";

export function createRecipeJobRecord(payload) {
  return RecipeJob.create(payload);
}

export function findRecipeJobByIdAndUserId(jobId, userId) {
  return RecipeJob.findOne({
    _id: jobId,
    userId
  });
}

export function findRecipeJobById(jobId) {
  return RecipeJob.findById(jobId);
}

export function updateRecipeJobById(jobId, payload) {
  return RecipeJob.findByIdAndUpdate(jobId, payload, {
    new: true,
    runValidators: true
  });
}
