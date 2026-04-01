import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1, "Field cannot be empty.")
  .optional();

export const analyzeImageSchema = z
  .object({
    imageUrl: z.string().trim().url("A valid image URL is required.").optional(),
    fileName: optionalTrimmedString,
    imageBase64: z.string().trim().min(20, "Image base64 content is too short.").optional(),
    context: optionalTrimmedString
  })
  .refine((value) => value.imageUrl || value.fileName || value.imageBase64, {
    message: "imageUrl, fileName, or imageBase64 is required."
  });
