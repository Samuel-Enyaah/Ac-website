import { z } from "zod";
const number = z.union([z.number(), z.string().trim().min(1, "A number is required.")]).pipe(z.coerce.number().finite().min(0, "Must be 0 or greater."));
const oldPrice = z.preprocess((value) => value === "" ? null : value, number.nullable().optional());
const boolean = z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]);
const fields = z.object({
  name: z.string().trim().min(2, "Product name must contain at least 2 characters."),
  category: z.enum(["Air Conditioners", "Spare Parts", "Accessories"]),
  description: z.string().trim().min(1, "Full description is required."),
  brand: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  price: number,
  oldPrice,
  stock: number.pipe(z.number().int("Opening stock must be a whole number.")).optional().default(0),
  featured: boolean.optional(),
  active: boolean.optional(),
  imageUrl: z.union([z.literal(""), z.url().refine((v) => /^https?:\/\//.test(v), "Use an HTTP or HTTPS image URL.")]).optional(),
  specifications: z.array(z.string().trim()).optional(),
});
const sensiblePrice = (data) => data.oldPrice == null || data.price === undefined || data.oldPrice > data.price;
const priceError = { path: ["oldPrice"], message: "Old price must be greater than the current price." };
export const createProductSchema = fields.refine(sensiblePrice, priceError);
export const updateProductSchema = fields.omit({ stock: true }).partial().refine(sensiblePrice, priceError);
