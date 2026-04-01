import { z } from "zod";

const unitSchema = z.enum(["piece", "gram", "ml"]);
const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "A valid item id is required.");

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

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required."),
  quantity: z.coerce.number().positive("Quantity must be greater than 0."),
  unit: unitSchema,
  category: optionalCategorySchema,
  expiresAt: optionalExpiresAtSchema
});

export const updateInventoryItemSchema = z
  .object({
    name: z.string().trim().min(1, "Item name is required.").optional(),
    quantity: z.coerce.number().positive("Quantity must be greater than 0.").optional(),
    unit: unitSchema.optional(),
    category: optionalCategorySchema,
    expiresAt: optionalExpiresAtSchema.or(z.literal(null)).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required."
  });

export const inventoryItemParamsSchema = z.object({
  id: objectIdSchema
});
