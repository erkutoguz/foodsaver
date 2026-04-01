import { z } from "zod";

const unitSchema = z.enum(["piece", "gram", "ml"]);

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1, "Field cannot be empty.")
  .optional();

const optionalCategorySchema = z
  .string()
  .trim()
  .min(1, "Category cannot be empty.")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalExpiresAtSchema = z
  .union([z.string(), z.date()])
  .pipe(z.coerce.date({ message: "A valid expiration date is required." }))
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

const confirmDetectedItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required."),
  quantity: z.coerce.number().positive("Quantity must be greater than 0."),
  unit: unitSchema,
  category: optionalCategorySchema,
  expiresAt: optionalExpiresAtSchema.or(z.literal(null)).optional()
});

export const confirmDetectedItemsSchema = z.object({
  items: z.array(confirmDetectedItemSchema).min(1, "At least one detected item is required.")
});
