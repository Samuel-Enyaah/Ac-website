import { z } from "zod";
import { createIdempotentBooking } from "../services/bookingRequests.js";
import { flushOperations } from "../services/operationsOutbox.js";

export const bookingSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(200),
    phone: z.string().trim().min(9).max(40),
    email: z.string().trim().email().or(z.literal("")).optional(),
  }),

  serviceType: z.enum([
    "installation",
    "repairs",
    "maintenance",
    "diagnosis",
    "spare-parts",
    "commercial",
  ]),

  acType: z.string().trim().optional(),
  brand: z.string().trim().optional(),

  units: z.coerce.number().int().min(1).default(1),

  description: z.string().trim().min(5).max(4000),

  preferredDate: z.string().trim().min(1),

  preferredTime: z.enum(["", "morning", "afternoon", "evening"]),

  location: z.string().trim().min(2).max(200),

  landmark: z.string().trim().optional(),

  notes: z.string().trim().optional(),
});

export async function createServiceBooking(req, res, next) {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Please check the service booking information.",
          errors: parsed.error.flatten().fieldErrors,
        });
    const receipt = await createIdempotentBooking(
      parsed.data,
      req.get?.("Idempotency-Key"),
    );
    await flushOperations("booking", receipt.id);
    res
      .status(201)
      .json({
        success: true,
        message: "Service booking created successfully.",
        booking: receipt,
      });
  } catch (error) {
    next(error);
  }
}
