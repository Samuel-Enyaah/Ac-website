import { randomInt } from "crypto";
import { z } from "zod";

import ServiceBooking from "../models/ServiceBooking.js";

const bookingSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2),
    phone: z.string().trim().min(9),
    email: z
      .string()
      .trim()
      .email()
      .or(z.literal(""))
      .optional(),
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

  units: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  description: z
    .string()
    .trim()
    .min(5),

  preferredDate: z
    .string()
    .trim()
    .min(1),

  preferredTime: z.enum([
    "",
    "morning",
    "afternoon",
    "evening",
  ]),

  location: z
    .string()
    .trim()
    .min(2),

  landmark: z
    .string()
    .trim()
    .optional(),

  notes: z
    .string()
    .trim()
    .optional(),
});

async function generateBookingNumber() {
  const year = new Date().getFullYear();

  for (
    let attempt = 0;
    attempt < 10;
    attempt += 1
  ) {
    const number = randomInt(
      100000,
      1000000
    );

    const bookingNumber =
      `RJ-SVC-${year}-${number}`;

    const exists =
      await ServiceBooking.exists({
        bookingNumber,
      });

    if (!exists) {
      return bookingNumber;
    }
  }

  throw new Error(
    "Could not generate a unique service reference."
  );
}

export async function createServiceBooking(
  req,
  res,
  next
) {
  try {
    const parsed =
      bookingSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Please check the service booking information.",
        errors:
          parsed.error.flatten()
            .fieldErrors,
      });
    }

    const data = parsed.data;

    const preferredDate =
      new Date(
        `${data.preferredDate}T00:00:00`
      );

    if (
      Number.isNaN(
        preferredDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid preferred date.",
      });
    }

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    if (preferredDate < today) {
      return res.status(400).json({
        success: false,
        message:
          "Preferred service date cannot be in the past.",
      });
    }

    const bookingNumber =
      await generateBookingNumber();

    const booking =
      await ServiceBooking.create({
        bookingNumber,

        customer: {
          name:
            data.customer.name,

          phone:
            data.customer.phone,

          email:
            data.customer.email ||
            "",
        },

        serviceType:
          data.serviceType,

        acType:
          data.acType || "",

        brand:
          data.brand || "",

        units:
          data.units,

        description:
          data.description,

        preferredDate,

        preferredTime:
          data.preferredTime,

        location:
          data.location,

        landmark:
          data.landmark || "",

        notes:
          data.notes || "",

        images: [],

        status: "pending",
      });

    res.status(201).json({
      success: true,

      message:
        "Service booking created successfully.",

      booking: {
        id: booking._id,

        bookingNumber:
          booking.bookingNumber,

        status:
          booking.status,

        serviceType:
          booking.serviceType,

        preferredDate:
          booking.preferredDate,

        preferredTime:
          booking.preferredTime,

        createdAt:
          booking.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}