import mongoose from "mongoose";
import { z } from "zod";

import Order from "../models/Order.js";

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

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getAdminOrders(req, res, next) {
  try {
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 10,
        1
      ),
      50
    );

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const paymentStatus = String(
      req.query.paymentStatus || ""
    ).trim();

    const query = {};

    if (
      status &&
      status !== "all" &&
      orderStatuses.includes(status)
    ) {
      query.status = status;
    }

    if (
      paymentStatus &&
      paymentStatus !== "all" &&
      paymentStatuses.includes(paymentStatus)
    ) {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      const regex = new RegExp(
        escapeRegex(search),
        "i"
      );

      query.$or = [
        {
          orderNumber: regex,
        },
        {
          "customer.fullName": regex,
        },
        {
          "customer.phone": regex,
        },
        {
          "customer.email": regex,
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
          (page - 1) * limit
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
            "createdAt",
          ].join(" ")
        )
        .lean(),

      Order.countDocuments(query),
    ]);

    const pages = Math.max(
      Math.ceil(total / limit),
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
    const { orderId } =
      req.params;

    if (
      !mongoose.isValidObjectId(
        orderId
      )
    ) {
      return res.status(400).json({
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
      return res.status(404).json({
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
  z.object({
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

    paymentStatus: z
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
      data.status !== undefined ||
      data.paymentStatus !== undefined,
    {
      message:
        "Nothing was provided to update.",
    }
  );

export async function updateAdminOrder(
  req,
  res,
  next
) {
  try {
    const { orderId } =
      req.params;

    if (
      !mongoose.isValidObjectId(
        orderId
      )
    ) {
      return res.status(400).json({
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
      return res.status(400).json({
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
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    if (
      parsed.data.status !==
      undefined
    ) {
      order.status =
        parsed.data.status;
    }

    if (
      parsed.data
        .paymentStatus !==
      undefined
    ) {
      order.paymentStatus =
        parsed.data.paymentStatus;
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