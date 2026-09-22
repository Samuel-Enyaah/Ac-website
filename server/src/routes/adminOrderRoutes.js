import express from "express";

import {
  getAdminOrderById,
  getAdminOrders,
  updateAdminOrder,
} from "../controllers/adminOrderController.js";

import {
  requireAdmin,
} from "../middleware/adminAuth.js";

const router =
  express.Router();

router.use(
  requireAdmin
);

router.get(
  "/",
  getAdminOrders
);

router.get(
  "/:orderId",
  getAdminOrderById
);

router.patch(
  "/:orderId",
  updateAdminOrder
);

export default router;