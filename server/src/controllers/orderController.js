import { randomInt } from "crypto";
import { z } from "zod";

import Order from "../models/Order.js";
import Product from "../models/Product.js";

const createOrderSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2),
    phone: z.string().trim().min(9),
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
        product: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1),
      })
    )
    .min(1),

  fulfillmentMethod: z.enum([
    "delivery",
    "pickup",
  ]),

  deliveryAddress: z
    .object({
      address: z.string().trim().optional(),
      town: z.string().trim().optional(),
      landmark: z.string().trim().optional(),
    })
    .optional(),

  installationRequired: z.boolean().default(false),

  installationAddress: z
    .string()
    .trim()
    .optional(),

  paymentMethod: z.enum([
    "pay-on-delivery",
    "mobile-money",
    "card",
  ]),

  notes: z.string().trim().optional(),
});

async function generateOrderNumber() {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const number = randomInt(
      100000,
      1000000
    );

    const orderNumber =
      `RJ-ORD-${year}-${number}`;

    const exists = await Order.exists({
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

export async function createOrder(
  req,
  res,
  next
) {
  try {
    const parsed =
      createOrderSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Please check the order information.",
        errors:
          parsed.error.flatten()
            .fieldErrors,
      });
    }

    const data = parsed.data;

    if (
      data.fulfillmentMethod ===
        "delivery" &&
      (
        !data.deliveryAddress
          ?.address ||
        !data.deliveryAddress?.town
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery address and town are required.",
      });
    }

    if (
      data.installationRequired &&
      !data.installationAddress
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Installation address is required.",
      });
    }

    const productIds =
      data.items.map(
        (item) => item.product
      );

    const products =
      await Product.find({
        _id: {
          $in: productIds,
        },
        active: true,
      });

    if (
      products.length !==
      productIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more products are unavailable.",
      });
    }

    const orderItems = [];

    let subtotal = 0;

    for (const requestedItem of data.items) {
      const product = products.find(
        (item) =>
          item._id.toString() ===
          requestedItem.product
      );

      if (!product) {
        return res.status(400).json({
          success: false,
          message:
            "A selected product could not be found.",
        });
      }

      if (
        requestedItem.quantity >
        product.stock
      ) {
        return res.status(400).json({
          success: false,
          message: `${product.name} only has ${product.stock} item(s) available.`,
        });
      }

      const itemTotal =
        product.price *
        requestedItem.quantity;

      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity:
          requestedItem.quantity,
      });
    }

    /*
     * Delivery and installation prices
     * are not automated yet.
     */
    const deliveryFee = 0;
    const installationFee = 0;

    const total =
      subtotal +
      deliveryFee +
      installationFee;

    const orderNumber =
      await generateOrderNumber();

    const order = await Order.create({
      orderNumber,

      customer: {
        fullName:
          data.customer.fullName,
        phone: data.customer.phone,
        email:
          data.customer.email || "",
      },

      items: orderItems,

      fulfillmentMethod:
        data.fulfillmentMethod,

      deliveryAddress:
        data.fulfillmentMethod ===
        "delivery"
          ? {
              address:
                data.deliveryAddress
                  ?.address || "",
              town:
                data.deliveryAddress
                  ?.town || "",
              landmark:
                data.deliveryAddress
                  ?.landmark || "",
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

      paymentStatus: "pending",
      status: "pending",

      notes: data.notes || "",
    });

    res.status(201).json({
      success: true,
      message:
        "Order created successfully.",

      order: {
        id: order._id,
        orderNumber:
          order.orderNumber,
        status: order.status,
        paymentStatus:
          order.paymentStatus,
        subtotal: order.subtotal,
        deliveryFee:
          order.deliveryFee,
        installationFee:
          order.installationFee,
        total: order.total,
        createdAt:
          order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}