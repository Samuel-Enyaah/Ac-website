import {
  randomInt,
} from "crypto";

import mongoose from "mongoose";
import { z } from "zod";

import Order from "../models/Order.js";
import Product from "../models/Product.js";

const createOrderSchema =
  z.object({
    customer: z.object({
      fullName: z
        .string()
        .trim()
        .min(2),

      phone: z
        .string()
        .trim()
        .min(9),

      email: z
        .string()
        .trim()
        .email()
        .or(z.literal(""))
        .optional(),
    }),

    items: z
      .array(
        z.object({
          product: z
            .string()
            .trim()
            .min(1),

          quantity:
            z.coerce
              .number()
              .int()
              .min(1),
        })
      )
      .min(1),

    fulfillmentMethod:
      z.enum([
        "delivery",
        "pickup",
      ]),

    deliveryAddress:
      z
        .object({
          address: z
            .string()
            .trim()
            .optional(),

          town: z
            .string()
            .trim()
            .optional(),

          landmark: z
            .string()
            .trim()
            .optional(),
        })
        .optional(),

    installationRequired:
      z.boolean().default(false),

    installationAddress:
      z
        .string()
        .trim()
        .optional(),

    paymentMethod:
      z.enum([
        "pay-on-delivery",
        "mobile-money",
        "card",
      ]),

    notes: z
      .string()
      .trim()
      .optional(),
  });

async function generateOrderNumber() {
  const year =
    new Date().getFullYear();

  for (
    let attempt = 0;
    attempt < 10;
    attempt += 1
  ) {
    const number =
      randomInt(
        100000,
        1000000
      );

    const orderNumber =
      `RJ-ORD-${year}-${number}`;

    const exists =
      await Order.exists({
        orderNumber,
      });

    if (!exists) {
      return orderNumber;
    }
  }

  throw new Error(
    "Could not generate a unique order number."
  );
}

/*
 * If something goes wrong after some
 * products were reserved, put those
 * quantities back into inventory.
 */
async function rollbackReservedStock(
  reservedItems
) {
  if (
    !reservedItems.length
  ) {
    return;
  }

  await Promise.all(
    reservedItems.map(
      (item) =>
        Product.updateOne(
          {
            _id:
              item.productId,
          },
          {
            $inc: {
              stock:
                item.quantity,
            },
          }
        )
    )
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
function normalizeItems(items) {
  const grouped =
    new Map();

  for (const item of items) {
    const current =
      grouped.get(
        item.product
      ) || 0;

    grouped.set(
      item.product,
      current +
        item.quantity
    );
  }

  return Array.from(
    grouped.entries()
  ).map(
    ([
      product,
      quantity,
    ]) => ({
      product,
      quantity,
    })
  );
}

export async function createOrder(
  req,
  res,
  next
) {
  let reservedItems = [];
  let orderCreated = false;

  try {
    const parsed =
      createOrderSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Please check the order information.",

          errors:
            parsed.error
              .flatten()
              .fieldErrors,
        });
    }

    const data =
      parsed.data;

    if (
      data.fulfillmentMethod ===
        "delivery" &&
      (
        !data.deliveryAddress
          ?.address ||
        !data.deliveryAddress
          ?.town
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Delivery address and town are required.",
        });
    }

    if (
      data.installationRequired &&
      !data.installationAddress
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Installation address is required.",
        });
    }

    const requestedItems =
      normalizeItems(
        data.items
      );

    /*
     * Validate MongoDB IDs first.
     */
    for (
      const item of
      requestedItems
    ) {
      if (
        !mongoose.isValidObjectId(
          item.product
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "One or more selected products are invalid.",
          });
      }
    }

    const orderItems = [];

    let subtotal = 0;

    /*
     * Reserve each product atomically.
     *
     * MongoDB only decreases stock when:
     *
     * - product exists
     * - product is active
     * - enough stock still exists
     *
     * This prevents two customers from
     * purchasing the same final unit.
     */
    for (
      const requestedItem of
      requestedItems
    ) {
      const product =
        await Product.findOneAndUpdate(
          {
            _id:
              requestedItem.product,

            active: true,

            stock: {
              $gte:
                requestedItem.quantity,
            },
          },

          {
            $inc: {
              stock:
                -requestedItem.quantity,
            },
          },

          {
            new: true,
          }
        );

      if (!product) {
        /*
         * Anything already reserved
         * for this attempted order must
         * be returned.
         */
        await rollbackReservedStock(
          reservedItems
        );

        reservedItems = [];

        const currentProduct =
          await Product.findById(
            requestedItem.product
          ).select(
            "name stock active"
          );

        if (
          !currentProduct ||
          !currentProduct.active
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "One of the selected products is no longer available.",
            });
        }

        return res
          .status(400)
          .json({
            success: false,

            message:
              `${currentProduct.name} only has ${currentProduct.stock} unit(s) available.`,
          });
      }

      reservedItems.push({
        productId:
          product._id,

        quantity:
          requestedItem.quantity,
      });

      const itemTotal =
        Number(
          product.price
        ) *
        requestedItem.quantity;

      subtotal += itemTotal;

      orderItems.push({
        product:
          product._id,

        name:
          product.name,

        price:
          product.price,

        quantity:
          requestedItem.quantity,
      });
    }

    /*
     * These will become configurable
     * later.
     */
    const deliveryFee = 0;
    const installationFee = 0;

    const total =
      subtotal +
      deliveryFee +
      installationFee;

    const orderNumber =
      await generateOrderNumber();

    const order =
      await Order.create({
        orderNumber,

        customer: {
          fullName:
            data.customer
              .fullName,

          phone:
            data.customer
              .phone,

          email:
            data.customer
              .email || "",
        },

        items:
          orderItems,

        fulfillmentMethod:
          data.fulfillmentMethod,

        deliveryAddress:
          data.fulfillmentMethod ===
          "delivery"
            ? {
                address:
                  data
                    .deliveryAddress
                    ?.address ||
                  "",

                town:
                  data
                    .deliveryAddress
                    ?.town ||
                  "",

                landmark:
                  data
                    .deliveryAddress
                    ?.landmark ||
                  "",
              }
            : {
                address: "",
                town: "",
                landmark: "",
              },

        installationRequired:
          data.installationRequired,

        installationAddress:
          data.installationRequired
            ? data.installationAddress
            : "",

        subtotal,

        deliveryFee,

        installationFee,

        total,

        paymentMethod:
          data.paymentMethod,

        paymentStatus:
          "pending",

        status:
          "pending",

        /*
         * Stock was successfully
         * deducted above.
         */
        stockDeducted:
          true,

        notes:
          data.notes || "",
      });

    orderCreated = true;

    res.status(201).json({
      success: true,

      message:
        "Order created successfully.",

      order: {
        id:
          order._id,

        orderNumber:
          order.orderNumber,

        status:
          order.status,

        paymentStatus:
          order.paymentStatus,

        subtotal:
          order.subtotal,

        deliveryFee:
          order.deliveryFee,

        installationFee:
          order.installationFee,

        total:
          order.total,

        createdAt:
          order.createdAt,
      },
    });
  } catch (error) {
    /*
     * Example:
     *
     * Stock decreased successfully,
     * but creating the order record
     * unexpectedly failed.
     *
     * Return the inventory.
     */
    if (
      !orderCreated &&
      reservedItems.length
    ) {
      try {
        await rollbackReservedStock(
          reservedItems
        );
      } catch (
        rollbackError
      ) {
        console.error(
          "Stock rollback failed:",
          rollbackError
        );
      }
    }

    next(error);
  }
}