import { changeOperation, operationalDetail } from "../services/operations.js";
import { operationEvent } from "../services/operationEvents.js";
import mongoose from "mongoose";

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

const paymentStatuses = ["pending", "paid", "failed", "refunded"];

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getAdminOrders(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      50,
    );

    const search = String(req.query.search || "").trim();

    const status = String(req.query.status || "").trim();

    const paymentStatus = String(req.query.paymentStatus || "").trim();

    const query = {};
    if (req.query.assignedStaff === "unassigned") {
      query.assignedStaff = null;
      query.status = { $nin: ["cancelled", "completed", "delivered"] };
    } else if (req.query.assignedStaff) {
      if (!mongoose.isValidObjectId(req.query.assignedStaff))
        return res
          .status(400)
          .json({ success: false, message: "Invalid staff filter." });
      query.assignedStaff = req.query.assignedStaff;
    }
    if (req.query.work === "action")
      query.status = {
        $in: ["confirmed", "processing", "ready", "out-for-delivery"],
      };

    if (status && status !== "all" && orderStatuses.includes(status)) {
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
      const regex = new RegExp(escapeRegex(search), "i");

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

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({
          createdAt: req.query.sort === "oldest" ? 1 : -1,
        })
        .skip((page - 1) * limit)
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
            "assignedStaff",
            "assignedStaffName",
            "assignedAt",
            "lastActivity",
            "createdAt",
          ].join(" "),
        )
        .lean(),

      Order.countDocuments(query),
    ]);

    const pages = Math.max(Math.ceil(total / limit), 1);

    res.status(200).json({
      success: true,

      orders,

      pagination: {
        page,
        limit,
        total,
        pages,

        hasNextPage: page < pages,

        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminOrderById(req, res, next) {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({
        success: false,

        message: "Order not found.",
      });
    }

    res.status(200).json({
      success: true,
      order: await operationalDetail("order", order),
    });
  } catch (error) {
    next(error);
  }
}

// Each product records the cancellation it restored in the same atomic write as its stock increment.
// This supports standalone MongoDB and lets a retry resume after a partial failure.
export async function restoreOrderStock(order, { admin, retry = false } = {}) {
  if (!order.stockDeducted) return;
  if (retry)
    await Order.updateOne(
      { _id: order._id, status: "cancelled", stockDeducted: true },
      {
        $push: {
          eventOutbox: operationEvent(
            "stock-restoration-retried",
            "Stock restoration checked or retried safely.",
            { admin },
          ),
        },
      },
    );
  const quantities = new Map();
  for (const item of order.items) {
    if (item.product && item.quantity > 0) {
      const id = String(item.product);
      quantities.set(id, (quantities.get(id) || 0) + item.quantity);
    }
  }
  for (const [productId, quantity] of quantities) {
    await Product.updateOne(
      { _id: productId, restoredOrderIds: { $ne: order._id } },
      {
        $inc: { stock: quantity, __v: 1 },
        $addToSet: { restoredOrderIds: order._id },
      },
    );
  }
  await Order.updateOne(
    { _id: order._id, status: "cancelled", stockDeducted: true },
    {
      $set: { stockDeducted: false },
      $inc: { __v: 1 },
      $push: {
        eventOutbox: operationEvent(
          "stock-restored",
          "Cancellation stock restoration completed.",
          { admin },
        ),
      },
    },
  );
  order.stockDeducted = false;
}

export async function updateAdminOrder(req, res, next) {
  try {
    const order = await changeOperation(
      "order",
      req.params.orderId,
      req.body,
      req.admin,
    );
    if (order.status === "cancelled" && order.stockDeducted)
      await restoreOrderStock(order, {
        admin: req.admin,
        retry: req.body.status === "cancelled",
      });
    res.json({
      success: true,
      message: "Order updated successfully.",
      order: await operationalDetail("order", order),
    });
  } catch (error) {
    next(error);
  }
}
