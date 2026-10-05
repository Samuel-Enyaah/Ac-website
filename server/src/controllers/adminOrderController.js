import mongoose from "mongoose";
import { z } from "zod";

import Order from "../models/Order.js";
import Product from "../models/Product.js";

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "out-for-delivery",
  "delivered",
  "cancelled",
];

const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

function escapeRegex(
  value = ""
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

export async function getAdminOrders(
  req,
  res,
  next
) {
  try {
    const page = Math.max(
      Number.parseInt(
        req.query.page,
        10
      ) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(
          req.query.limit,
          10
        ) || 10,
        1
      ),
      50
    );

    const search = String(
      req.query.search || ""
    ).trim();

    const status = String(
      req.query.status || ""
    ).trim();

    const paymentStatus =
      String(
        req.query
          .paymentStatus ||
          ""
      ).trim();

    const query = {};

    if (
      status &&
      status !== "all" &&
      orderStatuses.includes(
        status
      )
    ) {
      query.status = status;
    }

    if (
      paymentStatus &&
      paymentStatus !==
        "all" &&
      paymentStatuses.includes(
        paymentStatus
      )
    ) {
      query.paymentStatus =
        paymentStatus;
    }

    if (search) {
      const regex =
        new RegExp(
          escapeRegex(
            search
          ),
          "i"
        );

      query.$or = [
        {
          orderNumber:
            regex,
        },

        {
          "customer.fullName":
            regex,
        },

        {
          "customer.phone":
            regex,
        },

        {
          "customer.email":
            regex,
        },
      ];
    }

    const [
      orders,
      total,
    ] = await Promise.all([
      Order.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(
          (page - 1) *
            limit
        )
        .limit(limit)
        .select(
          [
            "orderNumber",
            "customer",
            "items",
            "fulfillmentMethod",
            "total",
            "status",
            "paymentStatus",
            "paymentMethod",
            "stockDeducted",
            "createdAt",
          ].join(" ")
        )
        .lean(),

      Order.countDocuments(
        query
      ),
    ]);

    const pages =
      Math.max(
        Math.ceil(
          total / limit
        ),
        1
      );

    res.status(200).json({
      success: true,

      orders,

      pagination: {
        page,
        limit,
        total,
        pages,

        hasNextPage:
          page < pages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminOrderById(
  req,
  res,
  next
) {
  try {
    const {
      orderId,
    } = req.params;

    if (
      !mongoose.isValidObjectId(
        orderId
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid order ID.",
        });
    }

    const order =
      await Order.findById(
        orderId
      ).lean();

    if (!order) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Order not found.",
        });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
}

const updateOrderSchema =
  z
    .object({
      status: z
        .enum([
          "pending",
          "confirmed",
          "processing",
          "ready",
          "out-for-delivery",
          "delivered",
          "cancelled",
        ])
        .optional(),

      paymentStatus:
        z
          .enum([
            "pending",
            "paid",
            "failed",
            "refunded",
          ])
          .optional(),
    })
    .refine(
      (data) =>
        data.status !==
          undefined ||
        data.paymentStatus !==
          undefined,
      {
        message:
          "Nothing was provided to update.",
      }
    );

async function restoreOrderStock(
  order
) {
  if (
    !order.stockDeducted
  ) {
    return;
  }

  const operations =
    order.items
      .filter(
        (item) =>
          item.product &&
          item.quantity >
            0
      )
      .map(
        (item) => ({
          updateOne: {
            filter: {
              _id:
                item.product,
            },

            update: {
              $inc: {
                stock:
                  item.quantity,
              },
            },
          },
        })
      );

  if (
    operations.length >
    0
  ) {
    await Product.bulkWrite(
      operations,
      {
        ordered: false,
      }
    );
  }

  order.stockDeducted =
    false;
}

export async function updateAdminOrder(
  req,
  res,
  next
) {
  try {
    const {
      orderId,
    } = req.params;

    if (
      !mongoose.isValidObjectId(
        orderId
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid order ID.",
        });
    }

    const parsed =
      updateOrderSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid order update.",
        });
    }

    const order =
      await Order.findById(
        orderId
      );

    if (!order) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Order not found.",
        });
    }

    const requestedStatus =
      parsed.data.status;

    /*
     * Cancellation is terminal.
     *
     * Once an order has been cancelled,
     * do not reactivate it because its
     * inventory may already have been
     * returned.
     */
    if (
      order.status ===
        "cancelled" &&
      requestedStatus &&
      requestedStatus !==
        "cancelled"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "A cancelled order cannot be reactivated. Create a new order instead.",
        });
    }

    /*
     * Delivered goods should not simply
     * be cancelled because the physical
     * items may already be with the
     * customer.
     *
     * A returns/refunds workflow will
     * handle this later.
     */
    if (
      order.status ===
        "delivered" &&
      requestedStatus ===
        "cancelled"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "A delivered order cannot be cancelled directly. Use the returns/refund process instead.",
        });
    }

    /*
     * Restore inventory when cancelling
     * an order whose stock was deducted.
     */
    if (
      requestedStatus ===
        "cancelled" &&
      order.status !==
        "cancelled" &&
      order.stockDeducted
    ) {
      await restoreOrderStock(
        order
      );
    }

    if (
      requestedStatus !==
      undefined
    ) {
      order.status =
        requestedStatus;
    }

    if (
      parsed.data
        .paymentStatus !==
      undefined
    ) {
      order.paymentStatus =
        parsed.data
          .paymentStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,

      message:
        "Order updated successfully.",

      order,
    });
  } catch (error) {
    next(error);
  }
}