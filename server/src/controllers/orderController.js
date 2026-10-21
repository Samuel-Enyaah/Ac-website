import { flushOperations } from "../services/operationsOutbox.js";
import { randomUUID } from "crypto";

import mongoose from "mongoose";
import { z } from "zod";

import {
  beginReservation,
  resumeReservation,
} from "../services/orderReservations.js";
import Product from "../models/Product.js";

export const createOrderSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2),

    phone: z.string().trim().min(9),

    email: z.string().trim().email().or(z.literal("")).optional(),
  }),

  items: z
    .array(
      z.object({
        product: z.string().trim().min(1),

        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1),

  fulfillmentMethod: z.enum(["delivery", "pickup"]),

  deliveryAddress: z
    .object({
      address: z.string().trim().optional(),

      town: z.string().trim().optional(),

      landmark: z.string().trim().optional(),
    })
    .nullish(),

  installationRequired: z.boolean().default(false),

  installationAddress: z.string().trim().optional(),

  paymentMethod: z.enum(["pay-on-delivery", "mobile-money", "card"]),

  notes: z.string().trim().optional(),
});

/*
 * If something goes wrong after some
 * products were reserved, put those
 * quantities back into inventory.
 */
export async function rollbackReservedStock(reservedItems) {
  if (!reservedItems.length) {
    return;
  }

  await Promise.all(
    reservedItems.map((item) =>
      Product.updateOne(
        {
          _id: item.productId,
          ...(item.reservationId
            ? { releasedReservationIds: { $ne: item.reservationId } }
            : {}),
        },
        {
          $inc: {
            stock: item.quantity,
          },
          ...(item.reservationId
            ? { $addToSet: { releasedReservationIds: item.reservationId } }
            : {}),
        },
      ),
    ),
  );
}

/*
 * Combines duplicate product IDs.
 *
 * Example:
 * product A qty 1
 * product A qty 2
 *
 * becomes:
 * product A qty 3
 */
export function normalizeItems(items) {
  const grouped = new Map();

  for (const item of items) {
    const productId = item.product.toLowerCase();
    const current = grouped.get(productId) || 0;

    grouped.set(productId, current + item.quantity);
  }

  return Array.from(grouped.entries()).map(([product, quantity]) => ({
    product,
    quantity,
  }));
}

export async function createOrder(req, res, next) {
  try {
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,

        message: "Please check the order information.",

        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    if (
      data.fulfillmentMethod === "delivery" &&
      (!data.deliveryAddress?.address || !data.deliveryAddress?.town)
    ) {
      return res.status(400).json({
        success: false,

        message: "Delivery address and town are required.",
      });
    }

    if (data.installationRequired && !data.installationAddress) {
      return res.status(400).json({
        success: false,

        message: "Installation address is required.",
      });
    }

    const requestedItems = normalizeItems(data.items);

    /*
     * Validate MongoDB IDs first.
     */
    for (const item of requestedItems) {
      if (!mongoose.isValidObjectId(item.product)) {
        return res.status(400).json({
          success: false,

          message: "One or more selected products are invalid.",
        });
      }
    }

    if (requestedItems.some((item) => !Number.isSafeInteger(item.quantity)))
      return res
        .status(400)
        .json({ success: false, message: "Invalid order quantities." });
    data.items = requestedItems.sort((a, b) =>
      a.product.localeCompare(b.product),
    );
    const attempt = await beginReservation(
      data,
      req.get?.("Idempotency-Key") || randomUUID(),
    );
    const order = await resumeReservation(attempt._id);
    await flushOperations("order", order._id);
    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        installationFee: order.installationFee,
        total: order.total,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
